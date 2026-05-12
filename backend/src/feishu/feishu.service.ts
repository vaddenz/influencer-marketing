import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac } from 'crypto'

@Injectable()
export class FeishuService {
  private readonly logger = new Logger(FeishuService.name)
  private readonly appId: string
  private readonly appSecret: string
  private readonly verifyToken: string
  private tenantAccessToken: string | null = null
  private tokenExpiresAt = 0

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get('feishu.appId') || ''
    this.appSecret = this.configService.get('feishu.appSecret') || ''
    this.verifyToken = this.configService.get('feishu.webhookVerifyToken') || ''
  }

  verifySignature(body: string, signature: string, timestamp: string): boolean {
    if (!this.verifyToken) return true
    const sign = createHmac('sha256', this.verifyToken)
      .update(`${timestamp}\n${body}`)
      .digest('base64')
    return sign === signature
  }

  async sendMessage(chatId: string, content: string): Promise<void> {
    const token = await this.getTenantAccessToken()
    const url = 'https://open.feishu.cn/open-apis/im/v1/messages'
    const response = await fetch(`${url}?receive_id_type=chat_id`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receive_id: chatId,
        msg_type: 'text',
        content: JSON.stringify({ text: content }),
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      this.logger.error(`Feishu API error: ${response.status} ${err}`)
      throw new Error(`Feishu API error: ${response.status}`)
    }
  }

  private async getTenantAccessToken(): Promise<string> {
    const now = Date.now()
    if (this.tenantAccessToken && this.tokenExpiresAt > now + 60000) {
      return this.tenantAccessToken
    }

    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: this.appId, app_secret: this.appSecret }),
    })

    const data = await response.json()
    if (data.code !== 0) {
      throw new Error(`Feishu auth error: ${data.msg}`)
    }

    this.tenantAccessToken = data.tenant_access_token
    this.tokenExpiresAt = now + data.expire * 1000
    return this.tenantAccessToken!
  }
}
