import { Controller, Get, Param, Query, UseGuards, ForbiddenException, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AccessTokenGuard } from '../../auth/guards/access.guard';
import { CurrentUser } from '../../auth/decorators/user.decorator';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('admin/invoices')
@UseGuards(AccessTokenGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly prisma: PrismaService,
  ) {}

  private async checkAdminAccess(userId: string) {
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    
    if (userData?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get()
  async getAllInvoices(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    await this.checkAdminAccess(user.id);
    
    const limitNum = limit ? parseInt(limit) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;
    
    return this.invoicesService.getAllInvoices(limitNum, offsetNum);
  }

  @Get(':orderId')
  async getInvoiceByOrderId(
    @CurrentUser() user: { id: string },
    @Param('orderId') orderId: string,
  ) {
    await this.checkAdminAccess(user.id);
    return this.invoicesService.getInvoiceByOrderId(orderId);
  }

  @Get(':orderId/html')
  async getInvoiceHTML(
    @CurrentUser() user: { id: string },
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    await this.checkAdminAccess(user.id);
    
    const { html } = await this.invoicesService.generateInvoice(orderId);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}