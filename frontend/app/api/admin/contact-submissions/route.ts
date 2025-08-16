import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkAdminRateLimit } from '@/lib/admin-rate-limiter';

const prisma = new PrismaClient();

// GET /api/admin/contact-submissions - List contact submissions with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateLimitResult = await checkAdminRateLimit(request, session.user.email!);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    // Filter parameters
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const where: any = {};

    // Search in name, email, subject, or message
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Status filter
    if (status && ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      where.status = status;
    }

    // Category filter
    if (category && ['GENERAL', 'TECHNICAL', 'BILLING', 'COMPLAINT', 'OTHER'].includes(category)) {
      where.category = category;
    }

    // Priority filter
    if (priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
      where.priority = priority;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (['createdAt', 'updatedAt', 'status', 'priority', 'category'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc'; // Default sort
    }

    // Get total count for pagination
    const total = await prisma.contactSubmission.count({ where });
    
    // Get submissions
    const submissions = await prisma.contactSubmission.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        category: true,
        subject: true,
        message: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
      hasPrevPage
    };

    return NextResponse.json({
      submissions,
      pagination,
      filters: {
        search,
        status,
        category,
        priority,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
