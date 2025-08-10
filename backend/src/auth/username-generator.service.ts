import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';

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
    
    // Try with random suffixes
    for (let i = 0; i < 10; i++) {
      const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const candidate = `${baseUsername}${suffix}`;
      
      if (await this.isUsernameAvailable(candidate)) {
        return candidate;
      }
    }
    
    // Fallback: use timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `${baseUsername}${timestamp}`;
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