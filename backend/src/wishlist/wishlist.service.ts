import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  // Get all wishlist items for a user
  async getUserWishlist(userId: string) {
    const wishlists = await this.prisma.wishlist.findMany({
      where: {
        userId,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match frontend expectations
    return wishlists.map((wishlist) => ({
      id: wishlist.id,
      productId: wishlist.product.id,
      product: {
        id: wishlist.product.id,
        name: wishlist.product.title,
        slug: wishlist.product.slug,
        description: wishlist.product.description || wishlist.product.summary || '',
        summary: wishlist.product.summary,
        price: wishlist.product.priceIDR,
        salePrice: wishlist.product.salePriceIDR,
        salePercent: wishlist.product.salePercent,
        categoryId: wishlist.product.categoryId,
        categoryName: wishlist.product.category?.name || null,
        categoryIcon: wishlist.product.category?.icon || '📦',
        status: wishlist.product.status,
        type: wishlist.product.type,
        productKind: wishlist.product.productKind,
        thumbnail: wishlist.product.thumbnailUrl,
        fulfillment: wishlist.product.fulfillment,
        createdAt: wishlist.product.createdAt,
        updatedAt: wishlist.product.updatedAt,
      },
      addedAt: wishlist.createdAt,
    }));
  }

  // Add product to wishlist
  async addToWishlist(userId: string, productId: string) {
    // Check if product exists and is published
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        status: ProductStatus.PUBLISHED,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or not available');
    }

    // Check if already in wishlist
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Product already in wishlist');
    }

    // Add to wishlist
    const wishlist = await this.prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: true,
      },
    });

    return {
      success: true,
      message: 'Product added to wishlist',
      wishlist,
    };
  }

  // Remove product from wishlist
  async removeFromWishlist(userId: string, productId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!wishlist) {
      throw new NotFoundException('Product not in wishlist');
    }

    await this.prisma.wishlist.delete({
      where: {
        id: wishlist.id,
      },
    });

    return {
      success: true,
      message: 'Product removed from wishlist',
    };
  }

  // Toggle wishlist (add if not exists, remove if exists)
  async toggleWishlist(userId: string, productId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      // Remove from wishlist
      await this.prisma.wishlist.delete({
        where: {
          id: existing.id,
        },
      });

      return {
        success: true,
        action: 'removed',
        message: 'Product removed from wishlist',
        isWishlisted: false,
      };
    } else {
      // Check if product exists and is published
      const product = await this.prisma.product.findFirst({
        where: {
          id: productId,
          status: ProductStatus.PUBLISHED,
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found or not available');
      }

      // Add to wishlist
      await this.prisma.wishlist.create({
        data: {
          userId,
          productId,
        },
      });

      return {
        success: true,
        action: 'added',
        message: 'Product added to wishlist',
        isWishlisted: true,
      };
    }
  }

  // Check if product is in user's wishlist
  async isProductWishlisted(userId: string, productId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return !!wishlist;
  }

  // Get wishlist count for a user
  async getWishlistCount(userId: string) {
    return this.prisma.wishlist.count({
      where: {
        userId,
      },
    });
  }

  // Get wishlist status for multiple products
  async getWishlistStatusForProducts(userId: string, productIds: string[]) {
    const wishlists = await this.prisma.wishlist.findMany({
      where: {
        userId,
        productId: {
          in: productIds,
        },
      },
      select: {
        productId: true,
      },
    });

    const wishlistedProductIds = wishlists.map(w => w.productId);
    
    return productIds.reduce((acc, productId) => {
      acc[productId] = wishlistedProductIds.includes(productId);
      return acc;
    }, {} as Record<string, boolean>);
  }
}
