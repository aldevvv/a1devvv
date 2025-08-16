import { IsString, IsArray, ValidateNested, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  qty: number;
}

export class ApplyPromoDto {
  @IsString()
  code: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}