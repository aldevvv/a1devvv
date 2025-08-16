import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';
import * as crypto from 'crypto';

@Injectable()
export class UsernameGeneratorService {
  constructor(private prisma: PrismaService) {}

  async generateUniqueUsername(displayName: string, email: string): Promise<string> {
    // Try display name first
    let baseUsername = this.sanitizeUsername(displayName);
    
    // If display name is empty or too short, use email prefix
    if (!baseUsername || baseUsername.length < 3) {
      const emailPrefix = email.split('@')[0];
      baseUsername = this.sanitizeUsername(emailPrefix);
    }
    
    // Ensure minimum length
    if (baseUsername.length < 3) {
      baseUsername = 'user';
    }
    
    // Try the base username first
    if (await this.isUsernameAvailable(baseUsername)) {
      return baseUsername;
    }
    
    // Try with random suffixes - increased attempts for better uniqueness
    for (let i = 0; i < 50; i++) {
      const suffix = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      const candidate = `${baseUsername}${suffix}`;
      
      if (await this.isUsernameAvailable(candidate)) {
        return candidate;
      }
    }
    
    // Ultimate fallback: use crypto random + timestamp for 100% uniqueness
    const cryptoRandom = crypto.randomBytes(4).toString('hex');
    const timestamp = Date.now().toString().slice(-8);
    const fallbackUsername = `${baseUsername}_${cryptoRandom}${timestamp}`;
    
    // Final safety check - this should never fail
    if (await this.isUsernameAvailable(fallbackUsername)) {
      return fallbackUsername;
    }
    
    // Extremely rare case: add more entropy
    const extraEntropy = crypto.randomBytes(8).toString('hex');
    return `user_${extraEntropy}_${timestamp}`;
  }
  
  private sanitizeUsername(input: string): string {
    return slugify(input, {
      lower: true,
      strict: true,
      replacement: '',
    }).replace(/[^a-z0-9]/g, '').slice(0, 20);
  }
  
  private async isUsernameAvailable(username: string): Promise<boolean> {
    const existing = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    return !existing;
  }
}