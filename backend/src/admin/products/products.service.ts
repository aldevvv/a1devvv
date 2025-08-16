import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { DeliveryConfig, ProductStockInfo } from './dto/inventory-types';
import { ProductStatus, FulfillmentMode, ProductKind, StockType } from '@prisma/client';
import slugify from 'slugify';
import { EncryptionUtil } from '../../utils/encryption.util';
import { FileStorageService } from './file-storage.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private fileStorage: FileStorageService,
  ) {}

  async findAll(
    categoryId?: string,
    status?: ProductStatus,
    fulfillment?: FulfillmentMode,
    search?: string
  ) {
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (fulfillment) {
      where.fulfillment = fulfillment;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } },
        { summary: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const {
      title,
      thumbnailUrl,
      categoryId,
      summary,
      description,
      priceIDR,
      status,
      type,
      fulfillment,
      productKind,
      stockType,
      deliveryCfg,
      salePriceIDR,
      salePercent,
      saleStartAt,
      saleEndAt,
    } = createProductDto;

    // Initialize and encrypt deliveryCfg if needed
    let finalDeliveryCfg = deliveryCfg || {
      productKind,
      stockType,
      deliveredCount: 0,
    };

    // Encrypt sensitive data based on product kind
    if (finalDeliveryCfg) {
      switch (productKind) {
        case ProductKind.KEYS:
          if (finalDeliveryCfg.keys && finalDeliveryCfg.keys.length > 0) {
            finalDeliveryCfg.keys = EncryptionUtil.encryptArray(finalDeliveryCfg.keys);
          }
          break;
        case ProductKind.ACCESS_LINK:
          if (finalDeliveryCfg.accessLinks && finalDeliveryCfg.accessLinks.length > 0) {
            finalDeliveryCfg.accessLinks = EncryptionUtil.encryptArray(finalDeliveryCfg.accessLinks);
          }
          break;
        case ProductKind.DIGITAL_ACCOUNT:
          if (finalDeliveryCfg.digitalAccounts && finalDeliveryCfg.digitalAccounts.length > 0) {
            finalDeliveryCfg.digitalAccounts = EncryptionUtil.encryptArray(finalDeliveryCfg.digitalAccounts);
          }
          break;
        case ProductKind.SOURCE_CODE:
          // Source file path is already encrypted by FileStorageService
          break;
      }
    }

    let { slug } = createProductDto;

    // Generate slug if not provided
    if (!slug) {
      slug = slugify(title, { lower: true, strict: true });
    }

    // Check if slug already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this slug already exists');
    }

    // Validate category exists if provided
    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Validate sale pricing
    this.validateSalePricing(priceIDR, salePriceIDR, salePercent);

    return this.prisma.product.create({
      data: {
        title,
        slug,
        thumbnailUrl,
        categoryId,
        summary,
        description,
        priceIDR,
        status,
        type,
        fulfillment,
        productKind,
        stockType,
        deliveryCfg: finalDeliveryCfg,
        salePriceIDR,
        salePercent,
        saleStartAt: saleStartAt ? new Date(saleStartAt) : null,
        saleEndAt: saleEndAt ? new Date(saleEndAt) : null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    const {
      title,
      categoryId,
      summary,
      description,
      priceIDR,
      status,
      type,
      fulfillment,
      productKind,
      stockType,
      deliveryCfg,
      thumbnailUrl,
      salePriceIDR,
      salePercent,
      saleStartAt,
      saleEndAt,
    } = updateProductDto;

    let { slug } = updateProductDto;

    // Generate new slug if title changed but slug not provided
    if (title && !slug && title !== product.title) {
      slug = slugify(title, { lower: true, strict: true });
    }

    // Check if new slug conflicts with existing products
    if (slug && slug !== product.slug) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { slug },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this slug already exists');
      }
    }

    // Validate category exists if provided
    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Validate sale pricing
    const finalPriceIDR = priceIDR ?? product.priceIDR;
    this.validateSalePricing(finalPriceIDR, salePriceIDR, salePercent);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(thumbnailUrl && { thumbnailUrl }),
        ...(categoryId !== undefined && { categoryId }),
        ...(summary !== undefined && { summary }),
        ...(description !== undefined && { description }),
        ...(priceIDR && { priceIDR }),
        ...(status && { status }),
        ...(type && { type }),
        ...(fulfillment && { fulfillment }),
        ...(productKind && { productKind }),
        ...(stockType && { stockType }),
        ...(deliveryCfg !== undefined && { deliveryCfg }),
        ...(salePriceIDR !== undefined && { salePriceIDR }),
        ...(salePercent !== undefined && { salePercent }),
        ...(saleStartAt !== undefined && { saleStartAt: saleStartAt ? new Date(saleStartAt) : null }),
        ...(saleEndAt !== undefined && { saleEndAt: saleEndAt ? new Date(saleEndAt) : null }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }

  // Helper method to calculate final price with sale logic
  calculateFinalPrice(product: {
    priceIDR: number;
    salePriceIDR?: number | null;
    salePercent?: number | null;
    saleStartAt?: Date | null;
    saleEndAt?: Date | null;
  }): { finalPrice: number; isOnSale: boolean; originalPrice: number } {
    const now = new Date();
    const { priceIDR, salePriceIDR, salePercent, saleStartAt, saleEndAt } = product;

    // Check if sale is active
    const isSaleActive = this.isSaleActive(saleStartAt, saleEndAt, salePriceIDR, salePercent);

    if (!isSaleActive) {
      return {
        finalPrice: priceIDR,
        isOnSale: false,
        originalPrice: priceIDR,
      };
    }

    let salePrice = priceIDR;

    if (salePriceIDR) {
      salePrice = salePriceIDR;
    } else if (salePercent) {
      salePrice = Math.floor(priceIDR * (100 - salePercent) / 100);
    }

    const finalPrice = Math.min(salePrice, priceIDR);

    return {
      finalPrice,
      isOnSale: finalPrice < priceIDR,
      originalPrice: priceIDR,
    };
  }

  private isSaleActive(
    saleStartAt?: Date | null,
    saleEndAt?: Date | null,
    salePriceIDR?: number | null,
    salePercent?: number | null
  ): boolean {
    // Must have either sale price or sale percent
    if (!salePriceIDR && !salePercent) {
      return false;
    }

    const now = new Date();

    // If both dates are null and sale fields are present, treat as active
    if (!saleStartAt && !saleEndAt) {
      return true;
    }

    // Check if current time is within sale window
    if (saleStartAt && now < saleStartAt) {
      return false;
    }

    if (saleEndAt && now > saleEndAt) {
      return false;
    }

    return true;
  }

  private validateSalePricing(
    priceIDR: number,
    salePriceIDR?: number,
    salePercent?: number
  ): void {
    // Can't have both sale price and sale percent
    if (salePriceIDR && salePercent) {
      throw new BadRequestException('Cannot set both sale price and sale percentage');
    }

    // Sale price must be less than original price
    if (salePriceIDR && salePriceIDR >= priceIDR) {
      throw new BadRequestException('Sale price must be less than original price');
    }

    // Sale percent must be between 1 and 90
    if (salePercent && (salePercent < 1 || salePercent > 90)) {
      throw new BadRequestException('Sale percentage must be between 1 and 90');
    }
  }

  // Calculate available stock based on product kind and stock type
  calculateStock(product: any): number {
    if (!product.deliveryCfg) return 0;
    
    const cfg = product.deliveryCfg as DeliveryConfig;
    const productKind = product.productKind || ProductKind.KEYS;
    const stockType = product.stockType || StockType.STOCK_BASED;
    
    // UNLIMITED type always has infinite stock
    if (stockType === StockType.UNLIMITED) {
      return 999999;
    }
    
    // STOCK_BASED - calculate based on product kind
    // Note: We're counting encrypted items, which is fine since we just need the count
    switch (productKind) {
      case ProductKind.KEYS:
        if (cfg.keys && Array.isArray(cfg.keys)) {
          return cfg.keys.length; // Count encrypted keys
        }
        return 0;
        
      case ProductKind.ACCESS_LINK:
        if (cfg.accessLinks && Array.isArray(cfg.accessLinks)) {
          return cfg.accessLinks.length; // Count encrypted links
        }
        return 0;
        
      case ProductKind.DIGITAL_ACCOUNT:
        if (cfg.digitalAccounts && Array.isArray(cfg.digitalAccounts)) {
          return cfg.digitalAccounts.length; // Count encrypted accounts
        }
        return 0;
        
      case ProductKind.SOURCE_CODE:
        // Source code typically unlimited but can be stock-based
        if (stockType === StockType.STOCK_BASED && cfg.sourceFile) {
          // For stock-based source code, we consider it available if file exists
          return cfg.sourceFile ? 1 : 0;
        }
        return cfg.sourceFile ? 999999 : 0;
        
      default:
        return 0;
    }
  }

  // Check if product has sufficient stock
  async checkStock(productId: string, quantity: number = 1): Promise<boolean> {
    const product = await this.findOne(productId);
    const availableStock = this.calculateStock(product);
    return availableStock >= quantity;
  }

  // Consume stock when product is purchased
  async consumeStock(productId: string, quantity: number = 1): Promise<string[]> {
    const product = await this.findOne(productId);
    const availableStock = this.calculateStock(product);
    
    if (product.stockType === StockType.STOCK_BASED && availableStock < quantity) {
      throw new BadRequestException(`Insufficient stock. Only ${availableStock} available.`);
    }
    
    const cfg = (product.deliveryCfg as unknown) as DeliveryConfig;
    const deliveredItems: string[] = [];
    
    // For UNLIMITED type, just track delivery count
    if (product.stockType === StockType.UNLIMITED) {
      const newCount = (cfg.deliveredCount || 0) + quantity;
      
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          deliveryCfg: {
            ...cfg,
            deliveredCount: newCount
          }
        }
      });
      
      // Return the unlimited item multiple times
      if (product.productKind === ProductKind.SOURCE_CODE && cfg.sourceFile) {
        for (let i = 0; i < quantity; i++) {
          deliveredItems.push(cfg.sourceFile);
        }
      }
      
      return deliveredItems;
    }
    
    // For STOCK_BASED, consume actual items
    switch (product.productKind) {
      case ProductKind.KEYS:
        if (cfg.keys && cfg.keys.length >= quantity) {
          const consumedKeys = cfg.keys.slice(0, quantity);
          const remainingKeys = cfg.keys.slice(quantity);
          
          await this.prisma.product.update({
            where: { id: productId },
            data: {
              deliveryCfg: {
                ...cfg,
                keys: remainingKeys
              }
            }
          });
          
          return consumedKeys;
        }
        break;
        
      case ProductKind.ACCESS_LINK:
        if (cfg.accessLinks && cfg.accessLinks.length >= quantity) {
          const consumedLinks = cfg.accessLinks.slice(0, quantity);
          const remainingLinks = cfg.accessLinks.slice(quantity);
          
          await this.prisma.product.update({
            where: { id: productId },
            data: {
              deliveryCfg: {
                ...cfg,
                accessLinks: remainingLinks
              }
            }
          });
          
          return consumedLinks;
        }
        break;
        
      case ProductKind.DIGITAL_ACCOUNT:
        if (cfg.digitalAccounts && cfg.digitalAccounts.length >= quantity) {
          const consumedAccounts = cfg.digitalAccounts.slice(0, quantity);
          const remainingAccounts = cfg.digitalAccounts.slice(quantity);
          
          await this.prisma.product.update({
            where: { id: productId },
            data: {
              deliveryCfg: {
                ...cfg,
                digitalAccounts: remainingAccounts
              }
            }
          });
          
          return consumedAccounts;
        }
        break;
        
      case ProductKind.SOURCE_CODE:
        // For stock-based source code, just return the file URL
        if (cfg.sourceFile) {
          for (let i = 0; i < quantity; i++) {
            deliveredItems.push(cfg.sourceFile);
          }
          return deliveredItems;
        }
        break;
    }
    
    return deliveredItems;
  }

  // Get preview of delivery item without consuming
  async getDeliveryPreview(productId: string): Promise<string | null> {
    const product = await this.findOne(productId);
    
    if (product.fulfillment !== FulfillmentMode.INSTANT) {
      return null;
    }
    
    const cfg = (product.deliveryCfg as unknown) as DeliveryConfig;
    
    switch (product.productKind) {
      case ProductKind.KEYS:
        if (cfg.keys && cfg.keys.length > 0) {
          return cfg.keys[0];
        }
        break;
        
      case ProductKind.ACCESS_LINK:
        if (cfg.accessLinks && cfg.accessLinks.length > 0) {
          return cfg.accessLinks[0];
        }
        break;
        
      case ProductKind.DIGITAL_ACCOUNT:
        if (cfg.digitalAccounts && cfg.digitalAccounts.length > 0) {
          return cfg.digitalAccounts[0];
        }
        break;
        
      case ProductKind.SOURCE_CODE:
        return cfg.sourceFile || null;
    }
    
    return null;
  }

  // Get comprehensive stock information for a product
  getProductStockInfo(product: any): ProductStockInfo {
    const availableStock = this.calculateStock(product);
    const productKind = product.productKind || ProductKind.KEYS;
    const stockType = product.stockType || StockType.STOCK_BASED;
    
    let stockDisplay = '';
    let warningLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'OUT' = 'HIGH';
    
    if (stockType === StockType.UNLIMITED) {
      stockDisplay = 'Unlimited Stock';
      warningLevel = 'HIGH';
    } else {
      stockDisplay = `${availableStock} available`;
      
      if (availableStock === 0) {
        warningLevel = 'OUT';
      } else if (availableStock <= 2) {
        warningLevel = 'LOW';
      } else if (availableStock <= 5) {
        warningLevel = 'MEDIUM';
      } else {
        warningLevel = 'HIGH';
      }
    }
    
    return {
      availableStock,
      stockType,
      productKind,
      isAvailable: availableStock > 0,
      stockDisplay,
      warningLevel
    };
  }

  // Add stock items to product
  async addStockItems(productId: string, items: string[]): Promise<void> {
    const product = await this.findOne(productId);
    const cfg = (product.deliveryCfg as unknown) as DeliveryConfig;
    
    if (product.stockType !== StockType.STOCK_BASED) {
      throw new BadRequestException('Can only add stock to STOCK_BASED products');
    }
    
    let updatedCfg = { ...cfg };
    
    switch (product.productKind) {
      case ProductKind.KEYS:
        const currentKeys = cfg.keys || [];
        updatedCfg.keys = [...currentKeys, ...items];
        break;
        
      case ProductKind.ACCESS_LINK:
        const currentLinks = cfg.accessLinks || [];
        updatedCfg.accessLinks = [...currentLinks, ...items];
        break;
        
      case ProductKind.DIGITAL_ACCOUNT:
        const currentAccounts = cfg.digitalAccounts || [];
        updatedCfg.digitalAccounts = [...currentAccounts, ...items];
        break;
        
      case ProductKind.SOURCE_CODE:
        if (items.length > 0) {
          updatedCfg.sourceFile = items[0]; // Only use first item for source code
        }
        break;
        
      default:
        throw new BadRequestException('Invalid product kind');
    }
    
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        deliveryCfg: updatedCfg
      }
    });
  }
}