import { registerAs } from '@nestjs/config'
import { GB } from '@/common/const/unit'

/**
 * Application Health Check Configuration
 *
 * Registers the 'health-check' configuration namespace.
 * Contains health check settings like memory and disk utilization.
 */
export default registerAs('health-check', () => ({
  maxMemoryUtilization:
    parseInt(
      process.env.HEALTH_CHECK_MAX_MEMORY_UTILIZATION ?? '8',
      10 /* digit */
    ) * GB,

  maxDiskUsagePercent: parseFloat(
    process.env.HEALTH_CHECK_MAX_DISK_USAGE_PERCENT ?? '0.95'
  ),
}))
