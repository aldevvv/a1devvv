import { Module, Global } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './services/audit.service';
import { SecureFileService } from './services/secure-file.service';

@Global()
@Module({
  providers: [AuditService, SecureFileService, PrismaService],
  exports: [AuditService, SecureFileService],
})
export class CommonModule {}
