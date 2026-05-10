import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-github2'

export interface GitHubProfile {
  provider: 'github'
  providerId: string
  email: string
  username: string
  displayName?: string
  picture?: string
  accessToken: string
}

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GitHubStrategy.name)

  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('oauth.github.clientId')
    const clientSecret = configService.get<string>('oauth.github.clientSecret')
    const advertisedHost = configService.get<string>('app.advertisedHost')

    super({
      clientID: clientID!,
      clientSecret: clientSecret!,
      callbackURL: `${advertisedHost}/api/v1/auth/github/callback`,
      scope: ['user:email', 'read:user'],
    })
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void
  ): Promise<void> {
    const { id, username, emails, displayName, photos } = profile

    const email = emails?.[0]?.value || `${username}@users.noreply.github.com`

    this.logger.debug(`GitHub OAuth validation for: ${email}`)

    const user: GitHubProfile = {
      provider: 'github',
      providerId: id,
      email,
      username,
      displayName: displayName || username,
      picture: photos?.[0]?.value,
      accessToken,
    }

    done(null, user)
  }
}
