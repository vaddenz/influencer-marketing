import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '@/common/auth/auth.service'
import { OAuthService } from '@/common/auth/oauth.service'
import { JwtStrategy } from '@/common/strategies/jwt.strategy'
import { GoogleStrategy } from '@/common/strategies/google.strategy'
import { GitHubStrategy } from '@/common/strategies/github.strategy'

/**
 * AuthModule
 *
 * This module handles authentication-related functionality, including:
 * - JWT (JSON Web Token) configuration and registration
 * - OAuth authentication (Google, GitHub)
 * - Passport strategy configuration
 * - Authentication service and strategy provision
 *
 * It exports AuthService, JwtModule, and PassportModule for use in other parts of the application.
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    OAuthService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
  ],
  exports: [AuthService, OAuthService, JwtModule, PassportModule],
})
export class AuthModule {}
