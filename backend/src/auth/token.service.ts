import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private jwt: JwtService) {}

  signAccess(payload: object) {
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '10m',
    });
  }

  signRefresh(payload: object, rememberMe = false) {
    const expiresIn = rememberMe 
      ? process.env.JWT_REFRESH_EXPIRES_REMEMBER ?? '30d'
      : process.env.JWT_REFRESH_EXPIRES ?? '7d';
    
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn,
    });
  }

  verifyAccess(token: string) {
    return this.jwt.verifyAsync(token, { secret: process.env.JWT_ACCESS_SECRET! });
  }
  verifyRefresh(token: string) {
    return this.jwt.verifyAsync(token, { secret: process.env.JWT_REFRESH_SECRET! });
  }

  cookieOptionsAccess() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 10 * 60 * 1000,
      // domain: '.a1dev.id', // uncomment saat prod (FE & BE beda subdomain)
    };
  }
  cookieOptionsRefresh(rememberMe = false) {
    const maxAge = rememberMe 
      ? 30 * 24 * 60 * 60 * 1000  // 30 days for remember me
      : 7 * 24 * 60 * 60 * 1000;  // 7 days for regular login
    
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge,
      // domain: '.a1dev.id',
    };
  }
}
