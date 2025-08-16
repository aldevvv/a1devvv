import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../admin/products/products.module';
import { PromosModule } from '../admin/promos/promos.module';
import { WalletModule } from '../wallet/wallet.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    PromosModule,
    WalletModule,
    BillingModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
