import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoice(orderId: string) {
    // Get order details with all related information
    const order = await this.prisma.order.findFirst({
      where: { orderId: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            username: true,
          },
        },
        payment: {
          select: {
            status: true,
            method: true,
            provider: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Extract data from metadata
    const metadata = order.metadata as any;
    const products = metadata?.products || [];
    const deliveryItems = metadata?.deliveryItems || [];
    const promoCodeId = metadata?.promoCodeId;

    // Calculate invoice totals
    const subtotal = products.reduce((sum: number, product: any) => sum + (product.price * (product.quantity || 1)), 0);
    const discount = 0; // TODO: Calculate from promo code if exists
    const total = order.totalIDR;

    const invoiceData = {
      // Invoice metadata
      invoiceNumber: `INV-${order.id.slice(-8).toUpperCase()}`,
      invoiceDate: order.createdAt,
      dueDate: order.createdAt, // Digital products are immediate
      status: order.status,

      // Company information
      company: {
        name: 'A1Dev Platform',
        address: 'Digital Marketplace for Developers',
        email: 'support@a1dev.id',
        website: 'https://a1dev.id',
        logo: 'https://tgjoukgpxsoecinpqhne.supabase.co/storage/v1/object/public/avatars/A1Dev%20White.png',
      },

      // Customer information
      customer: {
        id: order.user.id,
        name: order.user.fullName || order.user.username || order.user.email,
        email: order.user.email,
        username: order.user.username,
      },

      // Order information
      order: {
        id: order.orderId,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },

      // Line items
      items: products.map((product: any) => ({
        id: product.id,
        productId: product.id,
        name: product.title,
        description: product.description || 'Digital product',
        category: product.category || 'Digital Product',
        quantity: product.quantity || 1,
        unitPrice: product.price,
        totalPrice: product.price * (product.quantity || 1),
      })),

      // Delivery items (for digital products) - keep for HTML but remove from PDF
      deliveryItems: deliveryItems.map((item: any) => ({
        type: item.type,
        value: item.content || item.value,
        metadata: item.metadata || {},
      })),

      // Financial breakdown
      pricing: {
        subtotal,
        discount,
        discountPercent: 0, // TODO: Get from promo code
        promoCode: promoCodeId,
        total,
        currency: 'IDR',
      },

      // Additional metadata
      metadata: {
        orderType: 'Digital Product Purchase',
        fulfillmentType: 'Instant Digital Delivery',
        invoiceGenerated: new Date(),
      },
    };

    return {
      invoice: invoiceData,
      html: this.generateInvoiceHTML(invoiceData),
    };
  }

  private generateInvoiceHTML(invoiceData: any): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date));
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoiceData.invoiceNumber} - A1Dev</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #ffffff;
            min-height: 100vh;
            padding: 20px;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 255, 255, 0.1);
            border: 1px solid #1a1a1a;
          }
          
          .invoice-header {
            background: linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #1a1a1a 100%);
            padding: 40px;
            border-bottom: 2px solid #00ffff;
            position: relative;
          }
          
          .invoice-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #00ffff 0%, #0099cc 50%, #00ffff 100%);
            animation: glow 2s ease-in-out infinite alternate;
          }
          
          @keyframes glow {
            from { box-shadow: 0 0 5px #00ffff; }
            to { box-shadow: 0 0 20px #00ffff, 0 0 30px #00ffff; }
          }
          
          .header-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: start;
          }
          
          .company-info {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          
          .company-logo {
            max-width: 120px;
            height: auto;
            filter: brightness(1.1) saturate(1.2);
          }
          
          .company-details h1 {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          }
          
          .company-details p {
            color: #cccccc;
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .invoice-meta {
            text-align: right;
          }
          
          .invoice-title {
            font-size: 36px;
            font-weight: 700;
            color: #00ffff;
            margin-bottom: 16px;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          }
          
          .invoice-number {
            background: linear-gradient(135deg, #00ffff 0%, #0099cc 100%);
            color: #000000;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            display: inline-block;
            margin-bottom: 12px;
          }
          
          .invoice-date {
            color: #cccccc;
            font-size: 14px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            margin-top: 8px;
          }
          
          .status-completed {
            background: linear-gradient(135deg, #00ff00 0%, #00cc00 100%);
            color: #000000;
          }
          
          .status-pending {
            background: linear-gradient(135deg, #ffaa00 0%, #ff8800 100%);
            color: #000000;
          }
          
          .invoice-body {
            padding: 40px;
            background: #000000;
          }
          
          .customer-info {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
            border: 1px solid #333333;
          }
          
          .customer-info h3 {
            color: #00ffff;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .customer-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
          }
          
          .customer-field {
            color: #cccccc;
            font-size: 14px;
          }
          
          .customer-field strong {
            color: #ffffff;
            display: block;
            margin-bottom: 4px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #333333;
          }
          
          .items-table thead {
            background: linear-gradient(135deg, #00ffff 0%, #0099cc 100%);
          }
          
          .items-table th {
            padding: 16px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .items-table tbody tr {
            border-bottom: 1px solid #333333;
          }
          
          .items-table tbody tr:last-child {
            border-bottom: none;
          }
          
          .items-table td {
            padding: 16px;
            color: #ffffff;
            font-size: 14px;
            vertical-align: top;
          }
          
          .item-name {
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 4px;
          }
          
          .item-description {
            color: #cccccc;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .item-category {
            background: #333333;
            color: #00ffff;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            display: inline-block;
            margin-top: 4px;
          }
          
          .price-column {
            text-align: right;
            font-weight: 600;
          }
          
          .delivery-section {
            background: linear-gradient(135deg, #0a1a0a 0%, #1a2a1a 100%);
            border: 1px solid #004400;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
          }
          
          .delivery-section h3 {
            color: #00ff00;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .delivery-items {
            display: grid;
            gap: 12px;
          }
          
          .delivery-item {
            background: #0a0a0a;
            border: 1px solid #333333;
            border-radius: 8px;
            padding: 16px;
          }
          
          .delivery-item-type {
            color: #00ff00;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          
          .delivery-item-value {
            color: #ffffff;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            background: #1a1a1a;
            padding: 8px;
            border-radius: 6px;
            word-break: break-all;
          }
          
          .totals-section {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid #333333;
            margin-bottom: 32px;
          }
          
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #333333;
          }
          
          .totals-row:last-child {
            border-bottom: none;
            font-size: 18px;
            font-weight: 700;
            color: #00ffff;
            margin-top: 8px;
            padding-top: 16px;
            border-top: 2px solid #00ffff;
          }
          
          .totals-label {
            color: #cccccc;
            font-weight: 500;
          }
          
          .totals-value {
            color: #ffffff;
            font-weight: 600;
          }
          
          .discount-row {
            color: #ff4500 !important;
          }
          
          .invoice-footer {
            background: #0a0a0a;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #1a1a1a;
          }
          
          .footer-note {
            color: #888888;
            font-size: 14px;
            margin-bottom: 16px;
          }
          
          .footer-brand {
            color: #00ffff;
            font-weight: 700;
            font-size: 16px;
            margin-bottom: 8px;
          }
          
          .footer-links {
            color: #666666;
            font-size: 12px;
          }
          
          .footer-links a {
            color: #00ffff;
            text-decoration: none;
            margin: 0 8px;
            transition: opacity 0.3s ease;
          }
          
          .footer-links a:hover {
            opacity: 0.8;
          }
          
          /* PDF-specific optimizations */
          @media print {
            body { 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
              padding: 0;
              margin: 0;
            }
            
            .invoice-container {
              margin: 0;
              padding: 0;
              box-shadow: none;
              border-radius: 0;
              max-width: none;
            }
            
            /* Disable animations for PDF */
            .invoice-header::before {
              animation: none;
            }
            
            /* Ensure backgrounds are preserved */
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
            }
            
            /* Optimize fonts for PDF */
            body {
              font-family: 'Inter', 'Helvetica', 'Arial', sans-serif;
            }
          }
          
          @media only screen and (max-width: 768px) {
            .header-content {
              grid-template-columns: 1fr;
              gap: 24px;
            }
            .invoice-meta {
              text-align: left;
            }
            .customer-details {
              grid-template-columns: 1fr;
            }
            .items-table {
              font-size: 12px;
            }
            .items-table th,
            .items-table td {
              padding: 12px 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <div class="header-content">
              <div class="company-info">
                <img src="${invoiceData.company.logo}" alt="A1Dev Logo" class="company-logo" />
                <div class="company-details">
                  <h1>${invoiceData.company.name}</h1>
                  <p>${invoiceData.company.address}</p>
                  <p>${invoiceData.company.email}</p>
                  <p>${invoiceData.company.website}</p>
                </div>
              </div>
              
              <div class="invoice-meta">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">${invoiceData.invoiceNumber}</div>
                <div class="invoice-date">
                  Date: ${formatDate(invoiceData.invoiceDate)}<br>
                  Order: ${invoiceData.order.id}
                </div>
                <div class="status-badge status-${invoiceData.status.toLowerCase()}">
                  ${invoiceData.status}
                </div>
              </div>
            </div>
          </div>
          
          <div class="invoice-body">
            <div class="customer-info">
              <h3>🧑‍💻 Customer Information</h3>
              <div class="customer-details">
                <div class="customer-field">
                  <strong>Name</strong>
                  ${invoiceData.customer.name}
                </div>
                <div class="customer-field">
                  <strong>Email</strong>
                  ${invoiceData.customer.email}
                </div>
                <div class="customer-field">
                  <strong>Username</strong>
                  ${invoiceData.customer.username || 'N/A'}
                </div>
                <div class="customer-field">
                  <strong>Customer ID</strong>
                  ${invoiceData.customer.id}
                </div>
                <div class="customer-field">
                  <strong>Payment Method</strong>
                  ${invoiceData.order.paymentMethod || 'Wallet Balance'}
                </div>
                <div class="customer-field">
                  <strong>Order Date</strong>
                  ${formatDate(invoiceData.order.createdAt)}
                </div>
              </div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items.map(item => `
                  <tr>
                    <td>
                      <div class="item-name">${item.name}</div>
                      <div class="item-description">${item.description}</div>
                      <div class="item-category">${item.category}</div>
                    </td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td class="price-column">${formatCurrency(item.unitPrice)}</td>
                    <td class="price-column">${formatCurrency(item.totalPrice)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            ${invoiceData.deliveryItems.length > 0 ? `
            <div class="delivery-section">
              <h3>⚡ Digital Delivery Items</h3>
              <div class="delivery-items">
                ${invoiceData.deliveryItems.map(item => `
                  <div class="delivery-item">
                    <div class="delivery-item-type">${item.type}</div>
                    <div class="delivery-item-value">${item.value}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            <div class="totals-section">
              <div class="totals-row">
                <span class="totals-label">Subtotal</span>
                <span class="totals-value">${formatCurrency(invoiceData.pricing.subtotal)}</span>
              </div>
              
              ${invoiceData.pricing.discount > 0 ? `
              <div class="totals-row discount-row">
                <span class="totals-label">
                  Discount ${invoiceData.pricing.promoCode ? `(${invoiceData.pricing.promoCode})` : ''}
                  ${invoiceData.pricing.discountPercent > 0 ? `${invoiceData.pricing.discountPercent}%` : ''}
                </span>
                <span class="totals-value">-${formatCurrency(invoiceData.pricing.discount)}</span>
              </div>
              ` : ''}
              
              <div class="totals-row">
                <span class="totals-label">TOTAL AMOUNT</span>
                <span class="totals-value">${formatCurrency(invoiceData.pricing.total)}</span>
              </div>
            </div>
          </div>
          
          <div class="invoice-footer">
            <div class="footer-note">
              Thank you for choosing A1Dev! This invoice was automatically generated for your digital product purchase.
              All items have been delivered instantly to your account.
            </div>
            <div class="footer-brand">A1Dev Platform</div>
            <div class="footer-links">
              <a href="#">Support</a> |
              <a href="#">Terms</a> |
              <a href="#">Privacy</a>
            </div>
            <div style="margin-top: 16px; font-size: 12px; color: #666666;">
              Generated on ${formatDate(invoiceData.metadata.invoiceGenerated)}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async getInvoiceByOrderId(orderId: string) {
    return this.generateInvoice(orderId);
  }

  async getAllInvoices(limit: number = 50, offset: number = 0) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'COMPLETED',
      },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return {
      invoices: orders.map(order => ({
        orderId: order.orderId,
        invoiceNumber: `INV-${order.orderId.slice(-8).toUpperCase()}`,
        customerName: order.user.fullName || order.user.username || order.user.email,
        customerEmail: order.user.email,
        totalAmount: order.totalIDR,
        status: order.status,
        createdAt: order.createdAt,
      })),
      total: orders.length,
    };
  }

  async generatePDF(orderId: string): Promise<Buffer> {
    const { html } = await this.generateInvoice(orderId);
    
    let browser: puppeteer.Browser | null = null;
    
    try {
      // Launch Puppeteer browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });
      
      // Set content and wait for fonts to load
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Wait a bit more for fonts to fully load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate PDF with high quality settings
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: false,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        displayHeaderFooter: false,
        scale: 0.8
      });
      
      await browser.close();
      
      // Convert Uint8Array to Buffer
      return Buffer.from(pdfBuffer);
      
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
}