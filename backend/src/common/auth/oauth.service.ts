import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'
import { GoogleProfile } from '@/common/strategies/google.strategy'
import { GitHubProfile } from '@/common/strategies/github.strategy'

export type OAuthProfile = GoogleProfile | GitHubProfile

export interface OAuthUserResult {
  id: string
  email: string
  name: string | null
  avatar: string | null
  provider: string
  isNewUser: boolean
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates OAuth profile and returns user.
   * Creates new user if doesn't exist, or links OAuth account to existing user.
   */
  async validateOAuthUser(profile: OAuthProfile): Promise<OAuthUserResult> {
    const { provider, providerId, email } = profile

    this.logger.log(`Validating ${provider} OAuth user: ${email}`)

    // 1. Check if OAuth account already exists
    const existingAccount = await this.prisma.userOAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: { user: true },
    })

    if (existingAccount) {
      this.logger.debug(`Found existing OAuth account for: ${email}`)

      // Update tokens
      await this.prisma.userOAuthAccount.update({
        where: { id: existingAccount.id },
        data: {
          accessToken: profile.accessToken,
          ...(profile.provider === 'google' &&
            'refreshToken' in profile && {
              refreshToken: profile.refreshToken,
            }),
        },
      })

      return {
        id: existingAccount.user.id,
        email: existingAccount.user.email,
        name: existingAccount.user.name,
        avatar: existingAccount.user.avatar,
        provider,
        isNewUser: false,
      }
    }

    // 2. Check if user exists with same email
    let user = await this.prisma.user.findUnique({
      where: { email },
    })

    let isNewUser = false

    if (!user) {
      // 3. Create new user
      this.logger.log(`Creating new user from ${provider} OAuth: ${email}`)

      const name =
        profile.provider === 'google'
          ? `${profile.firstName} ${profile.lastName}`.trim()
          : profile.displayName || profile.username

      user = await this.prisma.user.create({
        data: {
          email,
          name,
          avatar: profile.picture,
          // No password for OAuth users
        },
      })
      isNewUser = true
    } else {
      this.logger.log(`Linking ${provider} OAuth to existing user: ${email}`)
    }

    // 4. Create OAuth account link
    await this.prisma.userOAuthAccount.create({
      data: {
        userId: user.id,
        provider,
        providerId,
        email,
        name: user.name,
        avatar: profile.picture,
        accessToken: profile.accessToken,
        ...(profile.provider === 'google' &&
          'refreshToken' in profile && {
            refreshToken: profile.refreshToken,
          }),
      },
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider,
      isNewUser,
    }
  }

  /**
   * Get all OAuth providers linked to a user
   */
  async getUserLinkedProviders(userId: string): Promise<string[]> {
    const accounts = await this.prisma.userOAuthAccount.findMany({
      where: { userId },
      select: { provider: true },
    })
    return accounts.map((a) => a.provider)
  }

  /**
   * Unlink OAuth provider from user
   */
  async unlinkProvider(userId: string, provider: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Check if user has password or other OAuth accounts
    const hasPassword = !!user.passwordHash
    const otherAccounts = user.oauthAccounts.filter(
      (a) => a.provider !== provider
    )

    if (!hasPassword && otherAccounts.length === 0) {
      throw new Error('Cannot unlink last authentication method')
    }

    await this.prisma.userOAuthAccount.deleteMany({
      where: { userId, provider },
    })

    this.logger.log(`Unlinked ${provider} from user: ${userId}`)
  }
}
