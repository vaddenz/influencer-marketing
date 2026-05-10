import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { JwtPayload } from '@/common/auth/auth.service'

/**
 * JWT Strategy
 *
 * Implements the JWT authentication strategy for Passport.
 * Validates the JWT token found in the Authorization header.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret')!,
    })
  }

  /**
   * Validates the payload extracted from the JWT.
   * This method is called after the token signature and expiration are verified.
   *
   * @param payload - The decoded JWT payload
   * @returns The user object to be attached to the request (e.g., req.user)
   */
  async validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role }
  }
}
