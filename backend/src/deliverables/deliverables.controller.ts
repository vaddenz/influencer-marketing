import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
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
import { DeliverablesService } from './deliverables.service'

@ApiTags('Deliverables')
@ApiBearerAuth()
@Controller('deliverables')
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List deliverables for a campaign' })
  @ApiResponse({ status: 200, description: 'Deliverables retrieved successfully' })
  @ApiResponse({ status: 400, description: 'campaignId is required' })
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query('campaignId') campaignId: string,
  ) {
    return this.deliverablesService.findAll(user, campaignId)
  }

  @Patch(':id/complete')
  @Roles(Role.Influencer)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Mark a deliverable as completed' })
  @ApiResponse({ status: 200, description: 'Deliverable completed successfully' })
  @ApiResponse({ status: 404, description: 'Deliverable not found' })
  @ApiResponse({ status: 403, description: 'Cannot complete this deliverable' })
  async complete(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return this.deliverablesService.complete(user.id, id)
  }

  @Patch(':id/reopen')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Reopen a completed deliverable' })
  @ApiResponse({ status: 200, description: 'Deliverable reopened successfully' })
  @ApiResponse({ status: 404, description: 'Deliverable not found' })
  @ApiResponse({ status: 403, description: 'Cannot reopen this deliverable' })
  async reopen(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return this.deliverablesService.reopen(user.id, id)
  }
}
