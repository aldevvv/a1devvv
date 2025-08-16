import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { XenditService } from './xendit.service';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, WalletModule, AuthModule],
  controllers: [BillingController],
  providers: [BillingService, XenditService],
  exports: [BillingService, XenditService],
})
export class BillingModule {}
