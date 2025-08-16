import { Injectable, BadRequestException } from '@nestjs/common';
import { EncryptionUtil } from '../../utils/encryption.util';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';

@Injectable()
export class FileStorageService {
  private readonly supabase: SupabaseClient;
  private readonly bucketName = 'source-codes';
  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB
  private readonly allowedExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz'];
  private readonly downloadLinkExpiry = 24 * 60 * 60; // 24 hours in seconds

  constructor() {
    // Initialize Supabase client with service role key
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || '', // Use service key for admin operations
      {
        auth: {
          persistSession: false,
        },
      },
    );
  }


  /**
   * Save source code file to Supabase Storage
   */
  async saveSourceFile(file: Express.Multer.File): Promise<string> {
    // Validate file
    this.validateFile(file);

    // Generate secure filename with folder structure
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const secureFilename = EncryptionUtil.generateSecureFilename(file.originalname);
    const storagePath = `${year}/${month}/${secureFilename}`;

    try {
      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype || 'application/octet-stream',
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new BadRequestException('Failed to upload file: ' + error.message);
      }

      // Return encrypted storage path (not the full URL)
      return EncryptionUtil.encrypt(data.path);
    } catch (error) {
      console.error('Error saving file:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to save source file');
    }
  }

  /**
   * Generate signed URL for secure file download
   */
  async generateDownloadLink(
    encryptedFilePath: string,
    userId: string,
    productId: string,
    orderId: string
  ): Promise<string> {
    try {
      // Decrypt storage path
      const storagePath = EncryptionUtil.decrypt(encryptedFilePath);
      
      // Generate signed URL from Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, this.downloadLinkExpiry);

      if (error) {
        console.error('Error creating signed URL:', error);
        throw new BadRequestException('Failed to generate download link');
      }

      // Store download metadata in database if needed
      // This can be used for tracking downloads, limiting attempts, etc.
      const downloadMetadata = {
        userId,
        productId,
        orderId,
        storagePath: encryptedFilePath,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.downloadLinkExpiry * 1000).toISOString(),
      };
      
      // TODO: Store downloadMetadata in database for tracking
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error generating download link:', error);
      throw new BadRequestException('Failed to generate download link');
    }
  }

  /**
   * Get file download URL (alternative method for direct backend streaming)
   * This is used when you need to proxy the download through your backend
   */
  async getFileDownloadUrl(encryptedFilePath: string): Promise<string> {
    try {
      // Decrypt storage path
      const storagePath = EncryptionUtil.decrypt(encryptedFilePath);
      
      // Generate a short-lived signed URL (5 minutes for immediate use)
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, 300); // 5 minutes

      if (error) {
        console.error('Error creating signed URL:', error);
        throw new BadRequestException('Failed to get file URL');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw new BadRequestException('Failed to get file URL');
    }
  }

  /**
   * Download file from Supabase Storage (for backend processing)
   */
  async downloadFile(encryptedFilePath: string): Promise<Buffer> {
    try {
      // Decrypt storage path
      const storagePath = EncryptionUtil.decrypt(encryptedFilePath);
      
      // Download file from Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(storagePath);

      if (error) {
        console.error('Error downloading file:', error);
        throw new BadRequestException('File not found');
      }

      // Convert blob to buffer
      const buffer = Buffer.from(await data.arrayBuffer());
      return buffer;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new BadRequestException('Failed to download file');
    }
  }

  /**
   * Delete source file from Supabase Storage
   */
  async deleteFile(encryptedFilePath: string): Promise<void> {
    try {
      // Decrypt storage path
      const storagePath = EncryptionUtil.decrypt(encryptedFilePath);
      
      // Delete from Supabase Storage
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([storagePath]);

      if (error) {
        console.error('Error deleting file from storage:', error);
        // Don't throw error, just log it
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error if file doesn't exist
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size exceeds 100MB limit');
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedExtensions.join(', ')}`
      );
    }
  }

  /**
   * Get file info from Supabase Storage
   */
  async getFileInfo(encryptedFilePath: string): Promise<{ size: number; exists: boolean; metadata?: any }> {
    try {
      // Decrypt storage path
      const storagePath = EncryptionUtil.decrypt(encryptedFilePath);
      
      // List files to get metadata
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(path.dirname(storagePath), {
          limit: 1,
          search: path.basename(storagePath),
        });

      if (error || !data || data.length === 0) {
        return {
          size: 0,
          exists: false,
        };
      }

      const file = data[0];
      return {
        size: file.metadata?.size || 0,
        exists: true,
        metadata: {
          mimetype: file.metadata?.mimetype,
          lastModified: file.updated_at,
          cacheControl: file.metadata?.cacheControl,
        },
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return {
        size: 0,
        exists: false,
      };
    }
  }

  /**
   * List all files in a specific folder
   */
  async listFiles(folderPath?: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(folderPath || '', {
          limit: 100,
          offset: 0,
        });

      if (error) {
        console.error('Error listing files:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }
}
