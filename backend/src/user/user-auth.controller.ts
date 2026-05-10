import * as bcrypt from 'bcrypt'
import type { Cache } from 'cache-manager'
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
  Inject,
  UseInterceptors,
  Patch,
  Logger,
  Res,
  Query,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Throttle, SkipThrottle } from '@nestjs/throttler'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import type { Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '@/common/auth/auth.service'
import { OAuthService } from '@/common/auth/oauth.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { UserCacheInterceptor } from '@/common/interceptors/cache.interceptor'
import { CacheGroup } from '@/common/decorators/cache-group.decorator'
import { THROTTLERS } from '@/common/guards/custom-throttler.guard'
import { InvalidateCache } from '@/common/decorators/invalidate-cache.decorator'
import { UserService } from '@/user/user.service'
import { CreateUserDto } from '@/user/dto/create-user.dto'
import { LoginUserDto } from '@/user/dto/login-user.dto'
import { UpdateUserDto } from '@/user/dto/update-user.dto'
import type { GoogleProfile } from '@/common/strategies/google.strategy'
import type { GitHubProfile } from '@/common/strategies/github.strategy'

@Controller('auth')
@UseInterceptors(UserCacheInterceptor)
export class UserAuthController {
  private readonly logger = new Logger(UserAuthController.name)

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Post('register')
  @Throttle(THROTTLERS.strict)
  async register(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  @Post('login')
  @Throttle(THROTTLERS.strict)
  async login(@Body() loginUserDto: LoginUserDto) {
    const user = await this.userService.validateUser(
      loginUserDto.email,
      loginUserDto.password
    )
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }
    return this.authService.login(user)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @CacheGroup('user-profile')
  async getProfile(@Request() req: any) {
    // req.user is populated by JwtStrategy
    const userId = req.user.id
    return await this.userService.getUserProfile(userId)
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @InvalidateCache({ group: 'user-profile' })
  async updateProfile(
    @Request() req: any,
    @Body() updateUserDto: UpdateUserDto
  ) {
    const userId = req.user.id
    return this.userService.update(userId, updateUserDto)
  }

  // ==================== OAuth Routes ====================

  /**
   * Google OAuth - Initiates login flow
   */
  @Get('google')
  @SkipThrottle()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  /**
   * Google OAuth - Callback handler
   */
  @Get('google/callback')
  @SkipThrottle()
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Request() req: { user: GoogleProfile },
    @Res() res: Response,
    @Query('redirect') redirect?: string
  ) {
    try {
      const user = await this.oauthService.validateOAuthUser(req.user)
      const tokens = await this.authService.login(user)

      this.logger.log(
        `Google OAuth ${user.isNewUser ? 'signup' : 'login'}: ${user.email}`
      )

      // Redirect to frontend with tokens
      const frontendUrl = redirect || this.configService.get('advertisedHost')
      const redirectUrl = new URL('/auth/callback', frontendUrl)
      redirectUrl.searchParams.set('access_token', tokens.accessToken)
      redirectUrl.searchParams.set('refresh_token', tokens.refreshToken)
      redirectUrl.searchParams.set('provider', 'google')

      return res.redirect(redirectUrl.toString())
    } catch (error) {
      this.logger.error('Google OAuth callback error:', error)
      const frontendUrl = this.configService.get('advertisedHost')
      return res.redirect(`${frontendUrl}/auth/error?provider=google`)
    }
  }

  /**
   * GitHub OAuth - Initiates login flow
   */
  @Get('github')
  @SkipThrottle()
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Guard redirects to GitHub
  }

  /**
   * GitHub OAuth - Callback handler
   */
  @Get('github/callback')
  @SkipThrottle()
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(
    @Request() req: { user: GitHubProfile },
    @Res() res: Response,
    @Query('redirect') redirect?: string
  ) {
    try {
      const user = await this.oauthService.validateOAuthUser(req.user)
      const tokens = await this.authService.login(user)

      this.logger.log(
        `GitHub OAuth ${user.isNewUser ? 'signup' : 'login'}: ${user.email}`
      )

      // Redirect to frontend with tokens
      const frontendUrl = redirect || this.configService.get('advertisedHost')
      const redirectUrl = new URL('/auth/callback', frontendUrl)
      redirectUrl.searchParams.set('access_token', tokens.accessToken)
      redirectUrl.searchParams.set('refresh_token', tokens.refreshToken)
      redirectUrl.searchParams.set('provider', 'github')

      return res.redirect(redirectUrl.toString())
    } catch (error) {
      this.logger.error('GitHub OAuth callback error:', error)
      const frontendUrl = this.configService.get('advertisedHost')
      return res.redirect(`${frontendUrl}/auth/error?provider=github`)
    }
  }

  /**
   * Get linked OAuth providers for current user
   */
  @Get('linked-providers')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  async getLinkedProviders(@Request() req: any) {
    const userId = req.user.id
    const providers = await this.oauthService.getUserLinkedProviders(userId)
    return { providers }
  }
}
