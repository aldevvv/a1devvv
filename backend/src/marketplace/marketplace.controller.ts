import {
  Controller,
  Get,
  Query,
  Param,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { ProductStatus } from '@prisma/client';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';

@Controller('')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // Public endpoint for getting published products (with optional auth for wishlist)
  @Get('products')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getPublishedProducts(
    @Query('category') categoryId?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.marketplaceService.getPublishedProducts({
      categoryId,
      search,
      sort,
      minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
    }, userId);
  }

  // Public endpoint for getting single product by slug (with optional auth for wishlist)
  @Get('products/:slug')
  @UseGuards(OptionalAuthGuard)
  async getProductBySlug(
    @Param('slug') slug: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.marketplaceService.getProductBySlug(slug, userId);
  }

  // Public endpoint for getting categories
  @Get('categories')
  async getPublicCategories() {
    return this.marketplaceService.getPublicCategories();
  }
}
