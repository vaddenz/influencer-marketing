import { Controller, Post, Body, Headers, Logger, UnauthorizedException, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { FeishuService } from './feishu.service'
import { FeishuCommandService } from './feishu-command.service'
import type { FeishuWebhookBody, FeishuSender } from './dto/feishu-webhook.dto'

interface RequestWithRawBody extends Request {
  rawBody?: Buffer
}

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
    @Req() req: RequestWithRawBody,
    @Headers('x-lark-signature') signature: string,
    @Headers('x-lark-timestamp') timestamp: string,
    @Headers('x-lark-request-timeout') _timeout: string
  ) {
    const eventType = body.header?.event_type || body.event?.type || body.type
    const eventId = body.header?.event_id
    const message = body.event?.message
    const contentPreview = message?.content
      ? JSON.parse(message.content).text?.slice(0, 80).replace(/\n/g, ' ') || ''
      : ''
    this.logger.log(
      `Received Feishu webhook. event_id=${eventId}, eventType=${eventType}, messageType=${message?.message_type}, sender_open_id=${message?.sender?.sender_id?.open_id}, contentPreview="${contentPreview}"`
    )

    if (body.challenge) {
      this.logger.log(`Challenge detected, returning challenge=${body.challenge}`)
      return { challenge: body.challenge }
    }

    // SKIP for now 
    // const rawBody = req.rawBody
    // if (!rawBody || !this.feishuService.verifySignature(rawBody, signature, timestamp)) {
    //   this.logger.warn('Invalid Feishu webhook signature')
    //   throw new UnauthorizedException()
    // }
    // this.logger.log('Feishu webhook signature verified')

    if (eventType === 'im.message.receive_v1' && message) {
      this.logger.log(`Handling im.message.receive_v1 event. event_id=${eventId}, chat_id=${message.chat_id}, message_type=${message.message_type}`)
      if (message.message_type === 'text' && message.content) {
        const content = JSON.parse(message.content)
        const text = content.text?.trim() || ''
        const sender: FeishuSender | undefined = message.sender
        this.logger.log(
          `Parsed text command. chat_id=${message.chat_id}, text=${text}, sender_type=${sender?.sender_type}, tenant_key=${sender?.tenant_key}`
        )
        await this.commandService.handleCommand(message.chat_id || '', text, sender)
      } else {
        this.logger.log(`Non-text message received, skipping. message_type=${message.message_type}`)
      }
    }

    this.logger.log('Returning Feishu webhook response: { code: 0 }')
    return { code: 0 }
  }
}
