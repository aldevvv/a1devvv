import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Common validation schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).max(10000).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const sortingSchema = z.object({
  sortBy: z.enum(['createdAt', 'updatedAt', 'status', 'priority', 'category', 'name', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const contactSubmissionFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  category: z.enum(['GENERAL', 'TECHNICAL', 'BILLING', 'COMPLAINT', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const contactSubmissionUpdateSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  notes: z.string().max(1000).optional(),
});

// ID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Sanitization functions
export function sanitizeString(input: string): string {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  }).trim();
}

export function sanitizeSearchQuery(query: string): string {
  // Remove potentially dangerous characters for SQL-like queries
  return query
    .replace(/[<>'"\\;(){}[\]]/g, '') // Remove dangerous chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 200); // Limit length
}

export function validateAndSanitizeFilters(rawFilters: any) {
  const parsed = contactSubmissionFiltersSchema.safeParse(rawFilters);
  
  if (!parsed.success) {
    throw new Error(`Invalid filters: ${parsed.error.issues.map(i => i.message).join(', ')}`);
  }
  
  const filters = parsed.data;
  
  // Sanitize search if present
  if (filters.search) {
    filters.search = sanitizeSearchQuery(filters.search);
    
    // Remove empty search after sanitization
    if (filters.search.length === 0) {
      filters.search = undefined;
    }
  }
  
  return filters;
}

export function validatePagination(rawPagination: any) {
  const parsed = paginationSchema.safeParse({
    page: rawPagination.page ? parseInt(rawPagination.page) : 1,
    limit: rawPagination.limit ? parseInt(rawPagination.limit) : 10,
  });
  
  if (!parsed.success) {
    throw new Error(`Invalid pagination: ${parsed.error.issues.map(i => i.message).join(', ')}`);
  }
  
  return parsed.data;
}

export function validateSorting(rawSorting: any) {
  const parsed = sortingSchema.safeParse(rawSorting);
  
  if (!parsed.success) {
    throw new Error(`Invalid sorting: ${parsed.error.issues.map(i => i.message).join(', ')}`);
  }
  
  return parsed.data;
}

// Audit logging structure
export interface AdminAction {
  adminId: string;
  adminEmail: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LIST';
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export function createAuditLog(
  adminId: string,
  adminEmail: string,
  action: AdminAction['action'],
  resource: string,
  resourceId?: string,
  changes?: Record<string, any>,
  metadata?: Record<string, any>,
  request?: Request
): AdminAction {
  return {
    adminId,
    adminEmail,
    action,
    resource,
    resourceId,
    changes,
    metadata,
    timestamp: new Date(),
    ipAddress: request?.headers.get('x-forwarded-for') || 
              request?.headers.get('x-real-ip') || 
              'unknown',
    userAgent: request?.headers.get('user-agent') || 'unknown'
  };
}

// Rate limiting configuration
export const ADMIN_RATE_LIMITS = {
  DEFAULT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  },
  DESTRUCTIVE: {
    windowMs: 60 * 1000, // 1 minute  
    maxRequests: 20 // Lower limit for delete operations
  },
  LIST: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200 // Higher limit for read operations
  }
};

// Error response helpers
export function createErrorResponse(message: string, status: number, details?: any) {
  return {
    error: message,
    details,
    timestamp: new Date().toISOString(),
    status
  };
}

export function createSuccessResponse(data: any, message?: string) {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}
