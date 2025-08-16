import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async getUserOrders(
    userId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: {
            select: {
              status: true,
              method: true,
              provider: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    // Transform orders to include product details from metadata
    const transformedOrders = orders.map(order => {
      const metadata = order.metadata as any;
      const products = metadata?.products || [];
      const promoCodeId = metadata?.promoCodeId;

      return {
        id: order.orderId,
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.payment?.status || 'PENDING',
        totalAmount: order.totalIDR,
        discountAmount: 0, // TODO: Calculate from promo code if exists
        finalAmount: order.totalIDR,
        promoCode: promoCodeId || null, // TODO: Fetch actual promo code
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        completedAt: order.status === 'PAID' || order.status === 'COMPLETED' 
          ? order.updatedAt 
          : null,
        items: products.map((product: any) => ({
          id: product.id,
          productId: product.id,
          productName: product.title,
          productType: 'DIGITAL',
          price: product.price,
          salePrice: product.salePrice || null,
          quantity: 1,
          // TODO: Implement actual download/access URLs based on product delivery type
          downloadUrl: null,
          accessUrl: null,
          rating: null, // TODO: Implement product reviews
          reviewText: null,
          reviewedAt: null,
        })),
      };
    });

    return {
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderDetails(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderId,
        userId,
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Extract products and delivery items from metadata
    const metadata = order.metadata as any;
    const products = metadata?.products || [];
    const deliveryItems = metadata?.deliveryItems || [];

    // Get all delivery items for paid/completed orders
    let deliveryItems_processed: Array<{ type: string; content: string }> = [];
    if ((order.status === 'PAID' || order.status === 'COMPLETED') && deliveryItems.length > 0) {
      deliveryItems_processed = deliveryItems.map((item: any) => ({
        type: item.type || 'LICENSE_KEY',
        content: item.content || 'No delivery information available',
      }));
    }

    // Get delivery info from stored items (backward compatibility)
    let deliveryInfo: { type: string; content: string } | null = null;
    if (deliveryItems_processed.length > 0) {
      deliveryInfo = deliveryItems_processed[0];
    }

    return {
      orderId: order.orderId,
      status: order.status,
      totalIDR: order.totalIDR,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      products: products.map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        thumbnail: p.thumbnail || p.thumbnailUrl,
        quantity: p.quantity || 1,
      })),
      user: {
        fullName: order.user.fullName,
        email: order.user.email,
      },
      payment: order.payment ? {
        status: order.payment.status,
        provider: order.payment.provider,
      } : null,
      // Return all delivery items
      deliveryItems: deliveryItems_processed,
      // Keep the old format for backward compatibility
      deliveryInfo,
    };
  }
}
