import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID', 
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  BALANCE = 'BALANCE',
  XENDIT = 'XENDIT'
}

export enum FulfillmentMode {
  INSTANT = 'INSTANT',
  MANUAL = 'MANUAL'
}

export class QueryOrdersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(FulfillmentMode)
  fulfillmentMode?: FulfillmentMode;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  search?: string; // Search by orderId, user email, product title

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['createdAt', 'updatedAt', 'totalIDR'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'desc';
}
