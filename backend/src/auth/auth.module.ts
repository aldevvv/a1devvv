import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { EmailService } from '../email/email.service';
import { AccessTokenGuard } from './guards/access.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsernameGeneratorService } from './username-generator.service';
import { TemplatesService } from '../admin/templates/templates.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    EmailService,
    AccessTokenGuard,
    GoogleStrategy,
    GitHubStrategy,
    JwtStrategy,
    UsernameGeneratorService,
    TemplatesService,
  ],
  exports: [AuthService, TokenService, AccessTokenGuard],
})
export class AuthModule {}
