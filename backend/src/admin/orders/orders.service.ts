import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../../email/email.service';
import {
  QueryOrdersDto,
  OrderStatus,
  FulfillmentMode,
} from './dto/query-orders.dto';
import {
  SendFulfillmentEmailDto,
  UpdateOrderStatusDto,
  FulfillmentSubject,
  FulfillmentContentType,
} from './dto/fulfillment.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private emailService: EmailService,
  ) {}

  async getAllOrders(query: QueryOrdersDto, adminId: string) {
    const {
      page = 1,
      limit = 10,
      status,
      paymentMethod,
      fulfillmentMode,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where conditions
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (search) {
      where.OR = [
        { orderId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        {
          metadata: {
            path: ['products'],
            array_contains: [{ title: { contains: search, mode: 'insensitive' } }],
          },
        },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Add fulfillment mode filter by checking product metadata
    if (fulfillmentMode) {
      where.metadata = {
        ...where.metadata,
        path: ['fulfillment'],
        equals: fulfillmentMode,
      };
    }

    // Execute queries
    const [orders, totalCount] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy as keyof typeof this.prisma.order.findMany]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          payment: {
            select: {
              id: true,
              provider: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    // Log audit
    await this.auditService.log({
      operation: 'ORDERS_VIEW',
      adminId,
      metadata: {
        query,
        resultCount: orders.length,
        totalCount,
      },
    });

    return {
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: skip + orders.length < totalCount,
        hasPrev: page > 1,
      },
    };
  }

  async getManualRequests(query: QueryOrdersDto, adminId: string) {
    // Override query to only show orders that need manual fulfillment
    const manualQuery = {
      ...query,
      fulfillmentMode: FulfillmentMode.MANUAL,
      status: OrderStatus.PAID, // Only show paid orders that need fulfillment
    };

    const result = await this.getAllOrders(manualQuery, adminId);

    // Filter out orders that have already been delivered
    result.orders = result.orders.filter((order) => order.status === 'PAID');

    await this.auditService.log({
      operation: 'MANUAL_REQUESTS_VIEW',
      adminId,
      metadata: {
        query: manualQuery,
        pendingCount: result.orders.length,
      },
    });

    return result;
  }

  async getOrderById(orderId: string, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.auditService.log({
      operation: 'ORDER_VIEW',
      adminId,
      metadata: {
        orderId: order.orderId,
        userId: order.userId,
      },
    });

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    updateData: UpdateOrderStatusDto,
    adminId: string,
  ) {
    const order = await this.getOrderById(orderId, adminId);

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: updateData.status,
        updatedAt: new Date(),
        metadata: {
          ...(order.metadata as any),
          adminNotes: updateData.notes,
          lastUpdatedBy: adminId,
        },
      },
      include: {
        user: true,
        payment: true,
      },
    });

    await this.auditService.log({
      operation: 'ORDER_STATUS_UPDATE',
      adminId,
      userId: order.userId,
      metadata: {
        orderId: order.orderId,
        oldStatus: order.status,
        newStatus: updateData.status,
        notes: updateData.notes,
      },
    });

    return updatedOrder;
  }

  async sendFulfillmentEmail(
    orderId: string,
    emailData: SendFulfillmentEmailDto,
    adminId: string,
  ) {
    const order = await this.getOrderById(orderId, adminId);

    // Generate email content
    const emailContent = this.generateFulfillmentEmailContent(order, emailData);
    
    // Get subject
    const subject = emailData.subjectType === FulfillmentSubject.CUSTOM 
      ? (emailData.customSubject || 'Order Fulfillment')
      : emailData.subjectType;

    // Send fulfillment email using EmailService
    try {
      await this.emailService.send(
        order.user.email,
        subject,
        emailContent,
        emailData.senderEmail // Use custom sender email
      );
      console.log('✅ Fulfillment email sent successfully to:', order.user.email, 'from:', emailData.senderEmail);
    } catch (error) {
      console.error('❌ Failed to send fulfillment email:', error);
      throw new Error('Failed to send fulfillment email');
    }

    // Update order status to DELIVERED
    await this.updateOrderStatus(orderId, { status: 'DELIVERED' }, adminId);

    // Log fulfillment
    await this.auditService.log({
      operation: 'ORDER_FULFILLMENT',
      adminId,
      userId: order.userId,
      metadata: {
        orderId: order.orderId,
        recipientEmail: order.user.email,
        senderEmail: emailData.senderEmail,
        senderName: emailData.senderName,
        subject,
        contentType: emailData.contentType,
        hasCustomContent: !!emailData.customMessage,
      },
    });

    return {
      success: true,
      message: 'Fulfillment email sent successfully',
      orderId: order.orderId,
      recipient: order.user.email,
    };
  }

  private generateFulfillmentEmailContent(
    order: any,
    emailData: SendFulfillmentEmailDto,
  ): string {
    const { user, metadata } = order;
    const { productDelivery, customMessage, additionalNotes, contentType } = emailData;
    
    let productContent = '';
    
    // Generate product-specific content
    switch (contentType) {
      case FulfillmentContentType.KEYS:
        if (productDelivery.keys && productDelivery.keys.length > 0) {
          productContent = `
            <div class="product-delivery">
              <h3>Your License Keys:</h3>
              <div class="keys-list">
                ${productDelivery.keys.map((key, index) => 
                  `<div class="key-item">
                    <strong>Key ${index + 1}:</strong>
                    <code class="key-code">${key}</code>
                  </div>`
                ).join('')}
              </div>
            </div>
          `;
        }
        break;
        
      case FulfillmentContentType.SOURCE_CODE:
        if (productDelivery.sourceFileUrl) {
          productContent = `
            <div class="product-delivery">
              <h3>Download Your Source Code:</h3>
              <p>
                <a href="${productDelivery.sourceFileUrl}" 
                   class="download-button" 
                   style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Download Source Code
                </a>
              </p>
              <p><small>Download link: ${productDelivery.sourceFileUrl}</small></p>
            </div>
          `;
        }
        break;
        
      case FulfillmentContentType.ACCESS_LINK:
        if (productDelivery.accessLinks && productDelivery.accessLinks.length > 0) {
          productContent = `
            <div class="product-delivery">
              <h3>Your Access Links:</h3>
              <div class="links-list">
                ${productDelivery.accessLinks.map((link, index) => 
                  `<div class="link-item">
                    <p><strong>Access Link ${index + 1}:</strong></p>
                    <a href="${link}" target="_blank" style="color: #007bff;">${link}</a>
                  </div>`
                ).join('')}
              </div>
            </div>
          `;
        }
        break;
        
      case FulfillmentContentType.DIGITAL_ACCOUNT:
        if (productDelivery.digitalAccounts && productDelivery.digitalAccounts.length > 0) {
          productContent = `
            <div class="product-delivery">
              <h3>Your Account Details:</h3>
              <div class="accounts-list">
                ${productDelivery.digitalAccounts.map((account, index) => 
                  `<div class="account-item">
                    <strong>Account ${index + 1}:</strong>
                    <code class="account-details">${account}</code>
                  </div>`
                ).join('')}
              </div>
            </div>
          `;
        }
        break;
        
      case FulfillmentContentType.CUSTOM:
        if (productDelivery.customContent) {
          productContent = `
            <div class="product-delivery">
              <div class="custom-content">
                ${productDelivery.customContent}
              </div>
            </div>
          `;
        }
        break;
    }

    // Generate full email HTML
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Fulfillment</title>
        <style>
          .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: white; border: 1px solid #e9ecef; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
          .product-delivery { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .key-code, .account-details { background: #e9ecef; padding: 8px 12px; border-radius: 4px; font-family: monospace; display: inline-block; margin: 4px 0; }
          .download-button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .key-item, .link-item, .account-item { margin: 12px 0; padding: 12px; background: white; border-radius: 4px; border: 1px solid #dee2e6; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h2>Order Delivery Confirmation</h2>
            <p>Order ID: <strong>${order.orderId}</strong></p>
          </div>
          
          <div class="content">
            <p>Dear ${user.fullName || 'Customer'},</p>
            
            ${customMessage ? `<div class="custom-message">${customMessage}</div>` : `
              <p>Your order has been successfully processed and delivered. Please find your product details below:</p>
            `}
            
            ${productContent}
            
            ${additionalNotes ? `
              <div class="additional-notes" style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px;">
                <h4>Additional Notes:</h4>
                <p>${additionalNotes}</p>
              </div>
            ` : ''}
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Thank you for your purchase!</p>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>
            <strong>${emailData.senderName}</strong><br>
            ${emailData.senderEmail}</p>
            
            <p>This email was sent regarding your order #${order.orderId}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async previewFulfillmentEmail(
    orderId: string,
    emailData: SendFulfillmentEmailDto,
    adminId: string,
  ) {
    const order = await this.getOrderById(orderId, adminId);
    const emailContent = this.generateFulfillmentEmailContent(order, emailData);
    
    const subject = emailData.subjectType === FulfillmentSubject.CUSTOM 
      ? emailData.customSubject 
      : emailData.subjectType;

    return {
      to: order.user.email,
      from: emailData.senderEmail,
      fromName: emailData.senderName,
      subject,
      html: emailContent,
      preview: true,
    };
  }

  // Statistics for dashboard
  async getOrdersStats(adminId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const [
      totalOrders,
      pendingManualRequests,
      todayOrders,
      weekOrders,
      monthOrders,
      statusBreakdown,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({
        where: {
          status: 'PAID',
          metadata: {
            path: ['fulfillment'],
            equals: FulfillmentMode.MANUAL,
          },
        },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: startOfWeek } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),
    ]);

    await this.auditService.log({
      operation: 'ORDERS_STATS_VIEW',
      adminId,
    });

    return {
      totalOrders,
      pendingManualRequests,
      todayOrders,
      weekOrders,
      monthOrders,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
    };
  }
}
