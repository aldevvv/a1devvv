import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TokenType } from '@prisma/client';
import * as argon2 from 'argon2';
import crypto from 'crypto';
import { TokenService } from './token.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsernameGeneratorService } from './username-generator.service';
import { TemplatesService } from '../admin/templates/templates.service';

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const genRandomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

// Security constants
const MAX_SESSIONS_PER_USER = 5;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private tokens: TokenService,
    private mail: EmailService,
    private usernameGenerator: UsernameGeneratorService,
    private templates: TemplatesService,
  ) {}

  async register(fullName: string, username: string, email: string, password: string) {
    email = email.toLowerCase();
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (exists) throw new BadRequestException('Email or username already used');

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const user = await this.prisma.user.create({
      data: { fullName, username, email, passwordHash },
    });

    // Create balance account
    await this.prisma.balanceAccount.create({
      data: { userId: user.id },
    });

    // verify token
    const raw = genRandomToken();
    const tokenHash = sha256(raw);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30m

    await this.prisma.emailToken.create({
      data: { userId: user.id, type: TokenType.VERIFY, tokenHash, expiresAt },
    });

    const verifyUrl = `${process.env.API_URL}/auth/verify?token=${raw}`;
    const emailTemplate = this.templates.generateEmailTemplate('verification', {
      fullName: user.fullName,
      url: verifyUrl,
    });
    
    await this.mail.send(user.email, emailTemplate.subject, emailTemplate.html);

    return { id: user.id, email: user.email };
  }

  async findOrCreateOAuthUser(data: {
    provider: 'google' | 'github';
    providerId: string;
    email: string;
    fullName: string;
    profileImage?: string;
  }) {
    const { provider, providerId, email, fullName, profileImage } = data;
    const normalizedEmail = email.toLowerCase();

    // OAuth user processing - sensitive data not logged for security

    // Check if user exists by provider ID
    let user = await this.prisma.user.findUnique({
      where: provider === 'google'
        ? { googleId: providerId }
        : { githubId: providerId },
    });

    if (user) {
      // Always update profile image if we have one from OAuth (to keep it fresh)
      if (profileImage) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { profileImage },
        });
      }
      return user;
    }

    // Check if user exists by email
    user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Link OAuth account to existing user and always update profile image if available
      const updateData: any = provider === 'google'
        ? { googleId: providerId }
        : { githubId: providerId };
      
      if (profileImage) {
        updateData.profileImage = profileImage;
      }
      
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
      return user;
    }

    // Create new user
    const username = await this.usernameGenerator.generateUniqueUsername(
      fullName,
      normalizedEmail,
    );

    // Creating new OAuth user

    user = await this.prisma.user.create({
      data: {
        fullName,
        username,
        email: normalizedEmail,
        emailVerifiedAt: new Date(), // OAuth emails are pre-verified
        profileImage, // Add profile image from OAuth provider
        ...(provider === 'google'
          ? { googleId: providerId }
          : { githubId: providerId }),
      },
    });

    // New OAuth user created successfully

    // Create balance account
    await this.prisma.balanceAccount.create({
      data: { userId: user.id },
    });

    return user;
  }

  async createTokensForUser(userId: string, rememberMe = false, ua?: string, ip?: string) {
    // Enforce session limit before creating new session
    await this.enforceSessionLimit(userId);

    const accessToken = await this.tokens.signAccess({ sub: userId });
    const refreshToken = await this.tokens.signRefresh({ sub: userId, ver: genRandomToken(8) }, rememberMe);

    // store refresh (hash) with dynamic expiration based on rememberMe
    const refreshHash = sha256(refreshToken);
    const expirationTime = rememberMe 
      ? 30 * 24 * 60 * 60 * 1000  // 30 days for remember me
      : 7 * 24 * 60 * 60 * 1000;  // 7 days for regular login
    const expiresAt = new Date(Date.now() + expirationTime);

    await this.prisma.session.create({
      data: {
        userId,
        refreshHash,
        userAgent: ua,
        ipHash: ip ? sha256(ip) : null,
        rememberMe,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async verifyEmail(rawToken: string) {
    const tokenHash = sha256(rawToken);
    const token = await this.prisma.emailToken.findFirst({
      where: { type: TokenType.VERIFY, tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!token) throw new BadRequestException('Invalid or expired token');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: new Date(), balanceAccount: { create: {} } },
      }),
      this.prisma.emailToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  async login(identifier: { email?: string; username?: string }, password: string, rememberMe = false, ua?: string, ip?: string) {
    const where = identifier.email
      ? { email: identifier.email.toLowerCase() }
      : { username: identifier.username! };

    const user = await this.prisma.user.findFirst({ where });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    // issue tokens with remember me support
    const accessToken = await this.tokens.signAccess({ sub: user.id });
    const refreshToken = await this.tokens.signRefresh({ sub: user.id, ver: genRandomToken(8) }, rememberMe);

    // Enforce session limit before creating new session
    await this.enforceSessionLimit(user.id);

    // store refresh (hash) with dynamic expiration based on rememberMe
    const refreshHash = sha256(refreshToken);
    const expirationTime = rememberMe 
      ? 30 * 24 * 60 * 60 * 1000  // 30 days for remember me
      : 7 * 24 * 60 * 60 * 1000;  // 7 days for regular login
    const expiresAt = new Date(Date.now() + expirationTime);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshHash,
        userAgent: ua,
        ipHash: ip ? sha256(ip) : null,
        rememberMe,
        expiresAt,
      },
    });

    return { accessToken, refreshToken, user };
  }

  async refresh(oldRefreshToken: string, ua?: string, ip?: string) {
    let decoded: any;
    try { decoded = await this.tokens.verifyRefresh(oldRefreshToken); }
    catch { throw new UnauthorizedException('Invalid refresh'); }

    const oldHash = sha256(oldRefreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshHash: oldHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!session) throw new UnauthorizedException('Session not found');

    // Preserve rememberMe setting from original session
    const rememberMe = session.rememberMe;
    
    // rotate with same rememberMe setting
    const accessToken = await this.tokens.signAccess({ sub: session.userId });
    const newRefresh = await this.tokens.signRefresh({ sub: session.userId, ver: genRandomToken(8) }, rememberMe);
    const newHash = sha256(newRefresh);
    
    // Calculate expiration based on rememberMe setting
    const expirationTime = rememberMe 
      ? 30 * 24 * 60 * 60 * 1000  // 30 days for remember me
      : 7 * 24 * 60 * 60 * 1000;  // 7 days for regular login
    const expiresAt = new Date(Date.now() + expirationTime);

    await this.prisma.$transaction([
      this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
      this.prisma.session.create({
        data: {
          userId: session.userId,
          refreshHash: newHash,
          userAgent: ua,
          ipHash: ip ? sha256(ip) : null,
          rememberMe,
          expiresAt,
        },
      }),
    ]);

    return { accessToken, refreshToken: newRefresh };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return { ok: true };
    const hash = sha256(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return { ok: true }; // jangan bocorkan

    const raw = genRandomToken();
    const tokenHash = sha256(raw);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.emailToken.create({
      data: { userId: user.id, type: TokenType.RESET, tokenHash, expiresAt },
    });

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${raw}`;
    const emailTemplate = this.templates.generateEmailTemplate('reset-password', {
      fullName: user.fullName,
      url: resetUrl,
    });
    
    await this.mail.send(user.email, emailTemplate.subject, emailTemplate.html);
    return { ok: true };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = sha256(rawToken);
    const token = await this.prisma.emailToken.findFirst({
      where: { type: TokenType.RESET, tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!token) throw new BadRequestException('Invalid or expired token');

    const hash = await argon2.hash(newPassword, { type: argon2.argon2id });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash: hash } });
      await tx.emailToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
      // revoke all sessions
      await tx.session.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return { ok: true };
  }

  /**
   * Enforce session limit per user and revoke oldest sessions if needed
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const existingSessions = await this.prisma.session.findMany({
      where: { 
        userId, 
        revokedAt: null, 
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true }
    });

    if (existingSessions.length >= MAX_SESSIONS_PER_USER) {
      // Calculate how many sessions to revoke
      const sessionsToRevoke = existingSessions.length - MAX_SESSIONS_PER_USER + 1;
      const sessionIdsToRevoke = existingSessions
        .slice(0, sessionsToRevoke)
        .map(session => session.id);

      // Revoke oldest sessions
      await this.prisma.session.updateMany({
        where: {
          id: { in: sessionIdsToRevoke }
        },
        data: { revokedAt: new Date() }
      });
    }
  }

  /**
   * Clean up expired sessions and email tokens
   */
  async cleanupExpiredData(): Promise<{ sessionsDeleted: number; tokensDeleted: number }> {
    const now = new Date();

    // Clean up expired sessions (including revoked ones older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const expiredSessions = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } }, // Expired sessions
          { 
            revokedAt: { 
              lt: sevenDaysAgo,
              not: null 
            } 
          } // Revoked sessions older than 7 days
        ]
      }
    });

    // Clean up expired and used email tokens
    const expiredTokens = await this.prisma.emailToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } }, // Expired tokens
          { usedAt: { not: null } }   // Used tokens
        ]
      }
    });

    return {
      sessionsDeleted: expiredSessions.count,
      tokensDeleted: expiredTokens.count
    };
  }

  /**
   * Get session statistics for monitoring
   */
  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    expiredSessions: number;
    revokedSessions: number;
    sessionsPerUser: { userId: string; count: number }[];
  }> {
    const now = new Date();

    const [activeSessions, expiredSessions, revokedSessions, sessionsPerUser] = await Promise.all([
      this.prisma.session.count({
        where: { revokedAt: null, expiresAt: { gt: now } }
      }),
      this.prisma.session.count({
        where: { expiresAt: { lt: now } }
      }),
      this.prisma.session.count({
        where: { revokedAt: { not: null } }
      }),
this.prisma.$queryRaw`
        SELECT "userId", COUNT(*) as count
        FROM "Session"
        WHERE "revokedAt" IS NULL AND "expiresAt" > ${now}
        GROUP BY "userId"
        ORDER BY COUNT(*) DESC
        LIMIT 10
      `
    ]);

    return {
      totalActiveSessions: activeSessions,
      expiredSessions,
      revokedSessions,
      sessionsPerUser: (sessionsPerUser as any[]).map((item: any) => ({
        userId: item.userId,
        count: parseInt(item.count)
      }))
    };
  }
}
