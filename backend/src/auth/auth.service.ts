import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TokenType } from '@prisma/client';
import * as argon2 from 'argon2';
import crypto from 'crypto';
import { TokenService } from './token.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsernameGeneratorService } from './username-generator.service';

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const genRandomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private tokens: TokenService,
    private mail: EmailService,
    private usernameGenerator: UsernameGeneratorService,
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
    await this.mail.send(user.email, 'Verify your email', `
      <p>Hi ${user.fullName},</p>
      <p>Please verify your email by clicking the link below (valid 30 minutes):</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    `);

    return { id: user.id, email: user.email };
  }

  async findOrCreateOAuthUser(data: {
    provider: 'google' | 'github';
    providerId: string;
    email: string;
    fullName: string;
  }) {
    const { provider, providerId, email, fullName } = data;
    const normalizedEmail = email.toLowerCase();

    // Check if user exists by provider ID
    let user = await this.prisma.user.findUnique({
      where: provider === 'google' 
        ? { googleId: providerId }
        : { githubId: providerId },
    });

    if (user) {
      return user;
    }

    // Check if user exists by email
    user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Link OAuth account to existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: provider === 'google' 
          ? { googleId: providerId }
          : { githubId: providerId },
      });
      return user;
    }

    // Create new user
    const username = await this.usernameGenerator.generateUniqueUsername(
      fullName,
      normalizedEmail,
    );

    user = await this.prisma.user.create({
      data: {
        fullName,
        username,
        email: normalizedEmail,
        emailVerifiedAt: new Date(), // OAuth emails are pre-verified
        ...(provider === 'google' 
          ? { googleId: providerId }
          : { githubId: providerId }),
      },
    });

    // Create balance account
    await this.prisma.balanceAccount.create({
      data: { userId: user.id },
    });

    return user;
  }

  async createTokensForUser(userId: string, ua?: string, ip?: string) {
    const accessToken = await this.tokens.signAccess({ sub: userId });
    const refreshToken = await this.tokens.signRefresh({ sub: userId, ver: genRandomToken(8) });

    // store refresh (hash)
    const refreshHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        refreshHash,
        userAgent: ua,
        ipHash: ip ? sha256(ip) : null,
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

  async login(identifier: { email?: string; username?: string }, password: string, ua?: string, ip?: string) {
    const where = identifier.email
      ? { email: identifier.email.toLowerCase() }
      : { username: identifier.username! };

    const user = await this.prisma.user.findFirst({ where });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    // issue tokens
    const accessToken = await this.tokens.signAccess({ sub: user.id });
    const refreshToken = await this.tokens.signRefresh({ sub: user.id, ver: genRandomToken(8) });

    // store refresh (hash)
    const refreshHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshHash,
        userAgent: ua,
        ipHash: ip ? sha256(ip) : null,
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

    // rotate
    const accessToken = await this.tokens.signAccess({ sub: session.userId });
    const newRefresh = await this.tokens.signRefresh({ sub: session.userId, ver: genRandomToken(8) });
    const newHash = sha256(newRefresh);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
      this.prisma.session.create({
        data: {
          userId: session.userId,
          refreshHash: newHash,
          userAgent: ua,
          ipHash: ip ? sha256(ip) : null,
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
    await this.mail.send(user.email, 'Reset your password', `
      <p>Hi ${user.fullName},</p>
      <p>Click the link below to reset your password (valid 30 minutes):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
    `);
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
}
