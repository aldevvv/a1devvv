import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = config.get('GOOGLE_CLIENT_ID');
    const clientSecret = config.get('GOOGLE_CLIENT_SECRET');
    
    if (!clientID || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
    }
    
    super({
      clientID,
      clientSecret,
      callbackURL: '/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;
      const email = emails[0].value;
      const fullName = `${name.givenName} ${name.familyName}`.trim();
      
      // Extract profile picture URL with better fallbacks
      let profileImage: string | undefined = undefined;
      if (photos && photos.length > 0 && photos[0].value) {
        profileImage = photos[0].value;
      } else if (profile._json?.picture) {
        profileImage = profile._json.picture;
      }
      
      // OAuth profile processing completed
      
      const user = await this.authService.findOrCreateOAuthUser({
        provider: 'google',
        providerId: id,
        email,
        fullName,
        profileImage,
      });
      
      done(null, user);
    } catch (error) {
      console.error('Google OAuth validation error:', error);
      done(error, false);
    }
  }
}