import { IsString, IsOptional, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import slugify from 'slugify';

export class CreateCategoryDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => {
    if (value) return value;
    return slugify(obj.name, { lower: true, strict: true });
  })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens'
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  icon?: string;
}