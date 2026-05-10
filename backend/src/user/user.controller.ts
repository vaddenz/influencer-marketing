import type { Cache } from 'cache-manager'
import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
  UnauthorizedException,
  Inject,
  UseInterceptors,
} from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { UserService } from '@/user/user.service'
import { AuthService } from '@/common/auth/auth.service'
import { UserCacheInterceptor } from '@/common/interceptors/cache.interceptor'

@Controller('users')
@UseInterceptors(UserCacheInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}
}
