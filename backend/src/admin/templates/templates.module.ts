import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { AuthModule } from '../../auth/auth.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [TemplatesController],
  providers: [TemplatesService, PrismaService],
})
export class TemplatesModule {}
