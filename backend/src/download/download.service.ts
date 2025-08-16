import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionUtil } from '../utils/encryption.util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

interface DownloadData {
  filePath: string;
  userId: string;
  productId: string;
  orderId: string;
  expiresAt: number;
}

interface FileData {
  stream: Readable;
  filename: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);
  private readonly downloadTracking = new Map<string, number>();
  private readonly maxDownloadsPerLink = 5; // Maximum downloads per link

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate download token and get file for download
   */
  async validateAndGetFile(
    token: string,
    encryptedData: string,
  ): Promise<FileData> {
    try {
      // Validate token format
      if (!this.isValidToken(token)) {
        throw new HttpException(
          'Invalid download token',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Decrypt and parse download data
      const downloadData = this.decryptDownloadData(encryptedData);

      // Validate expiry
      if (Date.now() > downloadData.expiresAt) {
        throw new HttpException(
          'Download link has expired',
          HttpStatus.GONE,
        );
      }

      // Validate user has access to this order
      const hasAccess = await this.validateUserAccess(
        downloadData.userId,
        downloadData.orderId,
        downloadData.productId,
      );

      if (!hasAccess) {
        throw new HttpException(
          'Access denied to this download',
          HttpStatus.FORBIDDEN,
        );
      }

      // Check download limit
      const downloadKey = `${token}:${downloadData.orderId}`;
      const downloadCount = this.downloadTracking.get(downloadKey) || 0;
      
      if (downloadCount >= this.maxDownloadsPerLink) {
        throw new HttpException(
          'Download limit exceeded for this link',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Decrypt file path
      const filePath = EncryptionUtil.decrypt(downloadData.filePath);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        this.logger.error(`File not found: ${filePath}`);
        throw new HttpException(
          'File not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Get file stats
      const stats = await fs.stat(filePath);
      const filename = this.generateDownloadFilename(filePath, downloadData.productId);

      // Track download
      this.downloadTracking.set(downloadKey, downloadCount + 1);

      // Log download
      await this.logDownload(
        downloadData.userId,
        downloadData.productId,
        downloadData.orderId,
        token,
      );

      // Create read stream
      const stream = createReadStream(filePath);

      return {
        stream,
        filename,
        mimetype: this.getMimeType(filePath),
        size: stats.size,
      };
    } catch (error) {
      this.logger.error('Error validating download:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to process download',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get download info without actually downloading
   */
  async getDownloadInfo(
    token: string,
    encryptedData: string,
  ): Promise<{
    filename: string;
    size: number;
    expiresAt: Date;
    downloadsRemaining: number;
  }> {
    try {
      // Validate token
      if (!this.isValidToken(token)) {
        throw new HttpException(
          'Invalid download token',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Decrypt download data
      const downloadData = this.decryptDownloadData(encryptedData);

      // Check expiry
      const isExpired = Date.now() > downloadData.expiresAt;
      if (isExpired) {
        throw new HttpException(
          'Download link has expired',
          HttpStatus.GONE,
        );
      }

      // Decrypt file path
      const filePath = EncryptionUtil.decrypt(downloadData.filePath);

      // Check if file exists
      try {
        const stats = await fs.stat(filePath);
        
        // Get download count
        const downloadKey = `${token}:${downloadData.orderId}`;
        const downloadCount = this.downloadTracking.get(downloadKey) || 0;
        
        return {
          filename: this.generateDownloadFilename(filePath, downloadData.productId),
          size: stats.size,
          expiresAt: new Date(downloadData.expiresAt),
          downloadsRemaining: Math.max(0, this.maxDownloadsPerLink - downloadCount),
        };
      } catch {
        throw new HttpException(
          'File not found',
          HttpStatus.NOT_FOUND,
        );
      }
    } catch (error) {
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
   */
  async verifyDownloadLink(
    token: string,
    encryptedData: string,
  ): Promise<boolean> {
    try {
      // Validate token
      if (!this.isValidToken(token)) {
        return false;
      }

      // Try to decrypt data
      const downloadData = this.decryptDownloadData(encryptedData);

      // Check expiry
      if (Date.now() > downloadData.expiresAt) {
        return false;
      }

      // Check download limit
      const downloadKey = `${token}:${downloadData.orderId}`;
      const downloadCount = this.downloadTracking.get(downloadKey) || 0;
      
      if (downloadCount >= this.maxDownloadsPerLink) {
        return false;
      }

      // Verify file exists
      const filePath = EncryptionUtil.decrypt(downloadData.filePath);
      try {
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Validate if user has access to download this order
   */
  private async validateUserAccess(
    userId: string,
    orderId: string,
    productId: string,
  ): Promise<boolean> {
    try {
      // Check if order exists and belongs to user
      const order = await this.prisma.order.findFirst({
        where: {
          orderId: orderId,
          userId: userId,
          status: 'PAID', // Only allow downloads for paid orders
        },
      });

      if (!order) {
        return false;
      }

      // Check if product delivery exists for this order
      const delivery = await this.prisma.productDelivery.findFirst({
        where: {
          orderId: orderId,
          userId: userId,
          productId: productId,
        },
      });

      return !!delivery;
    } catch (error) {
      this.logger.error('Error validating user access:', error);
      return false;
    }
  }

  /**
   * Decrypt and validate download data
   */
  private decryptDownloadData(encryptedData: string): DownloadData {
    try {
      if (!encryptedData) {
        throw new Error('No download data provided');
      }

      const decrypted = EncryptionUtil.decrypt(decodeURIComponent(encryptedData));
      const data = JSON.parse(decrypted);

      // Validate required fields
      if (!data.filePath || !data.userId || !data.productId || !data.orderId || !data.expiresAt) {
        throw new Error('Invalid download data structure');
      }

      return data as DownloadData;
    } catch (error) {
      this.logger.error('Error decrypting download data:', error);
      throw new HttpException(
        'Invalid download data',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Validate token format
   */
  private isValidToken(token: string): boolean {
    // Token should be 32 characters hex string
    return /^[a-f0-9]{32}$/i.test(token);
  }

  /**
   * Generate user-friendly filename for download
   */
  private generateDownloadFilename(filePath: string, productId: string): string {
    const ext = path.extname(filePath);
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Get product name if possible (simplified for now)
    const productShortId = productId.substring(0, 8);
    
    return `download_${productShortId}_${timestamp}${ext}`;
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    const mimeTypes: { [key: string]: string } = {
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      '.pdf': 'application/pdf',
      '.exe': 'application/x-msdownload',
      '.dmg': 'application/x-apple-diskimage',
      '.apk': 'application/vnd.android.package-archive',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Log download activity
   */
  private async logDownload(
    userId: string,
    productId: string,
    orderId: string,
    token: string,
  ): Promise<void> {
    try {
      // You can create a DownloadLog table to track all downloads
      // For now, we'll just log to console
      this.logger.log({
        message: 'File downloaded',
        userId,
        productId,
        orderId,
        token: token.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
      });

      // Optional: Update download count in ProductDelivery
      // This could be useful for analytics
    } catch (error) {
      this.logger.error('Error logging download:', error);
      // Don't throw - logging failure shouldn't prevent download
    }
  }

  /**
   * Clean up expired download tracking entries (run periodically)
   */
  async cleanupExpiredTracking(): Promise<void> {
    // This could be called by a cron job
    const now = Date.now();
    const expiryTime = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, _count] of this.downloadTracking.entries()) {
      // Parse key to get timestamp (you'd need to store timestamp with tracking)
      // For now, just clear all entries periodically
      // In production, use Redis with TTL
    }
  }
}
