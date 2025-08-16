import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';
import { ProductsService } from '../admin/products/products.service';
import { StockType } from '@prisma/client';

interface GetPublishedProductsParams {
  categoryId?: string;
  search?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
}

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService
  ) {}

  async getPublishedProducts(params: GetPublishedProductsParams, userId?: string) {
    const {
      categoryId,
      search,
      sort = 'newest',
      minPrice,
      maxPrice,
    } = params;

    // Validate price parameters
    const validMinPrice = minPrice && !isNaN(minPrice) ? minPrice : undefined;
    const validMaxPrice = maxPrice && !isNaN(maxPrice) ? maxPrice : undefined;

    // Build where clause
    const where: any = {
      status: ProductStatus.PUBLISHED,
    };

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (validMinPrice !== undefined || validMaxPrice !== undefined) {
      where.AND = where.AND || [];
      
      // Check both regular price and sale price
      const priceCondition: any = {
        OR: []
      };

      if (validMinPrice !== undefined && validMaxPrice !== undefined) {
        // Price range filter
        priceCondition.OR.push(
          {
            AND: [
              { salePriceIDR: { not: null } },
              { salePriceIDR: { gte: validMinPrice } },
              { salePriceIDR: { lte: validMaxPrice } }
            ]
          },
          {
            AND: [
              { salePriceIDR: null },
              { priceIDR: { gte: validMinPrice } },
              { priceIDR: { lte: validMaxPrice } }
            ]
          }
        );
      } else if (validMinPrice !== undefined) {
        // Min price filter
        priceCondition.OR.push(
          {
            AND: [
              { salePriceIDR: { not: null } },
              { salePriceIDR: { gte: validMinPrice } }
            ]
          },
          {
            AND: [
              { salePriceIDR: null },
              { priceIDR: { gte: validMinPrice } }
            ]
          }
        );
      } else if (validMaxPrice !== undefined) {
        // Max price filter
        priceCondition.OR.push(
          {
            AND: [
              { salePriceIDR: { not: null } },
              { salePriceIDR: { lte: validMaxPrice } }
            ]
          },
          {
            AND: [
              { salePriceIDR: null },
              { priceIDR: { lte: validMaxPrice } }
            ]
          }
        );
      }

      where.AND.push(priceCondition);
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sort) {
      case 'price-low':
        orderBy = { priceIDR: 'asc' };
        break;
      case 'price-high':
        orderBy = { priceIDR: 'desc' };
        break;
      case 'rating':
        // For now, order by createdAt since we don't have ratings yet
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
        // For now, order by createdAt since we don't have popularity metrics yet
        orderBy = { createdAt: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
      },
    });

    // Get wishlist status if user is authenticated
    let wishlistStatus: Record<string, boolean> = {};
    if (userId) {
      const wishlistItems = await this.prisma.wishlist.findMany({
        where: {
          userId,
          productId: {
            in: products.map(p => p.id),
          },
        },
        select: {
          productId: true,
        },
      });
      
      wishlistStatus = wishlistItems.reduce((acc, item) => {
        acc[item.productId] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    // Transform products to match frontend expectations
    return products.map(product => {
      // Check if sale is currently active
      const now = new Date();
      let effectiveSalePrice: number | null = null;
      let effectiveSalePercent: number | null = null;
      
      if (product.salePriceIDR || product.salePercent) {
        const saleStarted = !product.saleStartAt || new Date(product.saleStartAt) <= now;
        const saleNotEnded = !product.saleEndAt || new Date(product.saleEndAt) > now;
        
        if (saleStarted && saleNotEnded) {
          effectiveSalePrice = product.salePriceIDR;
          effectiveSalePercent = product.salePercent;
        }
      }
      
      // Enhanced stock information for reusable products
      const stockInfo = this.productsService.getProductStockInfo(product);
      
      return {
        id: product.id,
        name: product.title,
        slug: product.slug,
        description: product.description || product.summary || '',
        summary: product.summary,
        price: product.priceIDR,
        salePrice: effectiveSalePrice,
        salePercent: effectiveSalePercent,
        saleStartAt: product.saleStartAt,
        saleEndAt: product.saleEndAt,
        categoryId: product.categoryId,
        categoryName: product.category?.name || null,
        categoryIcon: product.category?.icon || '📦',
        status: product.status,
        type: product.type,
        productKind: product.productKind,
        thumbnail: product.thumbnailUrl,
        fulfillment: product.fulfillment,
        // Enhanced stock information
        stock: stockInfo.availableStock,
        stockDisplay: stockInfo.stockDisplay,
        stockStatus: stockInfo.warningLevel,
        stockType: stockInfo.stockType,
        isAvailable: stockInfo.isAvailable,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        // Optional fields that will be added later
        tags: [],
        isWishlisted: wishlistStatus[product.id] || false,
      };
    });
  }

  async getProductBySlug(slug: string, userId?: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        status: ProductStatus.PUBLISHED,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is wishlisted by user
    let isWishlisted = false;
    if (userId) {
      const wishlist = await this.prisma.wishlist.findUnique({
        where: {
          userId_productId: {
            userId,
            productId: product.id,
          },
        },
      });
      isWishlisted = !!wishlist;
    }

    // Check if sale is currently active
    const now = new Date();
    let effectiveSalePrice: number | null = null;
    let effectiveSalePercent: number | null = null;
    
    if (product.salePriceIDR || product.salePercent) {
      const saleStarted = !product.saleStartAt || new Date(product.saleStartAt) <= now;
      const saleNotEnded = !product.saleEndAt || new Date(product.saleEndAt) > now;
      
      if (saleStarted && saleNotEnded) {
        effectiveSalePrice = product.salePriceIDR;
        effectiveSalePercent = product.salePercent;
      }
    }
    
    // Calculate effective price for API response
    const effectivePrice = effectiveSalePrice || product.priceIDR;
    
    // Enhanced stock information for reusable products
    const stockInfo = this.productsService.getProductStockInfo(product);
    
    // Transform product to match frontend expectations
    return {
      id: product.id,
      title: product.title,
      name: product.title,
      slug: product.slug,
      description: product.description || product.summary || '',
      summary: product.summary,
      priceIDR: product.priceIDR,
      price: product.priceIDR,
      salePriceIDR: effectiveSalePrice,
      salePrice: effectiveSalePrice,
      salePercent: effectiveSalePercent,
      saleStartAt: product.saleStartAt,
      saleEndAt: product.saleEndAt,
      effectivePrice, // Add the actual price to pay
      categoryId: product.categoryId,
      category: product.category,
      categoryName: product.category?.name || null,
      categoryIcon: product.category?.icon || '📦',
      status: product.status,
      type: product.type,
      productKind: product.productKind,
      thumbnailUrl: product.thumbnailUrl,
      thumbnail: product.thumbnailUrl,
      fulfillment: product.fulfillment,
      deliveryCfg: product.deliveryCfg,
      // Enhanced stock information
      stock: stockInfo.availableStock,
      stockDisplay: stockInfo.stockDisplay,
      stockStatus: stockInfo.warningLevel,
      stockType: stockInfo.stockType,
      isAvailable: stockInfo.isAvailable,
      // Additional context for reusable products
      stockInfo: {
        type: stockInfo.stockType,
        available: stockInfo.availableStock,
        display: stockInfo.stockDisplay,
        status: stockInfo.warningLevel,
        isUnlimited: stockInfo.stockType === StockType.UNLIMITED,
        isStockBased: stockInfo.stockType === StockType.STOCK_BASED,
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      // Optional fields that will be added later
      tags: [],
      isWishlisted,
    };
  }

  async getPublicCategories() {
    const categories = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        _count: {
          select: {
            products: {
              where: {
                status: ProductStatus.PUBLISHED,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon || '📦',
      productCount: category._count.products,
    }));
  }
}
