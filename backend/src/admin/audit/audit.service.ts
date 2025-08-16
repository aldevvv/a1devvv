import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService as BaseAuditService, AuditLogData } from '../../common/services/audit.service';
import { AuditLogFilters } from './audit.controller';

@Injectable()
export class AuditService {
  private baseAuditService: BaseAuditService;
  
  constructor(private readonly prisma: PrismaService) {
    this.baseAuditService = new BaseAuditService(prisma);
  }

  // Delegate base audit methods to the base service
  async log(data: AuditLogData): Promise<void> {
    return this.baseAuditService.log(data);
  }

  async logWalletOperation(
    operation: string,
    userId: string,
    adminId?: string,
    amount?: number,
    metadata?: Record<string, any>,
    request?: any
  ): Promise<void> {
    return this.baseAuditService.logWalletOperation(operation, userId, adminId, amount, metadata, request);
  }

  async logAdminAction(
    operation: string,
    adminId: string,
    targetUserId?: string,
    metadata?: Record<string, any>,
    request?: any
  ): Promise<void> {
    return this.baseAuditService.logAdminAction(operation, adminId, targetUserId, metadata, request);
  }

  async logSecurityEvent(
    operation: string,
    userId?: string,
    metadata?: Record<string, any>,
    request?: any
  ): Promise<void> {
    return this.baseAuditService.logSecurityEvent(operation, userId, metadata, request);
  }

  async getRecentFailedAttempts(userId: string, operation: string, minutesAgo?: number): Promise<number> {
    return this.baseAuditService.getRecentFailedAttempts(userId, operation, minutesAgo);
  }

  async getRecentSecurityEvents(limit?: number) {
    return this.baseAuditService.getRecentSecurityEvents(limit);
  }

  async getAuditLogs(filters: AuditLogFilters) {
    const {
      operation,
      userId,
      adminId,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = filters;

    const where: any = {};

    if (operation) {
      where.operation = { contains: operation, mode: 'insensitive' };
    }

    if (userId) {
      where.userId = userId;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: Math.min(limit, 100), // Max 100 records at once
        skip: offset
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return {
      logs: logs.map(log => ({
        ...log,
        metadata: this.parseMetadata(log.metadata)
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit
      }
    };
  }

  async getAuditStats() {
    const [
      totalLogs,
      successfulOperations,
      failedOperations,
      adminActions,
      securityEvents,
      walletOperations,
      recentActivity
    ] = await Promise.all([
      // Total audit logs
      this.prisma.auditLog.count(),

      // Successful operations (last 24h)
      this.prisma.auditLog.count({
        where: {
          status: 'SUCCESS',
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Failed operations (last 24h)
      this.prisma.auditLog.count({
        where: {
          status: 'FAILED',
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Admin actions (last 7 days)
      this.prisma.auditLog.count({
        where: {
          operation: { startsWith: 'ADMIN_' },
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Security events (last 7 days)
      this.prisma.auditLog.count({
        where: {
          operation: { startsWith: 'SECURITY_' },
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Wallet operations (last 7 days)
      this.prisma.auditLog.count({
        where: {
          operation: { startsWith: 'WALLET_' },
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Recent activity by operation type
      this.prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN operation LIKE 'ADMIN_%' THEN 'Admin Actions'
            WHEN operation LIKE 'SECURITY_%' THEN 'Security Events'
            WHEN operation LIKE 'WALLET_%' THEN 'Wallet Operations'
            ELSE 'Other'
          END as category,
          COUNT(*)::int as count,
          MAX(timestamp) as lastActivity
        FROM "AuditLog"
        WHERE timestamp >= NOW() - INTERVAL '7 days'
        GROUP BY category
        ORDER BY count DESC
      `
    ]);

    return {
      totalLogs,
      last24Hours: {
        successful: successfulOperations,
        failed: failedOperations
      },
      last7Days: {
        adminActions,
        securityEvents,
        walletOperations
      },
      categoryBreakdown: recentActivity
    };
  }

  async getAdminActions(limit: number = 100, adminId?: string) {
    const where: any = {
      operation: { startsWith: 'ADMIN_' }
    };

    if (adminId) {
      where.adminId = adminId;
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return logs.map(log => ({
      ...log,
      metadata: this.parseMetadata(log.metadata)
    }));
  }

  async getFailedLogins(limit: number = 100, userId?: string) {
    const where: any = {
      operation: { in: ['SECURITY_LOGIN_FAILED', 'SECURITY_AUTH_FAILED'] }
    };

    if (userId) {
      where.userId = userId;
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return logs.map(log => ({
      ...log,
      metadata: this.parseMetadata(log.metadata)
    }));
  }

  async getSecurityEventStats() {
    const stats = await this.prisma.$queryRaw`
      SELECT 
        operation,
        COUNT(*)::int as count,
        MAX(timestamp) as lastOccurrence,
        COUNT(DISTINCT "userId")::int as uniqueUsers,
        COUNT(DISTINCT "ipAddress")::int as uniqueIPs
      FROM "AuditLog"
      WHERE operation LIKE 'SECURITY_%'
        AND timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY operation
      ORDER BY count DESC
    `;

    return stats;
  }

  async getUserActivitySummary(userId: string, days: number = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalActions, failedActions, operations] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          userId,
          timestamp: { gte: since }
        }
      }),

      this.prisma.auditLog.count({
        where: {
          userId,
          status: 'FAILED',
          timestamp: { gte: since }
        }
      }),

      this.prisma.$queryRaw`
        SELECT 
          operation,
          COUNT(*)::int as count,
          MAX(timestamp) as lastOccurrence
        FROM "AuditLog"
        WHERE "userId" = ${userId}
          AND timestamp >= ${since}
        GROUP BY operation
        ORDER BY count DESC
        LIMIT 10
      `
    ]);

    return {
      userId,
      period: `${days} days`,
      totalActions,
      failedActions,
      successRate: totalActions > 0 ? ((totalActions - failedActions) / totalActions * 100).toFixed(2) + '%' : '100%',
      topOperations: operations
    };
  }

  private parseMetadata(metadata: any): any {
    if (!metadata) return null;
    
    try {
      return typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    } catch (error) {
      return metadata;
    }
  }
}
