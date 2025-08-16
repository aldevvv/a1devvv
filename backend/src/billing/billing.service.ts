import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { LedgerKind, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { XenditService } from './xendit.service';
import crypto from 'crypto';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private xendit: XenditService,
  ) {}

  async createManualTopUpIntent(userId: string, amountIDR: number) {
    this.validateAmount(amountIDR);

    const orderId = this.generateOrderId('MANUAL');
    
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        orderId,
        grossIDR: amountIDR,
        status: PaymentStatus.PENDING,
        method: 'manual_transfer',
      },
    });

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      amountIDR,
      instructions: {
        bankName: 'Bank BCA',
        accountNumber: '1234567890',
        accountName: 'A1Dev Platform',
        amount: amountIDR,
        note: `Transfer untuk top-up ${orderId}`,
      },
    };
  }

  async createAutoTopUpIntent(userId: string, amountIDR: number) {
    console.log('createAutoTopUpIntent called with:', { userId, amountIDR });
    
    this.validateAmount(amountIDR);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Ensure wallet exists
    await this.walletService.ensureWalletExists(userId);

    const orderId = this.generateOrderId('AUTO');
    
    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        orderId,
        grossIDR: amountIDR,
        status: PaymentStatus.PENDING,
        method: 'xendit_checkout',
      },
    });

    try {
      // Prepare customer details
      const customerDetails = {
        first_name: user.fullName,
        email: user.email,
      };

      // Create Xendit invoice/checkout - let user choose payment method on Xendit's page
      const xenditResponse = await this.xendit.createPayment(
        orderId,
        amountIDR,
        customerDetails
      );

      // Update payment with Xendit response
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          raw: xenditResponse,
          provider: 'xendit',
        },
      });

      return {
        paymentId: payment.id,
        orderId,
        amountIDR,
        redirectUrl: xenditResponse.invoice_url,
        invoiceId: xenditResponse.id,
        message: 'Payment created successfully. You will be redirected to complete the payment.',
      };
    } catch (error) {
      console.error('Error creating Xendit payment:', error);
      // Update payment status to failed
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAIL },
      });
      throw error;
    }
  }

  async getPaymentMethods() {
    const result = await this.xendit.getPaymentMethods();
    return result.payment_methods || result;
  }

  async checkPaymentMethodsAvailability() {
    return this.xendit.checkPaymentMethodsAvailability();
  }

  async getPaymentMethodsWithAvailability() {
    return this.xendit.getPaymentMethods(true);
  }

  async getMerchantInfo() {
    return this.xendit.getMerchantInfo();
  }

  async handleWebhook(payload: any, signature: string) {
    // Verify signature
    if (!this.xendit.verifyWebhookSignature(payload, signature)) {
      throw new BadRequestException('Invalid signature');
    }

    const orderId = payload.external_id;
    const transactionStatus = payload.status;

    // Find payment
    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check idempotency
    const newStatus = this.xendit.mapXenditStatus(transactionStatus);
    if (payment.status === newStatus) {
      return { message: 'Already processed' };
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus as PaymentStatus,
        raw: payload,
      },
    });

    // If payment is settled, add to wallet
    if (newStatus === PaymentStatus.SETTLED) {
      await this.walletService.addLedgerEntry(
        payment.userId,
        payment.grossIDR,
        LedgerKind.TOPUP,
        `Auto top-up via ${payment.provider} - Order ${orderId}`,
      );
    }

    return { message: 'Webhook processed successfully' };
  }

  async approveManualPayment(paymentId: string, adminUserId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending');
    }

    if (payment.method !== 'manual_transfer') {
      throw new BadRequestException('Not a manual payment');
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.SETTLED,
        raw: { approvedBy: adminUserId, approvedAt: new Date() },
      },
    });

    // Add to wallet
    await this.walletService.addLedgerEntry(
      payment.userId,
      payment.grossIDR,
      LedgerKind.TOPUP,
      { paymentId: payment.id, orderId: payment.orderId, approvedBy: adminUserId },
    );

    return { message: 'Payment approved' };
  }

  async getPaymentStatus(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
      select: {
        id: true,
        orderId: true,
        grossIDR: true,
        status: true,
        method: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Get latest status from Xendit if payment is still pending
    if (payment.status === PaymentStatus.PENDING && payment.method !== 'manual_transfer') {
      try {
        const xenditStatus = await this.xendit.getPaymentStatus(payment.orderId);
        const newStatus = this.xendit.mapXenditStatus(xenditStatus.status);

        // Update if status changed
        if (payment.status !== newStatus) {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: newStatus as PaymentStatus,
              raw: xenditStatus,
            },
          });
          payment.status = newStatus as PaymentStatus;
        }
      } catch (error) {
        // If Xendit API fails, just return current status
        console.error('Failed to get payment status from Xendit:', error);
      }
    }

    return payment;
  }

  async checkAndUpdatePaymentStatus(orderId: string, userId: string) {
    // Find payment belonging to the user
    const payment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        userId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return {
        message: 'Payment already processed',
        status: payment.status,
        orderId: payment.orderId,
      };
    }

    try {
      // Check status from Xendit
      const xenditStatus = await this.xendit.getPaymentStatus(payment.orderId);
      const newStatus = this.xendit.mapXenditStatus(xenditStatus.status);

      console.log('Payment status check:', {
        orderId,
        currentStatus: payment.status,
        xenditStatus: xenditStatus.status,
        newStatus,
      });

      if (payment.status !== newStatus) {
        // Update payment status
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: newStatus as PaymentStatus,
            raw: xenditStatus,
          },
        });

        // If payment is settled, add to wallet
        if (newStatus === PaymentStatus.SETTLED) {
          console.log('Payment settled, adding to wallet:', {
            userId: payment.userId,
            amount: payment.grossIDR,
          });

          await this.walletService.addLedgerEntry(
            payment.userId,
            payment.grossIDR,
            LedgerKind.TOPUP,
            {
              paymentId: payment.id,
              orderId: payment.orderId,
              provider: 'xendit',
            },
          );

          return {
            message: 'Payment confirmed and balance updated',
            status: newStatus,
            orderId: payment.orderId,
            amountAdded: payment.grossIDR,
          };
        }

        return {
          message: 'Payment status updated',
          status: newStatus,
          orderId: payment.orderId,
        };
      }

      return {
        message: 'Payment status unchanged',
        status: payment.status,
        orderId: payment.orderId,
      };
    } catch (error) {
      console.error('Failed to check payment status:', error);
      throw new BadRequestException('Failed to check payment status');
    }
  }

  private validateAmount(amountIDR: number) {
    if (!amountIDR || amountIDR < 5000) {
      throw new BadRequestException('Minimum top-up amount is IDR 5,000');
    }
    if (amountIDR > 10000000) {
      throw new BadRequestException('Maximum top-up amount is IDR 10,000,000');
    }
    // Ensure amount is a whole number
    if (!Number.isInteger(amountIDR)) {
      throw new BadRequestException('Amount must be a whole number');
    }
  }

  private generateOrderId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  private extractPaymentInstructions(xenditResponse: any) {
    // Xendit Invoice response structure
    const amount = xenditResponse.amount;
    const expiry = xenditResponse.expiry_date;
    const invoiceUrl = xenditResponse.invoice_url;
    
    // For Xendit Checkout, we primarily use the invoice URL
    return {
      type: 'checkout',
      invoiceUrl: invoiceUrl,
      amount: amount,
      expiry: expiry,
      status: xenditResponse.status,
      description: xenditResponse.description,
      paymentMethods: xenditResponse.available_payment_methods || [],
      instructions: 'Please complete payment using the provided checkout link',
    };
  }
}