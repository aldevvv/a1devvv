import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TemplatesService } from '../admin/templates/templates.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly templatesService: TemplatesService,
  ) {}

  async updateProfileImage(userId: string, imageUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profileImage: imageUrl },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        profileImage: true,
        emailVerifiedAt: true,
        googleId: true,
        githubId: true,
      },
    });
  }

  async changeEmail(userId: string, newEmail: string, currentPassword?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        passwordHash: true,
        googleId: true,
        githubId: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if email is already in use
    const existingUser = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    // For OAuth users, we skip password verification
    const isOAuthUser = user.googleId || user.githubId;

    // For regular users, verify current password
    if (!isOAuthUser) {
      if (!user.passwordHash) {
        throw new BadRequestException('Password is required');
      }

      if (!currentPassword) {
        throw new BadRequestException('Current password is required');
      }

      const isPasswordValid = await argon2.verify(user.passwordHash, currentPassword);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store the new email temporarily
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        newEmail: newEmail,
        emailChangeToken: verificationToken,
        emailChangeTokenExpiry: verificationTokenExpiry,
      },
    });

    // Send verification email to new email address
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email-change?token=${verificationToken}`;
    
    const emailTemplate = this.templatesService.generateEmailTemplate('verification', {
      fullName: user.fullName || user.email,
      url: verifyUrl,
    });

    await this.emailService.send(newEmail, emailTemplate.subject, emailTemplate.html);

    return { message: 'Email change verification sent to your new email address' };
  }

  async verifyEmailChange(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailChangeToken: token,
        emailChangeTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user || !user.newEmail) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Update the email and clear temporary fields
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.newEmail,
        newEmail: null,
        emailChangeToken: null,
        emailChangeTokenExpiry: null,
        emailVerifiedAt: new Date(),
      },
    });

    return { message: 'Email changed successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
        googleId: true,
        githubId: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('No password set for this account');
    }

    // Verify current password
    const isPasswordValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword, { type: argon2.argon2id });

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async createPassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
        googleId: true,
        githubId: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.passwordHash) {
      throw new BadRequestException('Password already exists for this account');
    }

    // Must be an OAuth user to create password
    const isOAuthUser = user.googleId || user.githubId;
    if (!isOAuthUser) {
      throw new BadRequestException('This operation is only available for OAuth users');
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword, { type: argon2.argon2id });

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Password created successfully' };
  }

  async updateProfile(userId: string, data: { fullName?: string; username?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // If username is being changed, check if it's available
    if (data.username && data.username !== user.username) {
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(data.username)) {
        throw new BadRequestException(
          'Username must be 3-20 characters long and contain only letters, numbers, underscores, or hyphens'
        );
      }

      // Check if username is already taken
      const existingUser = await this.prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUser) {
        throw new BadRequestException('Username is already taken');
      }
    }

    // Validate full name if provided
    if (data.fullName !== undefined) {
      if (data.fullName.trim().length < 1) {
        throw new BadRequestException('Full name cannot be empty');
      }
      if (data.fullName.trim().length > 100) {
        throw new BadRequestException('Full name cannot exceed 100 characters');
      }
    }

    // Update user
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName.trim() }),
        ...(data.username && { username: data.username }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        profileImage: true,
        emailVerifiedAt: true,
        googleId: true,
        githubId: true,
        createdAt: true,
      },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        profileImage: true,
        emailVerifiedAt: true,
        googleId: true,
        githubId: true,
        createdAt: true,
      },
    });
  }
}