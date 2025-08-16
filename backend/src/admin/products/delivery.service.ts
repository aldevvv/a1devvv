import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionUtil } from '../../utils/encryption.util';
import { FileStorageService } from './file-storage.service';
import { ProductKind, StockType } from '@prisma/client';

export interface DeliveryResult {
  success: boolean;
  items: string[];
  downloadLinks?: string[];
  error?: string;
}

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    private fileStorage: FileStorageService,
  ) {}

  /**
   * Deliver product items to customer after successful payment
   */
  async deliverProduct(
    productId: string,
    userId: string,
    orderId: string,
    quantity: number = 1
  ): Promise<DeliveryResult> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return {
          success: false,
          items: [],
          error: 'Product not found',
        };
      }

      const cfg = product.deliveryCfg as any;
      const deliveredItems: string[] = [];
      const downloadLinks: string[] = [];

      // Handle UNLIMITED stock type
      if (product.stockType === StockType.UNLIMITED) {
        return this.deliverUnlimitedProduct(product, userId, orderId, quantity);
      }

      // Handle STOCK_BASED products
      switch (product.productKind) {
        case ProductKind.KEYS:
          return this.deliverKeys(productId, cfg, quantity, userId, orderId);
          
        case ProductKind.ACCESS_LINK:
          return this.deliverAccessLinks(productId, cfg, quantity, userId, orderId);
          
        case ProductKind.DIGITAL_ACCOUNT:
          return this.deliverDigitalAccounts(productId, cfg, quantity, userId, orderId);
          
        case ProductKind.SOURCE_CODE:
          return this.deliverSourceCode(product, cfg, userId, orderId, quantity);
          
        default:
          return {
            success: false,
            items: [],
            error: 'Unknown product kind',
          };
      }
    } catch (error) {
      console.error('Delivery error:', error);
      return {
        success: false,
        items: [],
        error: 'Failed to deliver product',
      };
    }
  }

  /**
   * Deliver unlimited products
   */
  private async deliverUnlimitedProduct(
    product: any,
    userId: string,
    orderId: string,
    quantity: number
  ): Promise<DeliveryResult> {
    const cfg = product.deliveryCfg as any;
    const deliveredItems: string[] = [];
    const downloadLinks: string[] = [];

    // Update delivery count
    const newCount = (cfg.deliveredCount || 0) + quantity;
    await this.prisma.product.update({
      where: { id: product.id },
      data: {
        deliveryCfg: {
          ...cfg,
          deliveredCount: newCount,
        },
      },
    });

    switch (product.productKind) {
      case ProductKind.SOURCE_CODE:
        if (cfg.sourceFile) {
          // Generate unique download links for each quantity
          for (let i = 0; i < quantity; i++) {
            const link = await this.fileStorage.generateDownloadLink(
              cfg.sourceFile,
              userId,
              product.id,
              `${orderId}_${i}`
            );
            downloadLinks.push(link);
          }
        }
        break;
        
      // For other unlimited types, decrypt and deliver the same item
      default:
        if (cfg.keys && cfg.keys.length > 0) {
          const decryptedKey = EncryptionUtil.decrypt(cfg.keys[0]);
          for (let i = 0; i < quantity; i++) {
            deliveredItems.push(decryptedKey);
          }
        }
        break;
    }

    // Save delivery record
    await this.saveDeliveryRecords(product.id, userId, orderId, deliveredItems, quantity);

    return {
      success: true,
      items: deliveredItems,
      downloadLinks,
    };
  }

  /**
   * Deliver API/License keys
   */
  private async deliverKeys(
    productId: string,
    cfg: any,
    quantity: number,
    userId: string,
    orderId: string
  ): Promise<DeliveryResult> {
    if (!cfg.keys || cfg.keys.length < quantity) {
      return {
        success: false,
        items: [],
        error: `Insufficient stock. Only ${cfg.keys?.length || 0} available`,
      };
    }

    // Get and decrypt keys
    const encryptedKeys = cfg.keys.slice(0, quantity);
    const remainingKeys = cfg.keys.slice(quantity);
    const decryptedKeys = EncryptionUtil.decryptArray(encryptedKeys);

    // Update product with remaining keys
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        deliveryCfg: {
          ...cfg,
          keys: remainingKeys,
        },
      },
    });

    // Save delivery record
    await this.saveDeliveryRecords(productId, userId, orderId, decryptedKeys, quantity);

    return {
      success: true,
      items: decryptedKeys,
    };
  }

  /**
   * Deliver access links
   */
  private async deliverAccessLinks(
    productId: string,
    cfg: any,
    quantity: number,
    userId: string,
    orderId: string
  ): Promise<DeliveryResult> {
    if (!cfg.accessLinks || cfg.accessLinks.length < quantity) {
      return {
        success: false,
        items: [],
        error: `Insufficient stock. Only ${cfg.accessLinks?.length || 0} available`,
      };
    }

    // Get and decrypt links
    const encryptedLinks = cfg.accessLinks.slice(0, quantity);
    const remainingLinks = cfg.accessLinks.slice(quantity);
    const decryptedLinks = EncryptionUtil.decryptArray(encryptedLinks);

    // Update product with remaining links
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        deliveryCfg: {
          ...cfg,
          accessLinks: remainingLinks,
        },
      },
    });

    // Save delivery record
    await this.saveDeliveryRecords(productId, userId, orderId, decryptedLinks, quantity);

    return {
      success: true,
      items: decryptedLinks,
    };
  }

  /**
   * Deliver digital accounts
   */
  private async deliverDigitalAccounts(
    productId: string,
    cfg: any,
    quantity: number,
    userId: string,
    orderId: string
  ): Promise<DeliveryResult> {
    if (!cfg.digitalAccounts || cfg.digitalAccounts.length < quantity) {
      return {
        success: false,
        items: [],
        error: `Insufficient stock. Only ${cfg.digitalAccounts?.length || 0} available`,
      };
    }

    // Get and decrypt accounts
    const encryptedAccounts = cfg.digitalAccounts.slice(0, quantity);
    const remainingAccounts = cfg.digitalAccounts.slice(quantity);
    const decryptedAccounts = EncryptionUtil.decryptArray(encryptedAccounts);

    // Update product with remaining accounts
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        deliveryCfg: {
          ...cfg,
          digitalAccounts: remainingAccounts,
        },
      },
    });

    // Save delivery record
    await this.saveDeliveryRecords(productId, userId, orderId, decryptedAccounts, quantity);

    return {
      success: true,
      items: decryptedAccounts,
    };
  }

  /**
   * Deliver source code files
   */
  private async deliverSourceCode(
    product: any,
    cfg: any,
    userId: string,
    orderId: string,
    quantity: number
  ): Promise<DeliveryResult> {
    if (!cfg.sourceFile) {
      return {
        success: false,
        items: [],
        error: 'No source file available',
      };
    }

    const downloadLinks: string[] = [];

    // Generate unique download links for each quantity
    for (let i = 0; i < quantity; i++) {
      const link = await this.fileStorage.generateDownloadLink(
        cfg.sourceFile, // Already encrypted file path
        userId,
        product.id,
        `${orderId}_${i}`
      );
      downloadLinks.push(link);
    }

    // Save delivery record with download links
    await this.saveDeliveryRecords(product.id, userId, orderId, downloadLinks, quantity);

    return {
      success: true,
      items: [],
      downloadLinks,
    };
  }

  /**
   * Save delivery records to database
   */
  private async saveDeliveryRecords(
    productId: string,
    userId: string,
    orderId: string,
    items: string[],
    quantity: number
  ): Promise<void> {
    // Save each delivered item
    const deliveryRecords = items.map(item => ({
      productId,
      userId,
      orderId,
      itemValue: item,
      quantity: 1,
    }));

    // If no specific items (like for unlimited products), save a single record
    if (deliveryRecords.length === 0 && quantity > 0) {
      deliveryRecords.push({
        productId,
        userId,
        orderId,
        itemValue: 'UNLIMITED_PRODUCT',
        quantity,
      });
    }

    await this.prisma.productDelivery.createMany({
      data: deliveryRecords,
    });
  }

  /**
   * Get delivery history for an order
   */
  async getOrderDeliveries(orderId: string): Promise<any[]> {
    const deliveries = await this.prisma.productDelivery.findMany({
      where: { orderId },
      include: {
        product: {
          select: {
            title: true,
            productKind: true,
            stockType: true,
          },
        },
      },
    });

    // Decrypt items if needed (for display purposes)
    return deliveries.map(delivery => {
      // Don't decrypt download links, they should be used as-is
      if (delivery.itemValue.startsWith('http')) {
        return delivery;
      }
      
      // For other items, you might want to partially mask them for security
      return {
        ...delivery,
        itemValue: this.maskSensitiveData(delivery.itemValue),
      };
    });
  }

  /**
   * Mask sensitive data for display
   */
  private maskSensitiveData(value: string): string {
    if (value.length <= 8) {
      return '****';
    }
    
    const visibleChars = 4;
    const start = value.substring(0, visibleChars);
    const end = value.substring(value.length - visibleChars);
    return `${start}****${end}`;
  }
}
