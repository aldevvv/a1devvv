import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = config.get('GITHUB_CLIENT_ID');
    const clientSecret = config.get('GITHUB_CLIENT_SECRET');
    
    if (!clientID || !clientSecret) {
      throw new Error('GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required');
    }
    
    super({
      clientID,
      clientSecret,
      callbackURL: '/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    try {
      const { id, displayName, emails, photos } = profile;
      const email = emails?.[0]?.value;
      
      if (!email) {
        throw new Error('No email found in GitHub profile');
      }
      
      const fullName = displayName || profile.username || 'GitHub User';
      
      // Extract profile picture URL with better fallbacks
      let profileImage: string | undefined = undefined;
      if (photos && photos.length > 0 && photos[0].value) {
        profileImage = photos[0].value;
      } else if (profile._json?.avatar_url) {
        profileImage = profile._json.avatar_url;
      }
      
      // OAuth profile processing completed
      
      const user = await this.authService.findOrCreateOAuthUser({
        provider: 'github',
        providerId: id,
        email,
        fullName,
        profileImage,
      });
      
      done(null, user);
    } catch (error) {
      console.error('GitHub OAuth validation error:', error);
      done(error, false);
    }
  }
}