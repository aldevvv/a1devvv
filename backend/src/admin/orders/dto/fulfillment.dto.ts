import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum FulfillmentSubject {
  ORDER_DELIVERED = 'Order Delivered - Your Purchase is Ready',
  PRODUCT_ACCESS = 'Product Access Information',
  DIGITAL_DELIVERY = 'Digital Product Delivery',
  LICENSE_ACTIVATION = 'License Key & Activation Instructions',
  ACCOUNT_CREDENTIALS = 'Account Access Details',
  DOWNLOAD_READY = 'Download Ready - Your Files',
  CUSTOM = 'custom'
}

export enum FulfillmentContentType {
  KEYS = 'keys',
  SOURCE_CODE = 'source_code', 
  ACCESS_LINK = 'access_link',
  DIGITAL_ACCOUNT = 'digital_account',
  CUSTOM = 'custom'
}

export class ProductDeliveryDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keys?: string[];

  @IsOptional()
  @IsString()
  sourceFileUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accessLinks?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  digitalAccounts?: string[];

  @IsOptional()
  @IsString()
  customContent?: string;
}

export class SendFulfillmentEmailDto {
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value.trim())
  senderName: string;

  @IsEmail()
  @Matches(/@a1dev\.id$/, {
    message: 'Email must be from @a1dev.id domain'
  })
  senderEmail: string;

  @IsEnum(FulfillmentSubject)
  subjectType: FulfillmentSubject;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  customSubject?: string;

  @IsEnum(FulfillmentContentType)
  contentType: FulfillmentContentType;

  @IsOptional()
  @IsString()
  customMessage?: string;

  @ValidateNested()
  @Type(() => ProductDeliveryDto)
  productDelivery: ProductDeliveryDto;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(['PENDING', 'PAID', 'DELIVERED', 'FAILED', 'CANCELLED', 'REFUNDED'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
