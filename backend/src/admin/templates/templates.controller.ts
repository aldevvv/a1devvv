import { Controller, Get, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access.guard';
import { CurrentUser } from '../../auth/decorators/user.decorator';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('admin/templates')
@UseGuards(AccessTokenGuard)
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('email')
  async getEmailTemplates(
    @CurrentUser() user: { id: string },
  ) {
    // Check if user is admin
    const userData = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    
    if (userData?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    
    return this.templatesService.getEmailTemplates();
  }

  @Get('email/preview')
  async previewEmailTemplate(
    @CurrentUser() user: { id: string },
    @Query('type') type: 'verification' | 'reset-password' | 'email-change-verification',
    @Query('data') data?: string,
  ) {
    // Check if user is admin
    const userData = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    
    if (userData?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    
    const templateData = data ? JSON.parse(data) : undefined;
    return this.templatesService.generateEmailTemplate(type, templateData);
  }
}
