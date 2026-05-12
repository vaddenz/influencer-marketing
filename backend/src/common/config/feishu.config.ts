import { registerAs } from '@nestjs/config'

export default registerAs('feishu', () => ({
  appId: process.env.FEISHU_APP_ID || '',
  appSecret: process.env.FEISHU_APP_SECRET || '',
  webhookVerifyToken: process.env.FEISHU_WEBHOOK_VERIFY_TOKEN || '',
}))
