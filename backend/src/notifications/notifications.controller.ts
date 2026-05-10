import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import type { UserPayload } from '@/common/decorators/current-user.decorator'
import { NotificationsService } from './notifications.service'

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List notifications for current user' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
  })
  async findAll(@CurrentUser() user: UserPayload) {
    return this.notificationsService.findAll(user.id)
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({
    status: 403,
    description: 'Cannot mark this notification as read',
  })
  async markRead(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.notificationsService.markRead(user.id, id)
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllRead(@CurrentUser() user: UserPayload) {
    return this.notificationsService.markAllRead(user.id)
  }
}
