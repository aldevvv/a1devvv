import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { AuditService } from './audit.service';

export interface AuditLogFilters {
  operation?: string;
  userId?: string;
  adminId?: string;
  status?: 'SUCCESS' | 'FAILED' | 'PENDING';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

@Controller('admin/audit')
@UseGuards(AccessTokenGuard, AdminGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getAuditLogs(
    @Query() filters: AuditLogFilters,
    @Request() req: any
  ) {
    // Log admin access to audit logs
    await this.auditService.logAdminAction(
      'VIEW_AUDIT_LOGS',
      req.user.id,
      undefined,
      { filters },
      req
    );

    return this.auditService.getAuditLogs(filters);
  }

  @Get('stats')
  async getAuditStats(@Request() req: any) {
    // Log admin access to audit stats
    await this.auditService.logAdminAction(
      'VIEW_AUDIT_STATS',
      req.user.id,
      undefined,
      {},
      req
    );

    return this.auditService.getAuditStats();
  }

  @Get('security-events')
  async getSecurityEvents(
    @Request() req: any,
    @Query('limit') limit?: number
  ) {
    // Log admin access to security events
    await this.auditService.logAdminAction(
      'VIEW_SECURITY_EVENTS',
      req.user.id,
      undefined,
      { limit: limit || 100 },
      req
    );

    return this.auditService.getRecentSecurityEvents(limit || 100);
  }

  @Get('admin-actions')
  async getAdminActions(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('adminId') adminId?: string
  ) {
    // Log admin access to admin actions
    await this.auditService.logAdminAction(
      'VIEW_ADMIN_ACTIONS',
      req.user.id,
      undefined,
      { limit: limit || 100, targetAdminId: adminId },
      req
    );

    return this.auditService.getAdminActions(limit || 100, adminId);
  }

  @Get('failed-logins')
  async getFailedLogins(
    @Request() req: any,
    @Query('userId') userId?: string,
    @Query('limit') limit?: number
  ) {
    // Log admin access to failed logins
    await this.auditService.logAdminAction(
      'VIEW_FAILED_LOGINS',
      req.user.id,
      userId,
      { limit: limit || 100 },
      req
    );

    return this.auditService.getFailedLogins(limit || 100, userId);
  }
}
