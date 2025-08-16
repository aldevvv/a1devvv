import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsUUID,
  Length,
  Min,
  Max,
  Matches,
  IsDateString,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PromoKind, PromoScope } from '@prisma/client';

export class CreatePromoDto {
  @IsString()
  @Length(3, 50)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'Promo code must contain only uppercase letters, numbers, underscores, and hyphens'
  })
  @Transform(({ value }) => value?.toUpperCase())
  code: string;

  @IsEnum(PromoKind)
  kind: PromoKind;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  value: number;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minSubtotalIDR?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ValidateIf((o) => o.kind === PromoKind.PERCENT)
  maxDiscountIDR?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  usageLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  perUserLimit?: number;

  @IsEnum(PromoScope)
  appliesTo: PromoScope;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  @ValidateIf((o) => o.appliesTo === PromoScope.CATEGORY)
  @ArrayMinSize(1, { message: 'At least one category must be selected for category-scoped promos' })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  @ValidateIf((o) => o.appliesTo === PromoScope.PRODUCT)
  @ArrayMinSize(1, { message: 'At least one product must be selected for product-scoped promos' })
  productIds?: string[];
}