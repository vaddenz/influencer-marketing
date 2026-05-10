import { OtelMeterHolder } from '@/common/otel/otel-meter.holder'

export interface TrackMetricsOptions {
  /**
   * Base name for the metrics.
   * - Duration metric will be: `${name}_duration_seconds`
   * - Count metric will be: `${name}_total`
   * Defaults to method name if not provided.
   */
  name?: string

  /**
   * Attributes to add to the metric.
   */
  attributes?: Record<string, string | number | boolean>

  /**
   * Whether to track execution duration. Defaults to true.
   */
  trackDuration?: boolean

  /**
   * Whether to track execution count. Defaults to true.
   */
  trackCount?: boolean
}

/**
 * All-in-one decorator to track method execution metrics.
 * Can track both duration and execution count with a single decorator.
 *
 * @param options Configuration options
 */
export function TrackMetrics(options?: TrackMetricsOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    // Default options
    const baseName = options?.name || propertyKey
    const shouldTrackDuration = options?.trackDuration ?? true
    const shouldTrackCount = options?.trackCount ?? true
    const defaultAttributes = options?.attributes || {}

    descriptor.value = async function (...args: any[]) {
      const meter = OtelMeterHolder.getMeter()

      // Initialize instruments lazily
      const histogram = shouldTrackDuration
        ? meter.createHistogram(`${baseName}_duration_seconds`, {
            description: `Duration of ${propertyKey}`,
            unit: 's',
          })
        : null

      const counter = shouldTrackCount
        ? meter.createCounter(`${baseName}_total`, {
            description: `Execution count of ${propertyKey}`,
          })
        : null

      const startTime = process.hrtime()

      try {
        const result = await originalMethod.apply(this, args)

        const endTime = process.hrtime(startTime)
        const durationInSeconds = endTime[0] + endTime[1] / 1e9

        const attributes = {
          method: propertyKey,
          success: 'true',
          ...defaultAttributes,
        }

        if (histogram) {
          histogram.record(durationInSeconds, attributes)
        }

        if (counter) {
          counter.add(1, attributes)
        }

        return result
      } catch (error) {
        const endTime = process.hrtime(startTime)
        const durationInSeconds = endTime[0] + endTime[1] / 1e9

        const attributes = {
          method: propertyKey,
          success: 'false',
          ...defaultAttributes,
        }

        if (histogram) {
          histogram.record(durationInSeconds, attributes)
        }

        if (counter) {
          counter.add(1, attributes)
        }

        throw error
      }
    }

    return descriptor
  }
}
