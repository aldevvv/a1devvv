import { IsOptional, IsString, MinLength, IsEmail, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() username?: string;
  @MinLength(8) password: string;
  @IsOptional() @IsBoolean() rememberMe?: boolean;
}
