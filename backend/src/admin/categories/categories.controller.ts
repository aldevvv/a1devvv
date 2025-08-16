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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AccessTokenGuard } from '../../auth/guards/access.guard';
import { CurrentUser } from '../../auth/decorators/user.decorator';

@Controller('admin/categories')
@UseGuards(AccessTokenGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.categoriesService.findAll(search);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.categoriesService.findOne(id);
  }

  @Post()
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.categoriesService.create(createCategoryDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.categoriesService.remove(id);
  }
}