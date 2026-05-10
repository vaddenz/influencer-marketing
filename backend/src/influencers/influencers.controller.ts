import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Param,
  Query,
  Logger,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { UserPayload } from '@/common/decorators/current-user.decorator'
import { Role } from '@/common/enums/role.enum'
import { InfluencersService } from './influencers.service'
import { CreateInfluencerProfileDto } from './dto/create-influencer-profile.dto'
import { UpdateInfluencerProfileDto } from './dto/update-influencer-profile.dto'
import { SearchInfluencersDto } from './dto/search-influencers.dto'

@ApiTags('Influencers')
@ApiBearerAuth()
@Controller('influencers')
export class InfluencersController {
  private readonly logger = new Logger(InfluencersController.name)

  constructor(private readonly influencersService: InfluencersService) {}

  @Post('me/profile')
  @Roles(Role.Influencer)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create influencer profile for current user' })
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  async createProfile(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateInfluencerProfileDto
  ) {
    return this.influencersService.createProfile(user.id, dto)
  }

  @Get('me/profile')
  @Roles(Role.Influencer)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get current influencer profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(@CurrentUser() user: UserPayload) {
    return this.influencersService.getMyProfile(user.id)
  }

  @Patch('me/profile')
  @Roles(Role.Influencer)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update current influencer profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateProfile(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateInfluencerProfileDto
  ) {
    return this.influencersService.updateProfile(user.id, dto)
  }

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get public influencer profile by user ID' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getPublicProfile(@Param('id') id: string) {
    return this.influencersService.getPublicProfile(id)
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Discover influencers with filters' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async search(@Query() dto: SearchInfluencersDto) {
    return this.influencersService.search(dto)
  }
}
