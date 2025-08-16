import { Controller, Get, Param, Query, UseGuards, NotFoundException, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AccessTokenGuard } from '../auth/guards/access.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { OrdersService } from './orders.service';
import { InvoicesService } from '../admin/invoices/invoices.service';

@Controller('orders')
@UseGuards(AccessTokenGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Get()
  async getUserOrdersPaginated(
    @CurrentUser() user: { id: string },
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '10', 10);
    return this.ordersService.getUserOrders(user.id, status, pageNum, limitNum);
  }

  @Get('user')
  async getUserOrders(
    @CurrentUser() user: { id: string },
  ) {
    return this.ordersService.getUserOrders(user.id);
  }

  @Get(':orderId')
  async getOrderDetails(
    @CurrentUser() user: { id: string },
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.getOrderDetails(user.id, orderId);
  }

  @Get(':orderId/invoice')
  async getUserInvoice(
    @CurrentUser() user: { id: string },
    @Param('orderId') orderId: string,
  ) {
    // Verify user owns the order
    const order = await this.ordersService.getOrderDetails(user.id, orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only generate invoice for completed orders
    if (order.status !== 'COMPLETED' && order.status !== 'PAID') {
      throw new NotFoundException('Invoice not available for pending orders');
    }

    return this.invoicesService.generateInvoice(orderId);
  }

  @Get(':orderId/invoice/html')
  async getUserInvoiceHTML(
    @CurrentUser() user: { id: string },
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    // Verify user owns the order
    const order = await this.ordersService.getOrderDetails(user.id, orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only generate invoice for completed orders
    if (order.status !== 'COMPLETED' && order.status !== 'PAID') {
      throw new NotFoundException('Invoice not available for pending orders');
    }

    const { html } = await this.invoicesService.generateInvoice(orderId);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get(':orderId/invoice/pdf')
  async getUserInvoicePDF(
    @CurrentUser() user: { id: string },
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    // Verify user owns the order
    const order = await this.ordersService.getOrderDetails(user.id, orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only generate invoice for completed orders
    if (order.status !== 'COMPLETED' && order.status !== 'PAID') {
      throw new NotFoundException('Invoice not available for pending orders');
    }

    const { invoice } = await this.invoicesService.generateInvoice(orderId);
    
    // Generate PDF using PDFKit
    const pdf = await this.invoicesService.generatePDF(orderId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(pdf);
  }
}
