import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { AuthService } from '../../auth/auth.service';

@Controller('admin/sessions')
@UseGuards(AccessTokenGuard, AdminGuard)
export class SessionsController {
  constructor(private readonly authService: AuthService) {}

  @Get('stats')
  async getSessionStats() {
    return this.authService.getSessionStats();
  }

  @Post('cleanup')
  async cleanupExpiredData() {
    const result = await this.authService.cleanupExpiredData();
    return {
      success: true,
      message: `Cleaned up ${result.sessionsDeleted} expired sessions and ${result.tokensDeleted} expired tokens`,
      ...result
    };
  }
}
