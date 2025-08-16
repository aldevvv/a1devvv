import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../../wallet/wallet.service';
import { ManualTopUpDto, AdjustBalanceDto, ProcessTopUpProofDto } from './dto/wallets.dto';
import { LedgerKind, PaymentStatus } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WalletsService {
  private supabase;

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private configService: ConfigService,
  ) {
    // Initialize Supabase client
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async getAllWallets(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [wallets, total] = await Promise.all([
      this.prisma.balanceAccount.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              ledger: true,
            },
          },
        },
        orderBy: { balanceIDR: 'desc' },
      }),
      this.prisma.balanceAccount.count(),
    ]);

    // Get additional statistics for each wallet
    const walletsWithStats = await Promise.all(
      wallets.map(async (wallet) => {
        const lastTransaction = await this.prisma.balanceLedger.findFirst({
          where: { accountUserId: wallet.userId },
          orderBy: { createdAt: 'desc' },
          select: {
            amountIDR: true,
            kind: true,
            createdAt: true,
          },
        });

        return {
          ...wallet,
          lastTransaction,
        };
      }),
    );

    return {
      data: walletsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOverallStatistics() {
    const [
      totalBalance,
      totalUsers,
      totalTopUps,
      totalDebits,
      todayTopUps,
      pendingTopUps,
    ] = await Promise.all([
      // Total balance across all wallets
      this.prisma.balanceAccount.aggregate({
        _sum: { balanceIDR: true },
      }),
      // Total number of wallet users
      this.prisma.balanceAccount.count(),
      // Total top-ups all time
      this.prisma.balanceLedger.aggregate({
        where: { kind: LedgerKind.TOPUP },
        _sum: { amountIDR: true },
        _count: true,
      }),
      // Total debits all time
      this.prisma.balanceLedger.aggregate({
        where: { kind: LedgerKind.DEBIT },
        _sum: { amountIDR: true },
        _count: true,
      }),
      // Today's top-ups
      this.prisma.balanceLedger.aggregate({
        where: {
          kind: LedgerKind.TOPUP,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { amountIDR: true },
        _count: true,
      }),
      // Pending manual top-up requests
      this.prisma.payment.count({
        where: {
          status: PaymentStatus.PENDING,
          method: 'manual_transfer',
        },
      }),
    ]);

    return {
      totalBalance: totalBalance._sum.balanceIDR || 0,
      totalUsers,
      totalTopUps: {
        amount: totalTopUps._sum.amountIDR || 0,
        count: totalTopUps._count || 0,
      },
      totalDebits: {
        amount: Math.abs(totalDebits._sum.amountIDR || 0),
        count: totalDebits._count || 0,
      },
      todayTopUps: {
        amount: todayTopUps._sum.amountIDR || 0,
        count: todayTopUps._count || 0,
      },
      pendingTopUps,
    };
  }

  async getUserWallet(userId: string) {
    const wallet = await this.prisma.balanceAccount.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Get wallet statistics
    const stats = await this.walletService.getWalletStatistics(userId);

    // Get recent transactions
    const recentTransactions = await this.prisma.balanceLedger.findMany({
      where: { accountUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amountIDR: true,
        kind: true,
        reference: true,
        createdAt: true,
      },
    });

    return {
      ...wallet,
      statistics: stats,
      recentTransactions,
    };
  }

  async getUserLedger(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get current balance
    const account = await this.prisma.balanceAccount.findUnique({
      where: { userId },
      select: { balanceIDR: true },
    });

    if (!account) {
      throw new NotFoundException('Wallet not found');
    }

    // Get all ledger entries to calculate running balance
    const [allEntries, total] = await Promise.all([
      this.prisma.balanceLedger.findMany({
        where: { accountUserId: userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amountIDR: true,
          kind: true,
          reference: true,
          createdAt: true,
        },
      }),
      this.prisma.balanceLedger.count({
        where: { accountUserId: userId },
      }),
    ]);

    // Calculate running balance for each entry
    let runningBalance = account.balanceIDR;
    const entriesWithBalance = allEntries.map((entry, index) => {
      const balanceAfter = runningBalance;
      // For next iteration, subtract the current transaction
      runningBalance -= entry.amountIDR;
      
      // Extract description from reference if it's an object
      let description = 'Transaction';
      if (entry.reference) {
        if (typeof entry.reference === 'string') {
          description = entry.reference;
        } else if (typeof entry.reference === 'object') {
          const ref = entry.reference as any;
          if (ref.description) {
            description = ref.description;
          } else if (ref.type) {
            description = ref.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (ref.notes) {
              description += ` - ${ref.notes}`;
            } else if (ref.reason) {
              description += ` - ${ref.reason}`;
            }
          } else if (ref.orderId) {
            description = `Order: ${ref.orderId}`;
          } else if (ref.paymentId) {
            description = `Payment: ${ref.paymentId}`;
          }
        }
      }
      
      return {
        ...entry,
        description,
        balanceIDR: balanceAfter,
      };
    });

    // Get paginated entries
    const paginatedEntries = entriesWithBalance.slice(skip, skip + limit);

    return {
      data: paginatedEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async manualTopUp(userId: string, dto: ManualTopUpDto, adminId?: string) {
    // Ensure wallet exists
    await this.walletService.ensureWalletExists(userId);

    // Create ledger entry for manual top-up
    const ledgerEntry = await this.walletService.addLedgerEntry(
      userId,
      dto.amount,
      LedgerKind.TOPUP,
      {
        type: 'manual_topup',
        description: dto.description,
        reference: dto.reference,
        adminId,
        timestamp: new Date().toISOString(),
      },
    );

    return {
      success: true,
      message: `Successfully added IDR ${dto.amount.toLocaleString()} to wallet`,
      ledgerEntry,
    };
  }

  async adjustBalance(userId: string, dto: AdjustBalanceDto, adminId?: string) {
    // Ensure wallet exists
    await this.walletService.ensureWalletExists(userId);

    // Check if adjustment would result in negative balance
    if (dto.amount < 0) {
      const wallet = await this.prisma.balanceAccount.findUnique({
        where: { userId },
      });
      
      if (wallet && wallet.balanceIDR + dto.amount < 0) {
        throw new BadRequestException('Adjustment would result in negative balance');
      }
    }

    // Create ledger entry for adjustment
    const kind = dto.amount > 0 ? LedgerKind.ADJUST : LedgerKind.DEBIT;
    const ledgerEntry = await this.walletService.addLedgerEntry(
      userId,
      dto.amount,
      kind,
      {
        type: 'admin_adjustment',
        reason: dto.reason,
        reference: dto.reference,
        adminId,
        timestamp: new Date().toISOString(),
      },
    );

    return {
      success: true,
      message: `Balance adjusted by IDR ${dto.amount.toLocaleString()}`,
      ledgerEntry,
    };
  }

  async getTopUpRequests(status?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = {
      method: 'manual_transfer',
    };

    if (status) {
      where.status = status.toUpperCase() as PaymentStatus;
    }

    const [requests, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    // Extract proof URLs from metadata
    const requestsWithProof = requests.map(request => {
      const metadata = request.raw as any;
      return {
        ...request,
        proofUrl: metadata?.proofUrl || null,
        uploadedAt: metadata?.uploadedAt || null,
        bankName: metadata?.bankName || null,
        accountName: metadata?.accountName || null,
        transferDate: metadata?.transferDate || null,
      };
    });

    return {
      data: requestsWithProof,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async processTopUpProof(
    paymentId: string,
    action: 'approve' | 'reject',
    dto: ProcessTopUpProofDto,
    adminId?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not in pending status');
    }

    if (action === 'approve') {
      const amount = dto.approvedAmount || payment.grossIDR;

      // Update payment status
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.SETTLED,
          raw: {
            ...(payment.raw as any || {}),
            approvedBy: adminId,
            approvedAt: new Date().toISOString(),
            approvalNotes: dto.notes,
            approvedAmount: amount,
          },
        },
      });

      // Add balance to user wallet
      await this.walletService.ensureWalletExists(payment.userId);
      await this.walletService.addLedgerEntry(
        payment.userId,
        amount,
        LedgerKind.TOPUP,
        {
          type: 'manual_transfer',
          paymentId,
          orderId: payment.orderId,
          approvedBy: adminId,
          notes: dto.notes,
        },
      );

      return {
        success: true,
        message: `Top-up approved. IDR ${amount.toLocaleString()} added to user wallet`,
      };
    } else {
      // Reject the payment
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAIL,
          raw: {
            ...(payment.raw as any || {}),
            rejectedBy: adminId,
            rejectedAt: new Date().toISOString(),
            rejectionNotes: dto.notes,
          },
        },
      });

      return {
        success: true,
        message: 'Top-up request rejected',
      };
    }
  }

  async uploadTopUpProof(paymentId: string, file: Express.Multer.File, userId?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${paymentId}_${timestamp}.${fileExt}`;
    const filePath = `proofs/${fileName}`;

    try {
      // Upload to Supabase Storage - topup-proof bucket
      const { data, error } = await this.supabase.storage
        .from('topup-proof')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new BadRequestException(`Failed to upload proof: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('topup-proof')
        .getPublicUrl(filePath);

      // Update payment metadata with proof URL
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          raw: {
            ...(payment.raw as any || {}),
            proofUrl: publicUrl,
            proofFileName: fileName,
            uploadedAt: new Date().toISOString(),
            uploadedBy: userId,
          },
        },
      });

      return {
        success: true,
        message: 'Proof uploaded successfully',
        proofUrl: publicUrl,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to upload proof');
    }
  }
}
