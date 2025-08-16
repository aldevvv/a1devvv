import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AccessTokenGuard } from '../../auth/guards/access.guard';
import { CurrentUser } from '../../auth/decorators/user.decorator';
import { ProductStatus, FulfillmentMode } from '@prisma/client';

@Controller('admin/products')
@UseGuards(AccessTokenGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('category') categoryId?: string,
    @Query('status') status?: ProductStatus,
    @Query('fulfillment') fulfillment?: FulfillmentMode,
    @Query('search') search?: string,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.productsService.findAll(categoryId, status, fulfillment, search);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.productsService.findOne(id);
  }

  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.productsService.remove(id);
  }
}