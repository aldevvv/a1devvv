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
import { PromosService } from './promos.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { AccessTokenGuard } from '../../auth/guards/access.guard';
import { CurrentUser } from '../../auth/decorators/user.decorator';

@Controller('admin/promos')
@UseGuards(AccessTokenGuard)
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.promosService.findAll(search);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.promosService.findOne(id);
  }

  @Post()
  async create(
    @Body() createPromoDto: CreatePromoDto,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.promosService.create(createPromoDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePromoDto: UpdatePromoDto,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.promosService.update(id, updatePromoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user?: { id: string; role: string }
  ) {
    // TODO: Add admin role check when role-based auth is implemented
    return this.promosService.remove(id);
  }
}