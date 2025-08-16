import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // Get all cart items for a user
  async getCartItems(userId: string) {
    const cartItems = await this.prisma.cart.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals with sale validation
    const now = new Date();
    const items = cartItems.map((item) => {
      // Check if sale is currently active
      let effectivePrice = item.product.priceIDR;
      let effectiveSalePrice: number | null = null;
      let effectiveSalePercent: number | null = null;
      
      if (item.product.salePriceIDR || item.product.salePercent) {
        const saleStarted = !item.product.saleStartAt || new Date(item.product.saleStartAt) <= now;
        const saleNotEnded = !item.product.saleEndAt || new Date(item.product.saleEndAt) > now;
        
        if (saleStarted && saleNotEnded) {
          effectiveSalePrice = item.product.salePriceIDR;
          effectiveSalePercent = item.product.salePercent;
          effectivePrice = item.product.salePriceIDR ?? item.product.priceIDR;
        }
      }
      
      const subtotal = effectivePrice * item.quantity;
      
      return {
        id: item.id,
        quantity: item.quantity,
        subtotal,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: {
          id: item.product.id,
          slug: item.product.slug,
          title: item.product.title,
          summary: item.product.summary,
          priceIDR: item.product.priceIDR,
          salePriceIDR: effectiveSalePrice,
          salePercent: effectiveSalePercent,
          saleStartAt: item.product.saleStartAt,
          saleEndAt: item.product.saleEndAt,
          effectivePrice, // The actual price being charged
          thumbnailUrl: item.product.thumbnailUrl,
          type: item.product.type,
          category: item.product.category,
        },
      };
    });

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      items,
      totalItems,
      totalPrice,
    };
  }

  // Add item to cart
  async addToCart(userId: string, productId: string, quantity = 1) {
    // Check if product exists and is published
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== 'PUBLISHED') {
      throw new BadRequestException('Product is not available for purchase');
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.cart.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity if item exists
      return this.prisma.cart.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
        include: {
          product: true,
        },
      });
    }

    // Create new cart item
    return this.prisma.cart.create({
      data: {
        userId,
        productId,
        quantity,
      },
      include: {
        product: true,
      },
    });
  }

  // Update cart item quantity
  async updateQuantity(userId: string, itemId: string, quantity: number) {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    // Check if cart item belongs to user
    const cartItem = await this.prisma.cart.findFirst({
      where: {
        id: itemId,
        userId,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cart.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: true,
      },
    });
  }

  // Remove item from cart
  async removeFromCart(userId: string, itemId: string) {
    // Check if cart item belongs to user
    const cartItem = await this.prisma.cart.findFirst({
      where: {
        id: itemId,
        userId,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cart.delete({
      where: { id: itemId },
    });

    return { message: 'Item removed from cart' };
  }

  // Clear all cart items for a user
  async clearCart(userId: string) {
    await this.prisma.cart.deleteMany({
      where: { userId },
    });

    return { message: 'Cart cleared' };
  }

  // Get cart count for a user
  async getCartCount(userId: string) {
    const count = await this.prisma.cart.aggregate({
      where: { userId },
      _sum: { quantity: true },
    });

    return { count: count._sum.quantity || 0 };
  }

  // Check if product is in cart
  async isInCart(userId: string, productId: string) {
    const cartItem = await this.prisma.cart.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return {
      isInCart: !!cartItem,
      quantity: cartItem?.quantity || 0,
    };
  }
}
