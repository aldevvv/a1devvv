import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InvoicesService } from '../admin/invoices/invoices.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, InvoicesService],
  exports: [OrdersService],
})
export class OrdersModule {}
