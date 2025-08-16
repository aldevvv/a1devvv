import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogData {
  operation: string;
  userId?: string;
  adminId?: string;
  ipAddress?: string;
  userAgent?: string;
  amount?: number;
  metadata?: Record<string, any>;
  status?: 'SUCCESS' | 'FAILED' | 'PENDING';
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          operation: data.operation,
          userId: data.userId,
          adminId: data.adminId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          amount: data.amount,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
          status: data.status || 'SUCCESS',
          timestamp: new Date(),
        },
      });

      this.logger.log(`Audit logged: ${data.operation} by ${data.adminId || data.userId}`);
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      // Don't throw error to prevent breaking the main operation
    }
  }

  async logWalletOperation(
    operation: string,
    userId: string,
    adminId?: string,
    amount?: number,
    metadata?: Record<string, any>,
    request?: any
  ): Promise<void> {
    await this.log({
      operation: `WALLET_${operation}`,
      userId,
      adminId,
      amount,
      metadata,
      ipAddress: this.getClientIP(request),
      userAgent: this.getUserAgent(request),
      status: 'SUCCESS',
    });
  }

  async logAdminAction(
    operation: string,
    adminId: string,
    targetUserId?: string,
    metadata?: Record<string, any>,
    request?: any
  ): Promise<void> {
    await this.log({
      operation: `ADMIN_${operation}`,
      userId: targetUserId,
      adminId,
      metadata,
      ipAddress: this.getClientIP(request),
      userAgent: this.getUserAgent(request),
      status: 'SUCCESS',
    });
  }

  async logSecurityEvent(
    operation: string,
    userId?: string,
    metadata?: Record<string, any>,
    request?: any
  ): Promise<void> {
    await this.log({
      operation: `SECURITY_${operation}`,
      userId,
      metadata,
      ipAddress: this.getClientIP(request),
      userAgent: this.getUserAgent(request),
      status: 'FAILED',
    });
  }

  private getClientIP(request: any): string | undefined {
    if (!request) return undefined;
    
    return (
      request.headers['cf-connecting-ip'] ||
      request.headers['x-real-ip'] ||
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip
    );
  }

  private getUserAgent(request: any): string | undefined {
    if (!request) return undefined;
    return request.headers['user-agent'];
  }

  // Query methods for security monitoring
  async getRecentFailedAttempts(
    userId: string,
    operation: string,
    minutesAgo: number = 15
  ): Promise<number> {
    const since = new Date(Date.now() - minutesAgo * 60 * 1000);
    
    const count = await this.prisma.auditLog.count({
      where: {
        userId,
        operation,
        status: 'FAILED',
        timestamp: {
          gte: since,
        },
      },
    });

    return count;
  }

  async getRecentSecurityEvents(limit: number = 100) {
    return this.prisma.auditLog.findMany({
      where: {
        operation: {
          startsWith: 'SECURITY_',
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}
