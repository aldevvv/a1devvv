import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AccessTokenGuard } from '../auth/guards/access.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('wishlist')
@UseGuards(AccessTokenGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  // Get user's wishlist
  @Get()
  async getUserWishlist(@CurrentUser() user: any) {
    return this.wishlistService.getUserWishlist(user.id);
  }

  // Add product to wishlist
  @Post('add')
  @HttpCode(HttpStatus.OK)
  async addToWishlist(
    @Body('productId') productId: string,
    @CurrentUser() user: any,
  ) {
    return this.wishlistService.addToWishlist(user.id, productId);
  }

  // Remove product from wishlist
  @Delete('remove/:productId')
  @HttpCode(HttpStatus.OK)
  async removeFromWishlist(
    @Param('productId') productId: string,
    @CurrentUser() user: any,
  ) {
    return this.wishlistService.removeFromWishlist(user.id, productId);
  }

  // Toggle wishlist (add if not exists, remove if exists)
  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  async toggleWishlist(
    @Body('productId') productId: string,
    @CurrentUser() user: any,
  ) {
    return this.wishlistService.toggleWishlist(user.id, productId);
  }

  // Check if product is in wishlist
  @Get('check/:productId')
  async checkWishlist(
    @Param('productId') productId: string,
    @CurrentUser() user: any,
  ) {
    const isWishlisted = await this.wishlistService.isProductWishlisted(
      user.id,
      productId,
    );
    return { isWishlisted };
  }

  // Get wishlist count
  @Get('count')
  async getWishlistCount(@CurrentUser() user: any) {
    const count = await this.wishlistService.getWishlistCount(user.id);
    return { count };
  }
}
