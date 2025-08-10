import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { AccessTokenGuard } from '../auth/guards/access.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

class TopUpDto {
  @IsNumber()
  @Min(10000, { message: 'Minimum top-up amount is IDR 10,000' })
  @Max(10000000, { message: 'Maximum top-up amount is IDR 10,000,000' })
  @Transform(({ value }) => {
    const num = Number(value);
    return num;
  })
  amountIDR: number;
}

class AutoTopUpDto extends TopUpDto {
  // No additional fields needed - just amount
}

@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('topup/manual')
  @UseGuards(AccessTokenGuard)
  async createManualTopUp(
    @CurrentUser() user: { id: string },
    @Body() dto: TopUpDto,
  ) {
    return this.billingService.createManualTopUpIntent(user.id, dto.amountIDR);
  }

  @Post('topup/auto')
  @UseGuards(AccessTokenGuard)
  async createAutoTopUp(
    @CurrentUser() user: { id: string },
    @Body() dto: AutoTopUpDto,
  ) {
    return this.billingService.createAutoTopUpIntent(
      user.id,
      dto.amountIDR
    );
  }

  @Get('payment-methods')
  @UseGuards(AccessTokenGuard)
  async getPaymentMethods() {
    return this.billingService.getPaymentMethods();
  }

  @Get('payment-methods/check-availability')
  @UseGuards(AccessTokenGuard)
  async checkPaymentMethodsAvailability() {
    return this.billingService.checkPaymentMethodsAvailability();
  }

  @Get('payment-methods/with-availability')
  @UseGuards(AccessTokenGuard)
  async getPaymentMethodsWithAvailability() {
    return this.billingService.getPaymentMethodsWithAvailability();
  }

  @Get('merchant-info')
  @UseGuards(AccessTokenGuard)
  async getMerchantInfo() {
    return this.billingService.getMerchantInfo();
  }

  // Test endpoint tanpa authentication untuk development
  @Get('test/payment-methods-availability')
  async testPaymentMethodsAvailability() {
    try {
      const results = await this.billingService.checkPaymentMethodsAvailability();
      return {
        success: true,
        message: 'Payment methods availability test completed',
        ...results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to check payment methods availability'
      };
    }
  }

  @Get('test/merchant-info')
  async testMerchantInfo() {
    try {
      const info = await this.billingService.getMerchantInfo();
      return {
        success: true,
        message: 'Merchant info retrieved successfully',
        data: info
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get merchant info'
      };
    }
  }

  @Post('webhook/midtrans')
  @HttpCode(HttpStatus.OK)
  async handleMidtransWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ) {
    return this.billingService.handleWebhook(payload, signature);
  }

  @Get('payment/:paymentId')
  @UseGuards(AccessTokenGuard)
  async getPaymentStatus(
    @CurrentUser() user: { id: string },
    @Param('paymentId') paymentId: string,
  ) {
    return this.billingService.getPaymentStatus(paymentId, user.id);
  }

  // Admin endpoint for manual payment approval
  @Post('payment/:paymentId/approve')
  @UseGuards(AccessTokenGuard)
  async approveManualPayment(
    @CurrentUser() user: { id: string },
    @Param('paymentId') paymentId: string,
  ) {
    // Note: In a real app, you'd want to check if user is admin
    return this.billingService.approveManualPayment(paymentId, user.id);
  }

  // Development helper - check and update payment status manually
  @Post('payment/:orderId/check-status')
  @UseGuards(AccessTokenGuard)
  async checkAndUpdatePaymentStatus(
    @CurrentUser() user: { id: string },
    @Param('orderId') orderId: string,
  ) {
    return this.billingService.checkAndUpdatePaymentStatus(orderId, user.id);
  }
}