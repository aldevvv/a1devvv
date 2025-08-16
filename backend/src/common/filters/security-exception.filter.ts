import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';

@Catch()
export class SecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SecurityExceptionFilter.name);

  constructor(private readonly auditService: AuditService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getStatus(exception);
    const message = this.getSafeMessage(exception, status);
    const errorId = this.generateErrorId();

    // Log the full error internally (for debugging)
    this.logger.error(
      `Error ${errorId}: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      exception instanceof Error ? exception.stack : undefined
    );

    // Log security events for suspicious activities
    if (status === HttpStatus.FORBIDDEN || status === HttpStatus.UNAUTHORIZED) {
      this.auditService
        .logSecurityEvent(
          'ACCESS_DENIED',
          this.getUserId(request),
          {
            path: request.url,
            method: request.method,
            userAgent: request.headers['user-agent'],
            errorId,
            message: exception instanceof Error ? exception.message : 'Access denied',
          },
          request
        )
        .catch((err) => this.logger.error('Failed to log security event', err));
    }

    // Log other errors that might be security-relevant
    if (status >= 500) {
      this.auditService
        .logSecurityEvent(
          'SERVER_ERROR',
          this.getUserId(request),
          {
            path: request.url,
            method: request.method,
            errorId,
            statusCode: status,
          },
          request
        )
        .catch((err) => this.logger.error('Failed to log server error', err));
    }

    // Return sanitized error response
    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      errorId: status >= 500 ? errorId : undefined, // Only include errorId for server errors
    };

    response.status(status).json(errorResponse);
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    // Default to 500 for unknown errors
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getSafeMessage(exception: unknown, status: number): string {
    // For client errors (4xx), we can expose more details
    if (status >= 400 && status < 500) {
      if (exception instanceof HttpException) {
        const response = exception.getResponse();
        if (typeof response === 'string') {
          return response;
        }
        if (typeof response === 'object' && response['message']) {
          return response['message'];
        }
      }
      return 'Bad Request';
    }

    // For server errors (5xx), use generic messages to avoid information disclosure
    switch (status) {
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal server error occurred. Please try again later.';
      case HttpStatus.BAD_GATEWAY:
        return 'Service temporarily unavailable. Please try again later.';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Service temporarily unavailable. Please try again later.';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'Request timeout. Please try again later.';
      default:
        return 'An error occurred. Please try again later.';
    }
  }

  private generateErrorId(): string {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  private getUserId(request: Request): string | undefined {
    return request.user?.['id'];
  }
}
