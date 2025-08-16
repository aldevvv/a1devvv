import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Get full user details from database to verify role
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, fullName: true, email: true },
    });

    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    if (dbUser.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Admin access required. This action is restricted to administrators only.'
      );
    }

    // Add full user info to request for audit logging
    request.user = {
      ...user,
      role: dbUser.role,
      fullName: dbUser.fullName,
      email: dbUser.email,
    };

    return true;
  }
}
