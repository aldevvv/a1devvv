import { Body, Controller, Get, Ip, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshDto } from './dtos/refresh.dto';
import { ForgotDto } from './dtos/forgot.dto';
import { ResetDto } from './dtos/reset.dto';
import { TokenService } from './token.service';
import { AccessTokenGuard } from './guards/access.guard';
import { CurrentUser } from './decorators/user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private tokens: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.fullName, dto.username, dto.email, dto.password);
  }

  @Get('verify')
  verify(@Query('token') token: string) {
    return this.auth.verifyEmail(token);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const id = dto.email ? { email: dto.email } : { username: dto.username! };
    const rememberMe = dto.rememberMe || false;
    
    const { accessToken, refreshToken, user } = await this.auth.login(id, dto.password, rememberMe, req.headers['user-agent'], req.ip);
    
    // Set cookies with appropriate expiration based on rememberMe
    res.cookie('access_token', accessToken, this.tokens.cookieOptionsAccess());
    res.cookie('refresh_token', refreshToken, this.tokens.cookieOptionsRefresh(rememberMe));
    
    return { user: { id: user.id, fullName: user.fullName, email: user.email, username: user.username } };
  }

  @Post('refresh')
  async refresh(@Body() _dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rt = req.cookies?.['refresh_token'];
    
    // Get session info to preserve rememberMe setting
    let rememberMe = false;
    if (rt) {
      try {
        const decoded = await this.tokens.verifyRefresh(rt);
        const session = await this.prisma.session.findFirst({
          where: { 
            refreshHash: require('crypto').createHash('sha256').update(rt).digest('hex'),
            revokedAt: null, 
            expiresAt: { gt: new Date() } 
          },
          select: { rememberMe: true }
        });
        rememberMe = session?.rememberMe || false;
      } catch {
        // If token verification fails, it will be handled by auth.refresh()
      }
    }
    
    const { accessToken, refreshToken } = await this.auth.refresh(rt, req.headers['user-agent'], req.ip);
    res.cookie('access_token', accessToken, this.tokens.cookieOptionsAccess());
    res.cookie('refresh_token', refreshToken, this.tokens.cookieOptionsRefresh(rememberMe));
    return { ok: true };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rt = req.cookies?.['refresh_token'];
    await this.auth.logout(rt);
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return { ok: true };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  @Post('forgot-password')
  forgot(@Body() dto: ForgotDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  reset(@Body() dto: ResetDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  async me(@CurrentUser() user: { id: string }) {
    const u = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        emailVerifiedAt: true,
        role: true,
        profileImage: true,
        googleId: true,
        githubId: true
      }
    });
    return { user: u };
  }

  // OAuth Routes
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    // OAuth flows default to rememberMe: false for security
    const { accessToken, refreshToken } = await this.auth.createTokensForUser(
      user.id,
      false, // rememberMe defaults to false for OAuth
      req.headers['user-agent'],
      req.ip,
    );
    
    res.cookie('access_token', accessToken, this.tokens.cookieOptionsAccess());
    res.cookie('refresh_token', refreshToken, this.tokens.cookieOptionsRefresh(false));
    
    // Redirect to frontend dashboard with OAuth success indicator
    res.redirect(`${process.env.FRONTEND_ORIGIN}/dashboard?oauth=google`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Initiates GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    // OAuth flows default to rememberMe: false for security
    const { accessToken, refreshToken } = await this.auth.createTokensForUser(
      user.id,
      false, // rememberMe defaults to false for OAuth
      req.headers['user-agent'],
      req.ip,
    );
    
    res.cookie('access_token', accessToken, this.tokens.cookieOptionsAccess());
    res.cookie('refresh_token', refreshToken, this.tokens.cookieOptionsRefresh(false));
    
    // Redirect to frontend dashboard with OAuth success indicator
    res.redirect(`${process.env.FRONTEND_ORIGIN}/dashboard?oauth=github`);
  }
}
