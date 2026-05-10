import { registerAs } from '@nestjs/config'
import { SECOND } from '@/common/const/unit'

export default registerAs('http-client', () => ({
  timeoutInSec:
    parseInt(process.env.HTTP_CLIENT_TIMEOUT_IN_SEC ?? '5', 5) * SECOND,

  maxRetries: parseInt(process.env.HTTP_CLIENT_MAX_RETRIES ?? '2'),
}))
