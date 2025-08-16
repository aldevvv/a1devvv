import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { PromoKind, PromoScope } from '@prisma/client';

@Injectable()
export class PromosService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.promoCode.findMany({
      where,
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    if (!promo) {
      throw new NotFoundException('Promo code not found');
    }

    return promo;
  }

  async create(createPromoDto: CreatePromoDto) {
    const {
      code,
      kind,
      value,
      startAt,
      endAt,
      minSubtotalIDR,
      maxDiscountIDR,
      usageLimit,
      perUserLimit,
      appliesTo,
      isActive,
      categoryIds,
      productIds,
    } = createPromoDto;

    // Check if code already exists
    const existingPromo = await this.prisma.promoCode.findUnique({
      where: { code },
    });

    if (existingPromo) {
      throw new ConflictException('Promo code already exists');
    }

    // Validate scope-specific requirements
    this.validatePromoScope(appliesTo, categoryIds, productIds);

    // Validate categories exist if provided
    if (categoryIds && categoryIds.length > 0) {
      const categories = await this.prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });
      if (categories.length !== categoryIds.length) {
        throw new NotFoundException('One or more categories not found');
      }
    }

    // Validate products exist if provided
    if (productIds && productIds.length > 0) {
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products not found');
      }
    }

    // Validate date range
    if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Validate percentage value
    if (kind === PromoKind.PERCENT && (value < 1 || value > 100)) {
      throw new BadRequestException('Percentage value must be between 1 and 100');
    }

    return this.prisma.promoCode.create({
      data: {
        code,
        kind,
        value,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        minSubtotalIDR,
        maxDiscountIDR,
        usageLimit,
        perUserLimit,
        appliesTo,
        isActive,
        categories: categoryIds
          ? {
              create: categoryIds.map((categoryId) => ({
                categoryId,
              })),
            }
          : undefined,
        products: productIds
          ? {
              create: productIds.map((productId) => ({
                productId,
              })),
            }
          : undefined,
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });
  }

  async update(id: string, updatePromoDto: UpdatePromoDto) {
    const promo = await this.findOne(id);
    const {
      code,
      kind,
      value,
      startAt,
      endAt,
      minSubtotalIDR,
      maxDiscountIDR,
      usageLimit,
      perUserLimit,
      appliesTo,
      isActive,
      categoryIds,
      productIds,
    } = updatePromoDto;

    // Check if new code conflicts with existing promos
    if (code && code !== promo.code) {
      const existingPromo = await this.prisma.promoCode.findUnique({
        where: { code },
      });

      if (existingPromo) {
        throw new ConflictException('Promo code already exists');
      }
    }

    // Validate scope-specific requirements if appliesTo is being updated
    if (appliesTo) {
      this.validatePromoScope(appliesTo, categoryIds, productIds);
    }

    // Validate categories exist if provided
    if (categoryIds && categoryIds.length > 0) {
      const categories = await this.prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });
      if (categories.length !== categoryIds.length) {
        throw new NotFoundException('One or more categories not found');
      }
    }

    // Validate products exist if provided
    if (productIds && productIds.length > 0) {
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products not found');
      }
    }

    // Validate date range
    const finalStartAt = startAt ? new Date(startAt) : promo.startAt;
    const finalEndAt = endAt ? new Date(endAt) : promo.endAt;
    if (finalStartAt && finalEndAt && finalStartAt >= finalEndAt) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Validate percentage value
    const finalKind = kind ?? promo.kind;
    const finalValue = value ?? promo.value;
    if (finalKind === PromoKind.PERCENT && (finalValue < 1 || finalValue > 100)) {
      throw new BadRequestException('Percentage value must be between 1 and 100');
    }

    return this.prisma.promoCode.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(kind && { kind }),
        ...(value !== undefined && { value }),
        ...(startAt !== undefined && { startAt: startAt ? new Date(startAt) : null }),
        ...(endAt !== undefined && { endAt: endAt ? new Date(endAt) : null }),
        ...(minSubtotalIDR !== undefined && { minSubtotalIDR }),
        ...(maxDiscountIDR !== undefined && { maxDiscountIDR }),
        ...(usageLimit !== undefined && { usageLimit }),
        ...(perUserLimit !== undefined && { perUserLimit }),
        ...(appliesTo && { appliesTo }),
        ...(isActive !== undefined && { isActive }),
        ...(categoryIds !== undefined && {
          categories: {
            deleteMany: {},
            create: categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },
        }),
        ...(productIds !== undefined && {
          products: {
            deleteMany: {},
            create: productIds.map((productId) => ({
              productId,
            })),
          },
        }),
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const promo = await this.findOne(id);

    // Check if promo has been used
    const redemptionCount = await this.prisma.promoRedemption.count({
      where: { promoCodeId: id },
    });

    if (redemptionCount > 0) {
      throw new ConflictException(
        `Cannot delete promo code with ${redemptionCount} redemptions. Consider deactivating it instead.`
      );
    }

    await this.prisma.promoCode.delete({
      where: { id },
    });

    return { message: 'Promo code deleted successfully' };
  }

  private validatePromoScope(
    appliesTo: PromoScope,
    categoryIds?: string[],
    productIds?: string[]
  ): void {
    switch (appliesTo) {
      case PromoScope.CATEGORY:
        if (!categoryIds || categoryIds.length === 0) {
          throw new BadRequestException('Category IDs are required for category-scoped promos');
        }
        break;
      case PromoScope.PRODUCT:
        if (!productIds || productIds.length === 0) {
          throw new BadRequestException('Product IDs are required for product-scoped promos');
        }
        break;
      case PromoScope.ORDER:
        // No additional validation needed for order-scoped promos
        break;
    }
  }
}