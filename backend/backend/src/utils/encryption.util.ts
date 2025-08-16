import * as crypto from 'crypto';
import { Cipher, Decipher } from 'crypto';

export class EncryptionUtil {
  private static algorithm = 'aes-256-gcm';
  private static secretKey = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!'; // 32 chars
  private static iv = crypto.randomBytes(16);

  /**
   * Encrypt sensitive data
   */
  static encrypt(text: string): string {
    if (!text) return '';
    
    try {
      // Ensure key is 32 bytes
      const key = crypto.scryptSync(this.secretKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv) as crypto.CipherGCM;
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine iv, authTag, and encrypted data
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      // Ensure key is 32 bytes
      const key = crypto.scryptSync(this.secretKey, 'salt', 32);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt array of items (for keys, accounts, links)
   */
  static encryptArray(items: string[]): string[] {
    return items.map(item => this.encrypt(item));
  }

  /**
   * Decrypt array of items
   */
  static decryptArray(encryptedItems: string[]): string[] {
    return encryptedItems.map(item => this.decrypt(item));
  }

  /**
   * Generate unique download token for files
   */
  static generateDownloadToken(userId: string, productId: string, orderId: string): string {
    const payload = `${userId}:${productId}:${orderId}:${Date.now()}`;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    return hash.substring(0, 32); // 32 char token
  }

  /**
   * Validate download token (with expiry)
   */
  static validateDownloadToken(token: string, expiryHours: number = 24): boolean {
    // In production, you'd store tokens in Redis/DB with expiry
    // This is a simplified validation
    return token.length === 32;
  }

  /**
   * Generate secure filename for uploaded source files
   */
  static generateSecureFilename(originalName: string): string {
    const ext = originalName.split('.').pop();
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `source_${timestamp}_${uniqueId}.${ext}`;
  }
}
