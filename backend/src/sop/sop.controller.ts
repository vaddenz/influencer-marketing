import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { UserPayload } from '@/common/decorators/current-user.decorator'
import { Role } from '@/common/enums/role.enum'
import { SopService } from './sop.service'
import { GenerateSopDto } from './dto/generate-sop.dto'
import { UpdateSopDto } from './dto/update-sop.dto'

@ApiTags('SOPs')
@ApiBearerAuth()
@Controller('sops')
export class SopController {
  private readonly logger = new Logger(SopController.name)

  constructor(private readonly sopService: SopService) {}

  @Post()
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@CurrentUser() user: UserPayload, @Body() dto: GenerateSopDto) {
    return this.sopService.create(user.id, dto)
  }

  @Get('campaign/:campaignId')
  @UseGuards(JwtAuthGuard)
  async findByCampaign(
    @CurrentUser() user: UserPayload,
    @Param('campaignId') campaignId: string
  ) {
    return this.sopService.findByCampaign(user, campaignId)
  }

  @Patch(':id')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSopDto
  ) {
    return this.sopService.update(user.id, id, dto)
  }

  @Post(':id/regenerate')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async regenerate(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: GenerateSopDto
  ) {
    return this.sopService.regenerate(user.id, id, dto)
  }

  @Post(':id/activate')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async activate(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.sopService.activate(user.id, id)
  }

  @Post(':id/push')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async push(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.sopService.push(user.id, id)
  }
}
