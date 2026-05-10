import type { MetricOptions } from '@opentelemetry/api'
import { OtelMeterHolder } from '@/common/otel/otel-meter.holder'

export interface TrackDurationOptions extends MetricOptions {
  /**
   * Name of the metric. Defaults to method name if not provided.
   */
  name?: string
  /**
   * Attributes to add to the metric.
   */
  attributes?: Record<string, string | number | boolean>
}

/**
 * Decorator to track the execution duration of a method.
 * Records the duration in seconds using a Histogram.
 *
 * @param nameOrOptions Metric name or options object
 */
export function TrackDuration(
  nameOrOptions?: string | TrackDurationOptions,
  options?: MetricOptions
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    let metricName: string
    let metricOptions: MetricOptions | undefined
    let defaultAttributes: Record<string, string | number | boolean> = {}

    if (typeof nameOrOptions === 'string') {
      metricName = nameOrOptions
      metricOptions = options
    } else {
      metricName = nameOrOptions?.name || propertyKey
      defaultAttributes = nameOrOptions?.attributes || {}
      metricOptions = nameOrOptions
    }

    // Default options
    metricOptions = {
      description: `Duration of ${propertyKey}`,
      unit: 's',
      ...metricOptions,
    }

    descriptor.value = async function (...args: any[]) {
      const meter = OtelMeterHolder.getMeter()
      const histogram = meter.createHistogram(metricName, metricOptions)

      const startTime = process.hrtime()

      try {
        const result = await originalMethod.apply(this, args)

        const endTime = process.hrtime(startTime)
        const durationInSeconds = endTime[0] + endTime[1] / 1e9

        histogram.record(durationInSeconds, {
          method: propertyKey,
          success: 'true',
          ...defaultAttributes,
        })

        return result
      } catch (error) {
        const endTime = process.hrtime(startTime)
        const durationInSeconds = endTime[0] + endTime[1] / 1e9

        histogram.record(durationInSeconds, {
          method: propertyKey,
          success: 'false',
          ...defaultAttributes,
        })

        throw error
      }
    }

    return descriptor
  }
}
