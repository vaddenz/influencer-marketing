import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Param,
  Logger,
} from '@nestjs/common'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { UserPayload } from '@/common/decorators/current-user.decorator'
import { Role } from '@/common/enums/role.enum'
import { BrandsService } from './brands.service'
import { CreateBrandProfileDto } from './dto/create-brand-profile.dto'
import { UpdateBrandProfileDto } from './dto/update-brand-profile.dto'

@Controller('api/v1/brands')
export class BrandsController {
  private readonly logger = new Logger(BrandsController.name)

  constructor(private readonly brandsService: BrandsService) {}

  @Post('me/profile')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createProfile(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateBrandProfileDto
  ) {
    return this.brandsService.createProfile(user.id, dto)
  }

  @Get('me/profile')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getMyProfile(@CurrentUser() user: UserPayload) {
    return this.brandsService.getMyProfile(user.id)
  }

  @Patch('me/profile')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateProfile(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateBrandProfileDto
  ) {
    return this.brandsService.updateProfile(user.id, dto)
  }

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard)
  async getPublicProfile(@Param('id') id: string) {
    return this.brandsService.getPublicProfile(id)
  }
}
