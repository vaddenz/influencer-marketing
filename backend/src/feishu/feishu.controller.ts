import { Controller, Post, Body, Headers, Logger, UnauthorizedException } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { FeishuService } from './feishu.service'
import { FeishuCommandService } from './feishu-command.service'
import { FeishuWebhookBody } from './dto/feishu-webhook.dto'

@ApiTags('Feishu')
@Controller('webhooks/feishu')
export class FeishuController {
  private readonly logger = new Logger(FeishuController.name)

  constructor(
    private readonly feishuService: FeishuService,
    private readonly commandService: FeishuCommandService
  ) {}

  @Post()
  async handleWebhook(
    @Body() body: FeishuWebhookBody,
    @Headers('x-lark-signature') signature: string,
    @Headers('x-lark-timestamp') timestamp: string,
    @Headers('x-lark-request-timeout') _timeout: string
  ) {
    const rawBody = JSON.stringify(body)
    if (!this.feishuService.verifySignature(rawBody, signature, timestamp)) {
      this.logger.warn('Invalid Feishu webhook signature')
      throw new UnauthorizedException()
    }

    if (body.challenge) {
      return { challenge: body.challenge }
    }

    if (body.event?.type === 'im.message.receive_v1' && body.event.message) {
      const message = body.event.message
      if (message.message_type === 'text' && message.content) {
        const content = JSON.parse(message.content)
        const text = content.text?.trim() || ''
        await this.commandService.handleCommand(message.chat_id || '', text)
      }
    }

    return { code: 0 }
  }
}
