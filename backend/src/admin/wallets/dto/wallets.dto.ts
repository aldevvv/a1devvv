import { IsNumber, IsString, IsOptional, Min, Max, IsEnum, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class ManualTopUpDto {
  @IsNumber()
  @Min(5000, { message: 'Minimum top-up amount is IDR 5,000' })
  @Max(100000000, { message: 'Maximum top-up amount is IDR 100,000,000' })
  @Transform(({ value }) => {
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error('Amount must be a valid number');
    }
    return num;
  })
  amount: number;

  @IsString()
  @Length(3, 500, { message: 'Description must be between 3 and 500 characters' })
  @Matches(/^[a-zA-Z0-9\s.,!?\-_()]+$/, {
    message: 'Description contains invalid characters'
  })
  description: string;

  @IsOptional()
  @IsString()
  @Length(0, 200, { message: 'Reference must be less than 200 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message: 'Reference can only contain alphanumeric characters, spaces, hyphens and underscores'
  })
  reference?: string;
}

export class AdjustBalanceDto {
  @IsNumber()
  @Min(-50000000, { message: 'Adjustment amount cannot be less than IDR -50,000,000' })
  @Max(50000000, { message: 'Adjustment amount cannot exceed IDR 50,000,000' })
  @Transform(({ value }) => {
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error('Amount must be a valid number');
    }
    if (num === 0) {
      throw new Error('Adjustment amount cannot be zero');
    }
    return num;
  })
  amount: number; // Can be positive or negative

  @IsString()
  @Length(5, 500, { message: 'Reason must be between 5 and 500 characters' })
  @Matches(/^[a-zA-Z0-9\s.,!?\-_()]+$/, {
    message: 'Reason contains invalid characters'
  })
  reason: string;

  @IsOptional()
  @IsString()
  @Length(0, 200, { message: 'Reference must be less than 200 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message: 'Reference can only contain alphanumeric characters, spaces, hyphens and underscores'
  })
  reference?: string;
}

export class ProcessTopUpProofDto {
  @IsOptional()
  @IsString()
  @Length(0, 1000, { message: 'Notes must be less than 1000 characters' })
  @Matches(/^[a-zA-Z0-9\s.,!?\-_()\n\r]*$/, {
    message: 'Notes contain invalid characters'
  })
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(5000, { message: 'Minimum approved amount is IDR 5,000' })
  @Max(100000000, { message: 'Maximum approved amount is IDR 100,000,000' })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error('Approved amount must be a valid number');
    }
    return num;
  })
  approvedAmount?: number; // For partial approvals
}

export enum TopUpStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
}
