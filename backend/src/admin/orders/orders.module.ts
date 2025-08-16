import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../../auth/auth.module';
import { EmailModule } from '../../email/email.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AuthModule,
    EmailModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
