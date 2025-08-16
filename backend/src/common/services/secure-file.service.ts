import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class SecureFileService {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  private readonly allowedExtensions = [
    '.jpg',
    '.jpeg', 
    '.png',
    '.webp',
    '.pdf'
  ];

  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly minFileSize = 1024; // 1KB

  // File signature magic numbers for validation
  private readonly fileSignatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/jpg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
    'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  };

  async validateFile(file: Express.Multer.File): Promise<boolean> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided or file is empty');
    }

    // Validate file size
    this.validateFileSize(file);

    // Validate MIME type
    this.validateMimeType(file);

    // Validate file extension
    this.validateFileExtension(file);

    // Validate file signature (magic numbers)
    this.validateFileSignature(file);

    // Additional security checks
    this.performAdditionalSecurityChecks(file);

    return true;
  }

  private validateFileSize(file: Express.Multer.File): void {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`
      );
    }

    if (file.size < this.minFileSize) {
      throw new BadRequestException(
        `File size is too small. Minimum size is ${this.minFileSize} bytes`
      );
    }
  }

  private validateMimeType(file: Express.Multer.File): void {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      );
    }
  }

  private validateFileExtension(file: Express.Multer.File): void {
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (!fileExt) {
      throw new BadRequestException('File must have a valid extension');
    }

    if (!this.allowedExtensions.includes(fileExt)) {
      throw new BadRequestException(
        `Invalid file extension: ${fileExt}. Allowed extensions: ${this.allowedExtensions.join(', ')}`
      );
    }

    // Ensure MIME type matches extension
    this.validateMimeTypeExtensionMatch(file.mimetype, fileExt);
  }

  private validateMimeTypeExtensionMatch(mimeType: string, extension: string): void {
    const mimeExtensionMap = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/jpg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    };

    const allowedExtensionsForMime = mimeExtensionMap[mimeType];
    
    if (!allowedExtensionsForMime || !allowedExtensionsForMime.includes(extension)) {
      throw new BadRequestException(
        `File extension ${extension} does not match MIME type ${mimeType}`
      );
    }
  }

  private validateFileSignature(file: Express.Multer.File): void {
    const expectedSignature = this.fileSignatures[file.mimetype];
    
    if (!expectedSignature) {
      throw new BadRequestException(`No signature validation available for ${file.mimetype}`);
    }

    const fileSignature = Array.from(file.buffer.slice(0, expectedSignature.length));
    
    // Special handling for WebP files (check for WEBP after RIFF)
    if (file.mimetype === 'image/webp') {
      const webpSignature = Array.from(file.buffer.slice(8, 12)); // WEBP at bytes 8-11
      const expectedWebpSignature = [0x57, 0x45, 0x42, 0x50]; // WEBP
      
      if (!this.arraysEqual(fileSignature, expectedSignature) || 
          !this.arraysEqual(webpSignature, expectedWebpSignature)) {
        throw new BadRequestException('File signature does not match WebP format');
      }
    } else {
      // Standard signature validation
      if (!this.arraysEqual(fileSignature, expectedSignature)) {
        throw new BadRequestException(
          `File signature does not match expected format for ${file.mimetype}`
        );
      }
    }
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  private performAdditionalSecurityChecks(file: Express.Multer.File): void {
    // Check for suspicious filenames
    this.validateFilename(file.originalname);

    // Check for embedded scripts or malicious content
    this.scanForMaliciousContent(file);
  }

  private validateFilename(filename: string): void {
    // Remove path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Filename contains invalid characters');
    }

    // Check for suspicious file patterns
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.com$/i,
      /\.pif$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(filename))) {
      throw new BadRequestException('Filename contains suspicious patterns');
    }

    // Validate filename length
    if (filename.length > 255) {
      throw new BadRequestException('Filename too long');
    }

    if (filename.length < 5) {
      throw new BadRequestException('Filename too short');
    }
  }

  private scanForMaliciousContent(file: Express.Multer.File): void {
    const buffer = file.buffer;
    const bufferStr = buffer.toString('utf8');

    // Check for script tags or suspicious content
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
    ];

    if (maliciousPatterns.some(pattern => pattern.test(bufferStr))) {
      throw new BadRequestException('File contains potentially malicious content');
    }

    // Check for PHP code injection
    if (bufferStr.includes('<?php') || bufferStr.includes('<?=')) {
      throw new BadRequestException('File contains PHP code');
    }
  }

  generateSecureFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename).toLowerCase();
    const timestamp = Date.now();
    const randomId = uuid().substring(0, 8);
    
    return `${timestamp}_${randomId}${ext}`;
  }

  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace non-alphanumeric chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  }
}
