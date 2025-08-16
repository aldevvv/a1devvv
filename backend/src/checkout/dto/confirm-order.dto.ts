import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CartItemDto } from './apply-promo.dto';

export class ConfirmOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsOptional()
  @IsString()
  promoCode?: string;
}