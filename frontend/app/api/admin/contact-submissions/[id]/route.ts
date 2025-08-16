import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkAdminRateLimit } from '@/lib/admin-rate-limiter';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for updating submission
const updateSubmissionSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  notes: z.string().max(1000).optional(), // Internal notes for admins
});

// GET /api/admin/contact-submissions/[id] - Get single submission
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
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
        updatedAt: true,
        // Include internal notes if they exist in your schema
        // notes: true, 
      }
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ submission });

  } catch (error) {
    console.error('Error fetching contact submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/contact-submissions/[id] - Update submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = updateSubmissionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Check if submission exists
    const existingSubmission = await prisma.contactSubmission.findUnique({
      where: { id }
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Update submission
    const updatedSubmission = await prisma.contactSubmission.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
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
        updatedAt: true,
      }
    });

    // Log the admin action (optional - you can implement audit logging)
    console.log(`Admin ${session.user.email} updated contact submission ${id}:`, {
      changes: updateData,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Submission updated successfully',
      submission: updatedSubmission
    });

  } catch (error) {
    console.error('Error updating contact submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/contact-submissions/[id] - Delete submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // Check rate limit for destructive operations
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

    const { id } = params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    // Check if submission exists
    const existingSubmission = await prisma.contactSubmission.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        subject: true
      }
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Delete submission
    await prisma.contactSubmission.delete({
      where: { id }
    });

    // Log the admin action
    console.log(`Admin ${session.user.email} deleted contact submission ${id}:`, {
      submissionEmail: existingSubmission.email,
      submissionSubject: existingSubmission.subject,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      message: 'Submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting contact submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
