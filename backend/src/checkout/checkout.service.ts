import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../admin/products/products.service';
import { ApplyPromoDto, CartItemDto } from './dto/apply-promo.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { DeliveryConfig } from '../admin/products/dto/inventory-types';
import { StockType } from '@prisma/client';
import { PromoKind, PromoScope, PaymentStatus, LedgerKind } from '@prisma/client';
import { WalletService } from '../wallet/wallet.service';
import { XenditService } from '../billing/xendit.service';
import { EncryptionUtil } from '../utils/encryption.util';

interface CartItem {
  productId: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  product: {
    id: string;
    title: string;
    priceIDR: number;
    categoryId?: string;
  };
}

interface PromoCalculation {
  isValid: boolean;
  discount: number;
  message?: string;
  appliedItems?: CartItem[];
}

@Injectable()
export class CheckoutService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private walletService: WalletService,
    private xenditService: XenditService
  ) {}

  async applyPromo(applyPromoDto: ApplyPromoDto, userId: string) {
    const { code, items } = applyPromoDto;

    // Validate and calculate cart items
    const cartItems = await this.validateAndCalculateCart(items);
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Find and validate promo code
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        categories: true,
        products: true,
        redemptions: {
          where: { userId },
        },
      },
    });

    if (!promo) {
      throw new NotFoundException('Promo code not found');
    }

    // Validate promo code
    const validation = await this.validatePromoCode(promo, userId, subtotal, cartItems);
    
    if (!validation.isValid) {
      throw new BadRequestException(validation.message);
    }

    return {
      promoCode: code,
      discount: validation.discount,
      subtotal,
      total: subtotal - validation.discount,
      appliedItems: validation.appliedItems,
      message: 'Promo code applied successfully',
    };
  }

  async confirmOrder(confirmOrderDto: ConfirmOrderDto, userId: string) {
    const { items, promoCode } = confirmOrderDto;

    // Validate and calculate cart items
    const cartItems = await this.validateAndCalculateCart(items);
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

    let discount = 0;
    let promoId: string | null = null;

    // Apply promo code if provided
    if (promoCode) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
        include: {
          categories: true,
          products: true,
          redemptions: {
            where: { userId },
          },
        },
      });

      if (!promo) {
        throw new NotFoundException('Promo code not found');
      }

      const validation = await this.validatePromoCode(promo, userId, subtotal, cartItems);
      
      if (!validation.isValid) {
        throw new BadRequestException(validation.message);
      }

      discount = validation.discount;
      promoId = promo.id;
    }

    const total = subtotal - discount;

    // Generate order ID
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // TODO: Create order record in database
    // TODO: Process payment
    // TODO: Record promo redemption after successful payment

    return {
      orderId,
      items: cartItems.map(item => ({
        productId: item.productId,
        title: item.product.title,
        qty: item.qty,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
      subtotal,
      discount,
      total,
      promoCode,
      message: 'Order confirmed successfully',
    };
  }

  private async validateAndCalculateCart(items: CartItemDto[]): Promise<CartItem[]> {
    const cartItems: CartItem[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          title: true,
          priceIDR: true,
          salePriceIDR: true,
          salePercent: true,
          saleStartAt: true,
          saleEndAt: true,
          categoryId: true,
          status: true,
          fulfillment: true,
          deliveryCfg: true,
        },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      if (product.status !== 'PUBLISHED') {
        throw new BadRequestException(`Product ${product.title} is not available`);
      }

      // Enhanced stock validation for different inventory types
      const stockInfo = this.productsService.getProductStockInfo(product);
      
      // Skip stock validation for unlimited products
      if (stockInfo.stockType !== StockType.UNLIMITED) {
        const hasStock = await this.productsService.checkStock(item.productId, item.qty);
        if (!hasStock) {
          throw new BadRequestException(`Insufficient stock for ${product.title}. ${stockInfo.stockDisplay}, but you requested ${item.qty}.`);
        }
      }

      // Calculate final price using the products service logic
      const pricing = this.productsService.calculateFinalPrice(product);
      const unitPrice = pricing.finalPrice;
      const subtotal = unitPrice * item.qty;

      cartItems.push({
        productId: item.productId,
        qty: item.qty,
        unitPrice,
        subtotal,
        product: {
          id: product.id,
          title: product.title,
          priceIDR: product.priceIDR,
          categoryId: product.categoryId || undefined,
        },
      });
    }

    return cartItems;
  }

  private async validatePromoCode(
    promo: any,
    userId: string,
    subtotal: number,
    cartItems: CartItem[]
  ): Promise<PromoCalculation> {
    const now = new Date();

    // Check if promo is active
    if (!promo.isActive) {
      return { isValid: false, discount: 0, message: 'Promo code is not active' };
    }

    // Check date range
    if (promo.startAt && now < promo.startAt) {
      return { isValid: false, discount: 0, message: 'Promo code is not yet active' };
    }

    if (promo.endAt && now > promo.endAt) {
      return { isValid: false, discount: 0, message: 'Promo code has expired' };
    }

    // Check minimum subtotal
    if (promo.minSubtotalIDR && subtotal < promo.minSubtotalIDR) {
      return {
        isValid: false,
        discount: 0,
        message: `Minimum order amount is IDR ${promo.minSubtotalIDR.toLocaleString()}`,
      };
    }

    // Check usage limits
    if (promo.usageLimit) {
      const totalUsage = await this.prisma.promoRedemption.count({
        where: { promoCodeId: promo.id },
      });
      if (totalUsage >= promo.usageLimit) {
        return { isValid: false, discount: 0, message: 'Promo code usage limit reached' };
      }
    }

    if (promo.perUserLimit) {
      const userUsage = promo.redemptions.length;
      if (userUsage >= promo.perUserLimit) {
        return { isValid: false, discount: 0, message: 'You have reached the usage limit for this promo code' };
      }
    }

    // Calculate discount based on scope
    const discountCalculation = this.calculateDiscount(promo, cartItems);
    
    if (discountCalculation.discount === 0) {
      return {
        isValid: false,
        discount: 0,
        message: 'Promo code does not apply to any items in your cart',
      };
    }

    return {
      isValid: true,
      discount: discountCalculation.discount,
      appliedItems: discountCalculation.appliedItems,
    };
  }

  private calculateDiscount(
    promo: any,
    cartItems: CartItem[]
  ): { discount: number; appliedItems: CartItem[] } {
    let applicableSubtotal = 0;
    const appliedItems: CartItem[] = [];

    switch (promo.appliesTo) {
      case PromoScope.ORDER:
        applicableSubtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
        appliedItems.push(...cartItems);
        break;

      case PromoScope.CATEGORY:
        const categoryIds = promo.categories.map((c: any) => c.categoryId);
        for (const item of cartItems) {
          if (item.product.categoryId && categoryIds.includes(item.product.categoryId)) {
            applicableSubtotal += item.subtotal;
            appliedItems.push(item);
          }
        }
        break;

      case PromoScope.PRODUCT:
        const productIds = promo.products.map((p: any) => p.productId);
        for (const item of cartItems) {
          if (productIds.includes(item.productId)) {
            applicableSubtotal += item.subtotal;
            appliedItems.push(item);
          }
        }
        break;
    }

    if (applicableSubtotal === 0) {
      return { discount: 0, appliedItems: [] };
    }

    let discount = 0;

    if (promo.kind === PromoKind.PERCENT) {
      discount = Math.floor(applicableSubtotal * promo.value / 100);
      if (promo.maxDiscountIDR) {
        discount = Math.min(discount, promo.maxDiscountIDR);
      }
    } else if (promo.kind === PromoKind.FIXED) {
      discount = Math.min(promo.value, applicableSubtotal);
    }

    return { discount, appliedItems };
  }

  async recordPromoRedemption(promoCodeId: string, userId: string, orderId: string) {
    return this.prisma.promoRedemption.create({
      data: {
        promoCodeId,
        userId,
        orderId,
        audit: {
          redeemedAt: new Date().toISOString(),
          userAgent: 'checkout-service',
        },
      },
    });
  }

  async checkoutSingleProduct(
    userId: string,
    productId: string,
    paymentMethod: string,
    promoCode?: string
  ) {
    // Get product details
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== 'PUBLISHED') {
      throw new BadRequestException('Product is not available for purchase');
    }

    // Calculate price
    const pricing = this.productsService.calculateFinalPrice(product);
    const subtotal = pricing.finalPrice;

    // Apply promo code if provided
    let discount = 0;
    let promoId: string | null = null;

    if (promoCode) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
        include: {
          categories: true,
          products: true,
          redemptions: {
            where: { userId },
          },
        },
      });

      if (promo) {
        const validation = await this.validatePromoCode(promo, userId, subtotal, [{
          productId: product.id,
          qty: 1,
          unitPrice: pricing.finalPrice,
          subtotal: pricing.finalPrice,
          product: {
            id: product.id,
            title: product.title,
            priceIDR: product.priceIDR,
            categoryId: product.categoryId || undefined,
          },
        }]);

        if (validation.isValid) {
          discount = validation.discount;
          promoId = promo.id;
        }
      }
    }

    const total = subtotal - discount;

    // Process payment based on method
    if (paymentMethod === 'balance') {
      return this.processBalancePayment(userId, [product], total, promoId);
    } else if (paymentMethod === 'xendit') {
      return this.processXenditPayment(userId, [product], total, promoId);
    } else {
      throw new BadRequestException('Invalid payment method');
    }
  }

  async checkoutMultipleProducts(
    userId: string,
    productIds: string[],
    paymentMethod: string,
    promoCode?: string
  ) {
    // Get cart items
    const cartItems = await this.prisma.cart.findMany({
      where: {
        userId,
        productId: { in: productIds },
      },
      include: {
        product: {
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('No products found in cart');
    }

    // Validate all products are available
    const unavailable = cartItems.filter(item => item.product.status !== 'PUBLISHED');
    if (unavailable.length > 0) {
      throw new BadRequestException(`Some products are not available: ${unavailable.map(i => i.product.title).join(', ')}`);
    }

    // Calculate totals
    let subtotal = 0;
    const products: any[] = [];
    
    for (const item of cartItems) {
      const pricing = this.productsService.calculateFinalPrice(item.product);
      subtotal += pricing.finalPrice * item.quantity;
      products.push(item.product);
    }

    // Apply promo code if provided
    let discount = 0;
    let promoId: string | null = null;

    if (promoCode) {
      const items = cartItems.map(item => {
        const pricing = this.productsService.calculateFinalPrice(item.product);
        return {
          productId: item.product.id,
          qty: item.quantity,
          unitPrice: pricing.finalPrice,
          subtotal: pricing.finalPrice * item.quantity,
          product: {
            id: item.product.id,
            title: item.product.title,
            priceIDR: item.product.priceIDR,
            categoryId: item.product.categoryId || undefined,
          },
        };
      });

      const promo = await this.prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
        include: {
          categories: true,
          products: true,
          redemptions: {
            where: { userId },
          },
        },
      });

      if (promo) {
        const validation = await this.validatePromoCode(promo, userId, subtotal, items);
        if (validation.isValid) {
          discount = validation.discount;
          promoId = promo.id;
        }
      }
    }

    const total = subtotal - discount;

    // Process payment based on method
    if (paymentMethod === 'balance') {
      return this.processBalancePayment(userId, products, total, promoId, cartItems);
    } else if (paymentMethod === 'xendit') {
      return this.processXenditPayment(userId, products, total, promoId, cartItems);
    } else {
      throw new BadRequestException('Invalid payment method');
    }
  }

  private async processBalancePayment(
    userId: string,
    products: any[],
    total: number,
    promoId?: string | null,
    cartItems?: any[]
  ) {
    // Check wallet balance
    const wallet = await this.walletService.getWalletSummary(userId);
    
    if (wallet.balanceIDR < total) {
      throw new BadRequestException(`Insufficient balance. You need IDR ${total - wallet.balanceIDR} more.`);
    }

    // Generate order ID
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Enhanced delivery item generation supporting all inventory types
    const deliveryItems: any[] = [];
    for (const product of products) {
      // Get quantity from cart or default to 1 for single product purchase
      let quantity = 1;
      if (cartItems) {
        const cartItem = cartItems.find(item => item.productId === product.id);
        quantity = cartItem ? cartItem.quantity : 1;
      }

      const cfg = (product.deliveryCfg as unknown) as DeliveryConfig;
      const stockType = cfg?.stockType || StockType.STOCK_BASED;

      if (product.fulfillment === 'INSTANT') {
        // For stock-based products, consume items from inventory
        if (stockType === StockType.STOCK_BASED) {
          // Get delivery items based on product kind
          const deliveredItems = await this.productsService.consumeStock(product.id, quantity);
          
          // Decrypt the items before storing them in delivery items
          const decryptedItems = deliveredItems.map(item => {
            try {
              // Check if item is in encrypted format (should have 3 parts separated by colons)
              if (typeof item === 'string' && item.includes(':') && item.split(':').length === 3) {
                return EncryptionUtil.decrypt(item);
              } else {
                // Item is likely already in plain text or different format
                return item;
              }
            } catch (error) {
              // If decryption fails, log and return the item as-is
              console.log('Failed to decrypt item, using as plain text:', item);
              return item;
            }
          });
          
          for (let i = 0; i < decryptedItems.length; i++) {
            // Map product kind to frontend expected types
            let deliveryType = 'LICENSE_KEY'; // default
            switch (product.productKind) {
              case 'KEYS':
                deliveryType = 'LICENSE_KEY';
                break;
              case 'ACCESS_LINK':
                deliveryType = 'ACCESS_LINK';
                break;
              case 'SOURCE_CODE':
                deliveryType = 'FILE';
                break;
              case 'DIGITAL_ACCOUNT':
                deliveryType = 'LICENSE_KEY'; // treat as license key for display
                break;
            }
            
            deliveryItems.push({
              productId: product.id,
              type: deliveryType,
              content: decryptedItems[i],
              itemNumber: i + 1,
              stockType: StockType.STOCK_BASED,
            });
          }
        } else if (stockType === StockType.UNLIMITED) {
          // For unlimited products, get the actual delivery content
          const deliveredItems = await this.productsService.consumeStock(product.id, quantity);
          
          // Map product kind to frontend expected types
          let deliveryType = 'LICENSE_KEY'; // default
          switch (product.productKind) {
            case 'KEYS':
              deliveryType = 'LICENSE_KEY';
              break;
            case 'ACCESS_LINK':
              deliveryType = 'ACCESS_LINK';
              break;
            case 'SOURCE_CODE':
              deliveryType = 'SOURCE_CODE';
              break;
            case 'DIGITAL_ACCOUNT':
              deliveryType = 'LICENSE_KEY'; // treat as license key for display
              break;
          }
          
          if (deliveredItems.length > 0) {
            // Use actual delivery content from unlimited product
            for (let i = 0; i < deliveredItems.length; i++) {
              deliveryItems.push({
                productId: product.id,
                type: deliveryType,
                content: deliveredItems[i],
                itemNumber: i + 1,
                stockType: StockType.UNLIMITED,
              });
            }
          } else {
            // Fallback if no actual content available
            deliveryItems.push({
              productId: product.id,
              type: deliveryType,
              content: 'Unlimited access provided - no specific content configured',
              quantity: quantity,
              stockType: StockType.UNLIMITED,
              note: 'This is an unlimited product - unlimited access',
            });
          }
        }
      } else if (product.fulfillment === 'MANUAL') {
        deliveryItems.push({
          productId: product.id,
          type: product.delivery || 'MANUAL',
          content: `Manual fulfillment required - seller will contact you (Quantity: ${quantity})`,
          quantity: quantity,
          stockType: stockType,
        });
      }
    }

    // Create order record with delivery items
    const order = await this.prisma.order.create({
      data: {
        orderId,
        userId,
        totalIDR: total,
        status: 'PAID',
        paymentMethod: 'BALANCE',
        metadata: {
          products: products.map(p => {
            let quantity = 1;
            if (cartItems) {
              const cartItem = cartItems.find(item => item.productId === p.id);
              quantity = cartItem ? cartItem.quantity : 1;
            }
            return {
              id: p.id,
              title: p.title,
              price: p.priceIDR,
              fulfillment: p.fulfillment,
              delivery: p.delivery,
              quantity: quantity,
            };
          }),
          deliveryItems,
          promoCodeId: promoId,
        },
      },
    });

    // Deduct from wallet
    await this.walletService.addLedgerEntry(
      userId,
      -total,
      LedgerKind.DEBIT,
      `Purchase: ${orderId}`,
    );

    // Record promo redemption if used
    if (promoId) {
      await this.recordPromoRedemption(promoId, userId, orderId);
    }

    // Stock is already consumed above when getting deliveredItems
    // No need to consume stock again here

    // Clear cart items if this was a cart checkout
    if (cartItems) {
      await this.prisma.cart.deleteMany({
        where: {
          userId,
          productId: { in: cartItems.map(item => item.productId) },
        },
      });
    }

    // TODO: Send confirmation email with delivery items

    return {
      success: true,
      orderId,
      message: 'Payment successful',
      redirectUrl: `/orders/${orderId}`,
    };
  }

  private async processXenditPayment(
    userId: string,
    products: any[],
    total: number,
    promoId?: string | null,
    cartItems?: any[]
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate order ID
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create pending order
    const order = await this.prisma.order.create({
      data: {
        orderId,
        userId,
        totalIDR: total,
        status: 'PENDING',
        paymentMethod: 'XENDIT',
        metadata: {
          products: products.map(p => {
            let quantity = 1;
            if (cartItems) {
              const cartItem = cartItems.find(item => item.productId === p.id);
              quantity = cartItem ? cartItem.quantity : 1;
            }
            return {
              id: p.id,
              title: p.title,
              price: p.priceIDR,
              quantity: quantity,
            };
          }),
          promoCodeId: promoId,
          cartItemIds: cartItems?.map(item => item.id),
        },
      },
    });

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        orderId,
        grossIDR: total,
        status: PaymentStatus.PENDING,
        method: 'xendit_checkout',
      },
    });

    try {
      // Create Xendit invoice
      const xenditResponse = await this.xenditService.createPayment(
        orderId,
        total,
        {
          first_name: user.fullName,
          email: user.email,
        }
      );

      // Update payment with Xendit response
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          raw: xenditResponse,
          provider: 'xendit',
        },
      });

      return {
        success: true,
        orderId,
        paymentId: payment.id,
        redirectUrl: xenditResponse.invoice_url,
        invoiceId: xenditResponse.id,
        message: 'Redirecting to payment page...',
      };
    } catch (error) {
      // Update order and payment status to failed
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });
      
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAIL },
      });
      
      throw new BadRequestException('Failed to create payment. Please try again.');
    }
  }

  async getCheckoutPreview(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Calculate price
    const pricing = this.productsService.calculateFinalPrice(product);
    
    // Get wallet balance
    const wallet = await this.walletService.getWalletSummary(userId);

    return {
      product: {
        id: product.id,
        title: product.title,
        thumbnail: product.thumbnailUrl,
        price: pricing.originalPrice,
        finalPrice: pricing.finalPrice,
        category: product.category?.name,
        seller: 'Unknown',
      },
      subtotal: pricing.finalPrice,
      walletBalance: wallet.balanceIDR,
      canPayWithBalance: wallet.balanceIDR >= pricing.finalPrice,
    };
  }

  async getCartCheckoutPreview(userId: string) {
    const cartItems = await this.prisma.cart.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return {
        items: [],
        subtotal: 0,
        walletBalance: 0,
        canPayWithBalance: false,
      };
    }

    let subtotal = 0;
    const items = cartItems.map(item => {
      const pricing = this.productsService.calculateFinalPrice(item.product);
      const itemSubtotal = pricing.finalPrice * item.quantity;
      subtotal += itemSubtotal;

      return {
        id: item.id,
        product: {
          id: item.product.id,
          title: item.product.title,
          thumbnail: item.product.thumbnailUrl,
          price: pricing.originalPrice,
          finalPrice: pricing.finalPrice,
          category: item.product.category?.name,
          seller: 'Unknown',
        },
        quantity: item.quantity,
        subtotal: itemSubtotal,
      };
    });

    // Get wallet balance
    const wallet = await this.walletService.getWalletSummary(userId);

    return {
      items,
      subtotal,
      walletBalance: wallet.balanceIDR,
      canPayWithBalance: wallet.balanceIDR >= subtotal,
    };
  }

  async getOrderStatus(userId: string, orderId: string) {
    const order = await (this.prisma as any).order.findFirst({
      where: {
        orderId,
        userId,
      },
      include: {
        payment: true,
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
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
      // Return all delivery items instead of just one
      deliveryItems: deliveryItems_processed,
      // Keep the old format for backward compatibility
      deliveryInfo: deliveryItems_processed.length > 0 ? deliveryItems_processed[0] : null,
    };
  }
}
