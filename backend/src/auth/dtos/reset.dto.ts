import { MinLength, IsString } from 'class-validator';
export class ResetDto {
  @IsString() token: string;
  @MinLength(8) password: string;
}
