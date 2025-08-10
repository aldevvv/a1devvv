import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty() fullName: string;

  @Matches(/^[a-zA-Z0-9_.]{3,20}$/)
  username: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}
