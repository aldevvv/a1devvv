import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { BillingModule } from './billing/billing.module';
import { AdminModule } from './admin/admin.module';
import { CheckoutModule } from './checkout/checkout.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { DownloadModule } from './download/download.module';
import { ContactModule } from './contact/contact.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    UserModule,
    WalletModule,
    BillingModule,
    AdminModule,
    CheckoutModule,
    MarketplaceModule,
    WishlistModule,
    CartModule,
    OrdersModule,
    DownloadModule,
    ContactModule,
  ],
})
export class AppModule {}
