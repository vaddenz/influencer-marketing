import { registerAs } from '@nestjs/config'
import { DAY, K, MINUTE, SECOND } from '@/common/const/unit'

/**
 * BullMQ Configuration
 *
 * Registers the 'mq' configuration namespace.
 * Contains general application settings like port and environment.
 */
export default registerAs('mq', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  /** The Redis port (default: 6379) */
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  /** The username for Redis authentication (optional) */
  user: process.env.REDIS_USER,
  /** The password for Redis authentication (optional) */
  password: process.env.REDIS_PASSWORD,
  /** The Redis database index (default: 0) */
  db: parseInt(process.env.REDIS_DB ?? '0', 10),
}))

export const MQDefaultJobOption = {
  attempts: 3,
  timeout: 30 * MINUTE,
  backoff: {
    type: 'fixed',
    delay: 2 * SECOND,
  },
  removeOnComplete: {
    age: 3 * DAY,
    count: 1 * K,
  },
  removeOnFail: {
    age: 7 * DAY,
    count: 1 * K,
  },
}
