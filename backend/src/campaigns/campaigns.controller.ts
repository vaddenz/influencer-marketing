import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
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
import { CampaignsService } from './campaigns.service'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from './dto/update-campaign.dto'

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  private readonly logger = new Logger(CampaignsController.name)

  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  async create(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(user.id, dto)
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List campaigns for current user' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved successfully' })
  async findAll(@CurrentUser() user: UserPayload) {
    return this.campaignsService.findAll(user)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get campaign details by ID' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.findOne(user, id)
  }

  @Patch(':id')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 403, description: 'Not campaign owner' })
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(user.id, id, dto)
  }

  @Delete(':id')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 403, description: 'Not campaign owner' })
  async remove(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.remove(user.id, id)
  }
}
