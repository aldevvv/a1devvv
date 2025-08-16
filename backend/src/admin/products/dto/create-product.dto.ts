import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsUUID,
  IsBoolean,
  Length,
  Min,
  Max,
  Matches,
  IsDateString,
  ValidateIf,
  IsObject,
  IsArray,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductStatus, ProductType, FulfillmentMode, ProductKind, StockType } from '@prisma/client';
import { DeliveryConfig } from './inventory-types';
import slugify from 'slugify';

// Enhanced validation for delivery configuration
export class DeliveryConfigDto {
  @IsEnum(ProductKind)
  productKind: ProductKind;

  @IsEnum(StockType)
  stockType: StockType;

  // For KEYS products
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ValidateIf((o) => o.productKind === ProductKind.KEYS)
  keys?: string[];

  // For SOURCE_CODE products
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.productKind === ProductKind.SOURCE_CODE)
  sourceFile?: string;

  // For ACCESS_LINK products
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ValidateIf((o) => o.productKind === ProductKind.ACCESS_LINK)
  accessLinks?: string[];

  // For DIGITAL_ACCOUNT products
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ValidateIf((o) => o.productKind === ProductKind.DIGITAL_ACCOUNT)
  digitalAccounts?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  deliveredCount?: number;

  // Allow additional properties for flexibility
  [key: string]: any;
}

export class CreateProductDto {
  @IsString()
  @Length(1, 200)
  title: string;

  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => {
    if (value) return value;
    return slugify(obj.title, { lower: true, strict: true });
  })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens'
  })
  slug?: string;

  @IsString()
  thumbnailUrl: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  summary?: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  description?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  priceIDR: number;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus = ProductStatus.DRAFT;

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType = ProductType.DIGITAL;

  @IsEnum(FulfillmentMode)
  @IsOptional()
  fulfillment?: FulfillmentMode = FulfillmentMode.INSTANT;

  @IsEnum(ProductKind)
  productKind: ProductKind;

  @IsEnum(StockType)
  stockType: StockType;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryConfigDto)
  deliveryCfg?: DeliveryConfigDto;

  // Sale pricing fields
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ValidateIf((o) => !o.salePercent)
  salePriceIDR?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  @Type(() => Number)
  @ValidateIf((o) => !o.salePriceIDR)
  salePercent?: number;

  @IsOptional()
  @IsDateString()
  saleStartAt?: string;

  @IsOptional()
  @IsDateString()
  saleEndAt?: string;
}