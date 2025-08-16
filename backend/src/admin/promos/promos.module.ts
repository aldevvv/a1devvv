import { Module } from '@nestjs/common';
import { PromosController } from './promos.controller';
import { PromosService } from './promos.service';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, AuthModule, CategoriesModule, ProductsModule],
  controllers: [PromosController],
  providers: [PromosService],
  exports: [PromosService],
})
export class PromosModule {}