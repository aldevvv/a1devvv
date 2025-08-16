import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CheckoutService } from './checkout.service';
import { ApplyPromoDto } from './dto/apply-promo.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { AccessTokenGuard } from '../auth/guards/access.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';

enum PaymentMethod {
  BALANCE = 'balance',
  XENDIT = 'xendit',
}

class CheckoutDto {
  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  promoCode?: string;
}

class SingleCheckoutDto {
  @IsString()
  productId: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  promoCode?: string;
}

@Controller('checkout')
@UseGuards(AccessTokenGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('apply-promo')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Rate limit: 10 requests per minute
  async applyPromo(
    @Body() applyPromoDto: ApplyPromoDto,
    @CurrentUser() user: { id: string }
  ): Promise<any> {
    return this.checkoutService.applyPromo(applyPromoDto, user.id);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirmOrder(
    @Body() confirmOrderDto: ConfirmOrderDto,
    @CurrentUser() user: { id: string }
  ): Promise<any> {
    return this.checkoutService.confirmOrder(confirmOrderDto, user.id);
  }

  @Post('single')
  @HttpCode(HttpStatus.OK)
  async checkoutSingleProduct(
    @Body() dto: SingleCheckoutDto,
    @CurrentUser() user: { id: string }
  ): Promise<any> {
    return this.checkoutService.checkoutSingleProduct(
      user.id,
      dto.productId,
      dto.paymentMethod,
      dto.promoCode,
    );
  }

  @Post('cart')
  @HttpCode(HttpStatus.OK)
  async checkoutCart(
    @Body() dto: CheckoutDto,
    @CurrentUser() user: { id: string }
  ): Promise<any> {
    return this.checkoutService.checkoutMultipleProducts(
      user.id,
      dto.productIds,
      dto.paymentMethod,
      dto.promoCode,
    );
  }

  @Get('preview/:productId')
  async previewCheckout(
    @Param('productId') productId: string,
    @CurrentUser() user: { id: string }
  ): Promise<any> {
    return this.checkoutService.getCheckoutPreview(user.id, productId);
  }

  @Get('cart-preview')
  async previewCartCheckout(
    @CurrentUser() user: { id: string }
  ): Promise<any> {
    return this.checkoutService.getCartCheckoutPreview(user.id);
  }

  @Get('order/:orderId')
  async getOrderStatus(
    @Param('orderId') orderId: string,
    @CurrentUser() user: { id: string }
  ): Promise<any> {
    return this.checkoutService.getOrderStatus(user.id, orderId);
  }
}
