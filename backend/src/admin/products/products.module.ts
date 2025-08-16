import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { FileStorageService } from './file-storage.service';
import { DeliveryService } from './delivery.service';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [PrismaModule, AuthModule, CategoriesModule],
  controllers: [ProductsController],
  providers: [ProductsService, FileStorageService, DeliveryService],
  exports: [ProductsService, FileStorageService, DeliveryService],
})
export class ProductsModule {}
