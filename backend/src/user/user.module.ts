import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EmailService } from '../email/email.service';
import { TemplatesService } from '../admin/templates/templates.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, EmailService, TemplatesService],
  exports: [UserService],
})
export class UserModule {}
