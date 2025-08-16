import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AccessTokenGuard } from '../auth/guards/access.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('wallet')
@UseGuards(AccessTokenGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: { id: string }) {
    return this.walletService.getWalletSummary(user.id);
  }

  @Get('statistics')
  async getStatistics(@CurrentUser() user: { id: string }) {
    return this.walletService.getWalletStatistics(user.id);
  }

  @Get('ledger')
  async getLedger(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('kind') kind?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    
    return this.walletService.getLedgerHistory(
      user.id,
      pageNum > 0 ? pageNum : 1,
      limitNum > 0 && limitNum <= 100 ? limitNum : 20,
      kind,
    );
  }
}