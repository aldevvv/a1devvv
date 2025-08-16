import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenGuard } from '../../auth/guards/access.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { OrdersService } from './orders.service';
import {
  QueryOrdersDto,
  OrderStatus,
  FulfillmentMode,
} from './dto/query-orders.dto';
import {
  SendFulfillmentEmailDto,
  UpdateOrderStatusDto,
  FulfillmentSubject,
  FulfillmentContentType,
} from './dto/fulfillment.dto';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('admin/orders')
@UseGuards(AccessTokenGuard, AdminGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getAllOrders(
    @Query() query: QueryOrdersDto,
    @Req() req: AuthRequest,
  ) {
    try {
      return await this.ordersService.getAllOrders(query, req.user.id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('manual-requests')
  async getManualRequests(
    @Query() query: QueryOrdersDto,
    @Req() req: AuthRequest,
  ) {
    try {
      return await this.ordersService.getManualRequests(query, req.user.id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('stats')
  async getOrdersStats(@Req() req: AuthRequest) {
    try {
      return await this.ordersService.getOrdersStats(req.user.id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':orderId')
  async getOrderById(
    @Param('orderId') orderId: string,
    @Req() req: AuthRequest,
  ) {
    try {
      return await this.ordersService.getOrderById(orderId, req.user.id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() updateData: UpdateOrderStatusDto,
    @Req() req: AuthRequest,
  ) {
    try {
      return await this.ordersService.updateOrderStatus(
        orderId,
        updateData,
        req.user.id,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':orderId/fulfillment/send')
  async sendFulfillmentEmail(
    @Param('orderId') orderId: string,
    @Body() emailData: SendFulfillmentEmailDto,
    @Req() req: AuthRequest,
  ) {
    try {
      return await this.ordersService.sendFulfillmentEmail(
        orderId,
        emailData,
        req.user.id,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':orderId/fulfillment/preview')
  async previewFulfillmentEmail(
    @Param('orderId') orderId: string,
    @Body() emailData: SendFulfillmentEmailDto,
    @Req() req: AuthRequest,
  ) {
    try {
      return await this.ordersService.previewFulfillmentEmail(
        orderId,
        emailData,
        req.user.id,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Helper endpoints for frontend dropdowns
  @Get('enums/statuses')
  getOrderStatuses() {
    return Object.values(OrderStatus);
  }

  @Get('enums/fulfillment-modes')
  getFulfillmentModes() {
    return Object.values(FulfillmentMode);
  }

  @Get('enums/fulfillment-subjects')
  getFulfillmentSubjects() {
    return Object.values(FulfillmentSubject);
  }

  @Get('enums/fulfillment-content-types')
  getFulfillmentContentTypes() {
    return Object.values(FulfillmentContentType);
  }
}
