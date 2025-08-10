import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../token.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private tokens: TokenService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.['access_token'];
    if (!token) throw new UnauthorizedException('Missing access token');

    try {
      const payload = await this.tokens.verifyAccess(token);
      req.user = { id: payload.sub as string };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid/expired access token');
    }
  }
}
