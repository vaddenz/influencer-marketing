import type { MetricOptions } from '@opentelemetry/api'
import { OtelMeterHolder } from '@/common/otel/otel-meter.holder'

export interface TrackCountOptions extends MetricOptions {
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
 * Decorator to track the execution count of a method.
 * Records the count using a Counter.
 *
 * @param nameOrOptions Metric name or options object
 */
export function TrackCount(
  nameOrOptions?: string | TrackCountOptions,
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
      description: `Execution count of ${propertyKey}`,
      ...metricOptions,
    }

    descriptor.value = async function (...args: any[]) {
      const meter = OtelMeterHolder.getMeter()
      const counter = meter.createCounter(metricName, metricOptions)

      try {
        const result = await originalMethod.apply(this, args)

        counter.add(1, {
          method: propertyKey,
          success: 'true',
          ...defaultAttributes,
        })

        return result
      } catch (error) {
        counter.add(1, {
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
