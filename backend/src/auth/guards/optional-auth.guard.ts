import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Return user if authenticated, otherwise return null
    // This allows the endpoint to work both authenticated and unauthenticated
    return user || null;
  }
}
