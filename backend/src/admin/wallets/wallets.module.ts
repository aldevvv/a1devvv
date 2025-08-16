import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletModule } from '../../wallet/wallet.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../auth/auth.module';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [PrismaModule, WalletModule, ConfigModule, AuthModule, CommonModule],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
