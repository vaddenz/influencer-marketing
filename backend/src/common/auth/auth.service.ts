import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

/**
 * Interface representing the payload structure of a JWT
 */
export interface JwtPayload {
  /** The subject (user ID) of the token */
  sub: string
  /** The email address of the user */
  email: string
  /** The role of the user */
  role: string
}

/**
 * Interface representing the response containing access and refresh tokens
 */
export interface TokenResponse {
  /** The short-lived access token for API authentication */
  accessToken: string
  /** The long-lived refresh token for obtaining new access tokens */
  refreshToken: string
}

/**
 * AuthService
 *
 * This service provides methods for handling JWT token generation and verification.
 * It is responsible for creating access and refresh tokens and verifying refresh tokens.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Generates a pair of access and refresh tokens for the given payload.
   *
   * @param payload - The payload to encode in the tokens (contains user info)
   * @returns A promise that resolves to an object containing the access and refresh tokens
   */
  async generateTokens(payload: JwtPayload): Promise<TokenResponse> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ])

    return {
      accessToken,
      refreshToken,
    }
  }

  /**
   * Verifies the validity of a refresh token.
   *
   * @param token - The refresh token string to verify
   * @returns A promise that resolves to the decoded payload if the token is valid
   * @throws Error if the token is invalid or expired
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get('jwt.refreshSecret'),
    })
  }

  /**
   * Authenticates a user and returns access and refresh tokens.
   *
   * @param user - The user object containing id, email, and name properties
   * @returns A promise that resolves to an object containing access and refresh tokens,
   *          as well as user information (id, email, name)
   */
  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role } as JwtPayload
    const tokens = await this.generateTokens(payload)
    this.logger.log(`User logged in`, { id: user.id, email: user.email, role: user.role })
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  }
}
