import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  HttpException,
  HttpStatus,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import { DownloadService } from './download.service';

@Controller('api/download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  /**
   * Handle file download with token validation
   * GET /api/download/:token?data=encrypted_data
   */
  @Get(':token')
  async downloadFile(
    @Param('token') token: string,
    @Query('data') encryptedData: string,
    @Res() res: Response,
  ) {
    try {
      // Validate and get file
      const fileData = await this.downloadService.validateAndGetFile(
        token,
        encryptedData,
      );

      // Set headers for file download
      res.set({
        'Content-Type': fileData.mimetype,
        'Content-Disposition': `attachment; filename="${fileData.filename}"`,
        'Content-Length': fileData.size.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });

      // Stream file to response
      fileData.stream.pipe(res);
    } catch (error) {
      console.error('Download error:', error);
      
      // Send appropriate error response
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to download file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get download link info without downloading
   * GET /api/download/info/:token?data=encrypted_data
   */
  @Get('info/:token')
  async getDownloadInfo(
    @Param('token') token: string,
    @Query('data') encryptedData: string,
  ) {
    try {
      const info = await this.downloadService.getDownloadInfo(
        token,
        encryptedData,
      );

      return {
        success: true,
        ...info,
      };
    } catch (error) {
      console.error('Get download info error:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to get download info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verify if download link is valid
   * GET /api/download/verify/:token
   */
  @Get('verify/:token')
  async verifyDownloadLink(
    @Param('token') token: string,
    @Query('data') encryptedData: string,
  ) {
    try {
      const isValid = await this.downloadService.verifyDownloadLink(
        token,
        encryptedData,
      );

      return {
        valid: isValid,
        message: isValid ? 'Download link is valid' : 'Download link is invalid or expired',
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Download link is invalid',
      };
    }
  }
}
