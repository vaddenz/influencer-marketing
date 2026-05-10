import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * JWT Authentication Guard
 *
 * A guard that uses the 'jwt' strategy to protect routes.
 * It extends the built-in AuthGuard from @nestjs/passport.
 *
 * Usage:
 * @UseGuards(JwtAuthGuard)
 * @Controller('protected')
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
