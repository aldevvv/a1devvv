import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WalletsService } from './wallets.service';
import { AccessTokenGuard } from '../../auth/guards/access.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { CurrentUser } from '../../auth/decorators/user.decorator';
import { ManualTopUpDto, AdjustBalanceDto, ProcessTopUpProofDto } from './dto/wallets.dto';
import { AuditService } from '../../common/services/audit.service';
import { SecureFileService } from '../../common/services/secure-file.service';
import type { Request } from 'express';

@Controller('admin/wallets')
@UseGuards(AccessTokenGuard, AdminGuard)
export class WalletsController {
  private readonly logger = new Logger(WalletsController.name);

  constructor(
    private readonly walletsService: WalletsService,
    private readonly auditService: AuditService,
    private readonly secureFileService: SecureFileService,
  ) {}

  @Get()
  async getAllWallets(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @CurrentUser() user: { id: string; role: string; fullName: string; email: string },
    @Req() request: Request
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    
    await this.auditService.logAdminAction(
      'VIEW_ALL_WALLETS',
      user.id,
      undefined,
      { page: pageNum, limit: limitNum },
      request
    );
    
    return this.walletsService.getAllWallets(pageNum, limitNum);
  }

  @Get('statistics')
  async getStatistics(
    @CurrentUser() user: { id: string; role: string; fullName: string; email: string },
    @Req() request: Request
  ) {
    await this.auditService.logAdminAction(
      'VIEW_WALLET_STATISTICS',
      user.id,
      undefined,
      {},
      request
    );
    
    return this.walletsService.getOverallStatistics();
  }

  @Get('topup-requests')
  async getTopUpRequests(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @CurrentUser() user: { id: string; role: string; fullName: string; email: string },
    @Req() request: Request,
    @Query('status') status?: string
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    
    // Validate status if provided
    const validStatuses = ['PENDING', 'SETTLED', 'FAIL', 'EXPIRED'];
    if (status && !validStatuses.includes(status.toUpperCase())) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    await this.auditService.logAdminAction(
      'VIEW_TOPUP_REQUESTS',
      user.id,
      undefined,
      { status, page: pageNum, limit: limitNum },
      request
    );
    
    return this.walletsService.getTopUpRequests(status, pageNum, limitNum);
  }

  @Get(':userId')
  async getUserWallet(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; role: string; fullName: string; email: string },
    @Req() request: Request
  ) {
    // Validate userId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    
    await this.auditService.logAdminAction(
      'VIEW_USER_WALLET',
      user.id,
      userId,
      {},
      request
    );
    
    return this.walletsService.getUserWallet(userId);
  }

  @Get(':userId/ledger')
  async getUserLedger(
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @CurrentUser() user: { id: string; role: string; fullName: string; email: string },
    @Req() request: Request
  ) {
    // Validate userId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    
    await this.auditService.logAdminAction(
      'VIEW_USER_LEDGER',
      user.id,
      userId,
      { page: pageNum, limit: limitNum },
      request
    );
    
    return this.walletsService.getUserLedger(userId, pageNum, limitNum);
  }

  @Post(':userId/manual-topup')
  async manualTopUp(
    @Param('userId') userId: string,
    @Body() dto: ManualTopUpDto,
    @CurrentUser() user: { id: string; role: string; fullName: string; email: string },
    @Req() request: Request
  ) {
    // Validate userId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    
    this.logger.warn(`Admin ${user.email} performing manual top-up for user ${userId}: IDR ${dto.amount}`);
    
    try {
      const result = await this.walletsService.manualTopUp(userId, dto, user.id);
      
      await this.auditService.logWalletOperation(
        'MANUAL_TOPUP',
        userId,
        user.id,
        dto.amount,
        {
          description: dto.description,
          reference: dto.reference,
          adminName: user.fullName
        },
        request
      );
      
      return result;
    } catch (error) {
      await this.auditService.logSecurityEvent(
        'MANUAL_TOPUP_FAILED',
        user.id,
        {
          targetUserId: userId,
          amount: dto.amount,
          error: error.message
        },
        request
      );
      throw error;
    }
  }

  @Post(':userId/adjust-balance')
  async adjustBalance(
    @Param('userId') userId: string,
    @Body() dto: AdjustBalanceDto,
    @CurrentUser() user: { id: string; role: string; fullName: string; email: string },
    @Req() request: Request
  ) {
    // Validate userId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    
    this.logger.warn(`Admin ${user.email} adjusting balance for user ${userId}: IDR ${dto.amount}`);
    
    try {
      const result = await this.walletsService.adjustBalance(userId, dto, user.id);
      
      await this.auditService.logWalletOperation(
        'BALANCE_ADJUSTMENT',
        userId,
        user.id,
        dto.amount,
        {
          reason: dto.reason,
          reference: dto.reference,
          adminName: user.fullName
        },
        request
      );
      
      return result;
    } catch (error) {
      await this.auditService.logSecurityEvent(
        'BALANCE_ADJUSTMENT_FAILED',
        user.id,
        {
          targetUserId: userId,
          amount: dto.amount,
          reason: dto.reason,
          error: error.message
        },
        request
      );
      throw error;
    }
  }

  @Post('topup-proof/:paymentId/approve')
  async approveTopUpProof(
    @Param('paymentId') paymentId: string,
    @Body() dto: ProcessTopUpProofDto,
    @CurrentUser() user: { id: string; role: string; fullName: string; email: string },
    @Req() request: Request
  ) {
    // Validate paymentId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paymentId)) {
      throw new BadRequestException('Invalid payment ID format');
    }
    
    this.logger.warn(`Admin ${user.email} approving top-up proof for payment ${paymentId}`);
    
    try {
      const result = await this.walletsService.processTopUpProof(paymentId, 'approve', dto, user.id);
      
      await this.auditService.logAdminAction(
        'TOPUP_PROOF_APPROVED',
        user.id,
        undefined,
        {
          paymentId,
          notes: dto.notes,
          approvedAmount: dto.approvedAmount,
          adminName: user.fullName
        },
        request
      );
      
      return result;
    } catch (error) {
      await this.auditService.logSecurityEvent(
        'TOPUP_APPROVAL_FAILED',
        user.id,
        {
          paymentId,
          error: error.message
        },
        request
      );
      throw error;
    }
  }

  @Post('topup-proof/:paymentId/reject')
  async rejectTopUpProof(
    @Param('paymentId') paymentId: string,
    @Body() dto: ProcessTopUpProofDto,
    @CurrentUser() user: { id: string; role: string; fullName: string; email: string },
    @Req() request: Request
  ) {
    // Validate paymentId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paymentId)) {
      throw new BadRequestException('Invalid payment ID format');
    }
    
    this.logger.warn(`Admin ${user.email} rejecting top-up proof for payment ${paymentId}`);
    
    try {
      const result = await this.walletsService.processTopUpProof(paymentId, 'reject', dto, user.id);
      
      await this.auditService.logAdminAction(
        'TOPUP_PROOF_REJECTED',
        user.id,
        undefined,
        {
          paymentId,
          notes: dto.notes,
          adminName: user.fullName
        },
        request
      );
      
      return result;
    } catch (error) {
      await this.auditService.logSecurityEvent(
        'TOPUP_REJECTION_FAILED',
        user.id,
        {
          paymentId,
          error: error.message
        },
        request
      );
      throw error;
    }
  }

  @Post('upload-proof/:paymentId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTopUpProof(
    @Param('paymentId') paymentId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string; role: string; fullName: string; email: string },
    @Req() request: Request
  ) {
    // Validate paymentId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(paymentId)) {
      throw new BadRequestException('Invalid payment ID format');
    }
    
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.logger.log(`Admin ${user.email} uploading proof for payment ${paymentId}: ${file.originalname}`);
    
    try {
      // Use secure file validation
      await this.secureFileService.validateFile(file);
      
      const result = await this.walletsService.uploadTopUpProof(paymentId, file, user.id);
      
      await this.auditService.logAdminAction(
        'TOPUP_PROOF_UPLOADED',
        user.id,
        undefined,
        {
          paymentId,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          adminName: user.fullName
        },
        request
      );
      
      return result;
    } catch (error) {
      await this.auditService.logSecurityEvent(
        'PROOF_UPLOAD_FAILED',
        user.id,
        {
          paymentId,
          fileName: file?.originalname,
          error: error.message
        },
        request
      );
      throw error;
    }
  }
}
