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
import { InvitationsService } from './invitations.service'
import { CreateInvitationDto } from './dto/create-invitation.dto'

@ApiTags('Invitations')
@ApiBearerAuth()
@Controller('api/v1/invitations')
export class InvitationsController {
  private readonly logger = new Logger(InvitationsController.name)

  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Send an invitation to an influencer' })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @ApiResponse({ status: 403, description: 'Not campaign owner' })
  async create(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(user.id, dto)
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List invitations for current user' })
  @ApiResponse({ status: 200, description: 'Invitations retrieved successfully' })
  async findAll(@CurrentUser() user: UserPayload) {
    return this.invitationsService.findAll(user)
  }

  @Patch(':id/accept')
  @Roles(Role.Influencer)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Accept an invitation' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 403, description: 'Cannot accept this invitation' })
  @ApiResponse({ status: 400, description: 'Invitation is not pending' })
  async accept(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return this.invitationsService.accept(user.id, id)
  }

  @Patch(':id/decline')
  @Roles(Role.Influencer)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Decline an invitation' })
  @ApiResponse({ status: 200, description: 'Invitation declined successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 403, description: 'Cannot decline this invitation' })
  @ApiResponse({ status: 400, description: 'Invitation is not pending' })
  async decline(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return this.invitationsService.decline(user.id, id)
  }

  @Patch(':id/withdraw')
  @Roles(Role.Brand)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Withdraw a pending invitation' })
  @ApiResponse({ status: 200, description: 'Invitation withdrawn successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 403, description: 'Cannot withdraw this invitation' })
  @ApiResponse({ status: 400, description: 'Invitation is not pending' })
  async withdraw(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    return this.invitationsService.withdraw(user.id, id)
  }
}
