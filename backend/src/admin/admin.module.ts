import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { PromosModule } from './promos/promos.module';
import { WalletsModule } from './wallets/wallets.module';
import { TemplatesModule } from './templates/templates.module';
import { InvoicesModule } from './invoices/invoices.module';
import { OrdersModule } from './orders/orders.module';
import { SessionsController } from './sessions/sessions.controller';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [CategoriesModule, ProductsModule, PromosModule, WalletsModule, TemplatesModule, InvoicesModule, OrdersModule, AuthModule, AuditModule],
  controllers: [SessionsController],
  exports: [CategoriesModule, ProductsModule, PromosModule, WalletsModule, TemplatesModule, InvoicesModule, OrdersModule, AuditModule],
})
export class AdminModule {}
