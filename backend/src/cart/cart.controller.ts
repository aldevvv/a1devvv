import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AccessTokenGuard } from '../auth/guards/access.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('cart')
@UseGuards(AccessTokenGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Get all cart items for the authenticated user
  @Get()
  async getCart(@CurrentUser() user: any) {
    return this.cartService.getCartItems(user.id);
  }

  // Add item to cart
  @Post('add')
  async addToCart(
    @CurrentUser() user: any,
    @Body() body: { productId: string; quantity?: number },
  ) {
    const { productId, quantity = 1 } = body;
    return this.cartService.addToCart(user.id, productId, quantity);
  }

  // Update cart item quantity
  @Put(':itemId/quantity')
  async updateQuantity(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
    @Body() body: { quantity: number },
  ) {
    const { quantity } = body;
    return this.cartService.updateQuantity(user.id, itemId, quantity);
  }

  // Remove item from cart
  @Delete(':itemId')
  async removeFromCart(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeFromCart(user.id, itemId);
  }

  // Clear all cart items
  @Delete()
  async clearCart(@CurrentUser() user: any) {
    return this.cartService.clearCart(user.id);
  }

  // Get cart items count
  @Get('count')
  async getCartCount(@CurrentUser() user: any) {
    return this.cartService.getCartCount(user.id);
  }

  // Check if product is in cart
  @Get('check/:productId')
  async checkInCart(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    return this.cartService.isInCart(user.id, productId);
  }
}
