import { Injectable, NotFoundException } from '@nestjs/common';
import { LedgerKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWalletSummary(userId: string) {
    const account = await this.prisma.balanceAccount.findUnique({
      where: { userId },
      select: {
        balanceIDR: true,
        updatedAt: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      balanceIDR: account.balanceIDR,
      lastUpdatedAt: account.updatedAt,
    };
  }

  async getLedgerHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    kind?: string,
  ) {
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: any = { accountUserId: userId };
    
    // Add kind filter if provided
    if (kind && kind !== 'all') {
      where.kind = kind.toUpperCase() as LedgerKind;
    }

    const [ledger, total] = await Promise.all([
      this.prisma.balanceLedger.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          amountIDR: true,
          kind: true,
          reference: true,
          createdAt: true,
        },
      }),
      this.prisma.balanceLedger.count({
        where,
      }),
    ]);

    return {
      data: ledger,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getWalletStatistics(userId: string) {
    // Get all ledger entries for this user
    const ledgerEntries = await this.prisma.balanceLedger.findMany({
      where: { accountUserId: userId },
      select: {
        amountIDR: true,
        kind: true,
        createdAt: true,
      },
    });

    // Calculate statistics
    let totalEarned = 0;
    let totalWithdrawn = 0;
    let thisMonth = 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    ledgerEntries.forEach(entry => {
      const entryMonth = new Date(entry.createdAt).getMonth();
      const entryYear = new Date(entry.createdAt).getFullYear();

      // Calculate total earned (TOPUP + REFUND)
      if (entry.kind === 'TOPUP' || entry.kind === 'REFUND') {
        totalEarned += entry.amountIDR;
      }

      // Calculate total withdrawn (DEBIT - negative amounts)
      if (entry.kind === 'DEBIT') {
        totalWithdrawn += Math.abs(entry.amountIDR);
      }

      // Calculate this month's activity
      if (entryMonth === currentMonth && entryYear === currentYear) {
        if (entry.kind === 'TOPUP' || entry.kind === 'REFUND') {
          thisMonth += entry.amountIDR;
        }
      }
    });

    return {
      totalEarned,
      totalWithdrawn,
      thisMonth,
    };
  }

  async addLedgerEntry(
    userId: string,
    amountIDR: number,
    kind: LedgerKind,
    reference?: any,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // Create ledger entry
      const ledgerEntry = await tx.balanceLedger.create({
        data: {
          accountUserId: userId,
          amountIDR,
          kind,
          reference,
        },
      });

      // Update balance
      await tx.balanceAccount.update({
        where: { userId },
        data: {
          balanceIDR: {
            increment: amountIDR,
          },
        },
      });

      return ledgerEntry;
    });
  }

  async ensureWalletExists(userId: string) {
    const existing = await this.prisma.balanceAccount.findUnique({
      where: { userId },
    });

    if (!existing) {
      await this.prisma.balanceAccount.create({
        data: { userId },
      });
    }
  }

}
