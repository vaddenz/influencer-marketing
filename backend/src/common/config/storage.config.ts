import { registerAs } from '@nestjs/config'

/**
 * Storage Configuration
 *
 * Registers the 'storage' configuration namespace.
 * Contains storage settings like S3 bucket names and endpoints.
 */
export default registerAs('storage', () => ({
  port: parseInt(process.env.S3_PORT ?? '443', 10),
  useSsl: process.env.S3_USE_SSL === 'true',
  endpoint: process.env.S3_ENDPOINT || 'localhost',
  region: process.env.S3_REGION,
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY,
  defaultBucket: process.env.S3_DEFAULT_BUCKET,
  buckets: process.env.S3_BUCKETS ? JSON.parse(process.env.S3_BUCKETS) : {},
  publicUrlPrefix: process.env.S3_PUBLIC_URL_PREFIX || '',
}))
