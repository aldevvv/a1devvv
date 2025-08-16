import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService], // Export WalletService so it can be used in other modules
})
export class WalletModule {}
