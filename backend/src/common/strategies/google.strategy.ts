import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'

export interface GoogleProfile {
  provider: 'google'
  providerId: string
  email: string
  firstName: string
  lastName: string
  picture?: string
  accessToken: string
  refreshToken?: string
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name)

  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('oauth.google.clientId')
    const clientSecret = configService.get<string>('oauth.google.clientSecret')
    const advertisedHost = configService.get<string>('app.advertisedHost')

    super({
      clientID: clientID!,
      clientSecret: clientSecret!,
      callbackURL: `${advertisedHost}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    })
  }

  /**
   * Forces Google to show account selection and request refresh token
   */
  authorizationParams(): Record<string, string> {
    return {
      prompt: 'select_account consent',
      access_type: 'offline',
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<void> {
    const { name, emails, photos, id } = profile

    this.logger.debug(`Google OAuth validation for: ${emails?.[0]?.value}`)

    const user: GoogleProfile = {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value,
      accessToken,
      refreshToken,
    }

    done(null, user)
  }
}
