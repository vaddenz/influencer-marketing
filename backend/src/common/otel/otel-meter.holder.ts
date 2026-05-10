import type { Meter } from '@opentelemetry/api'

export class OtelMeterHolder {
  private static meter: Meter

  static setMeter(meter: Meter) {
    this.meter = meter
  }

  static getMeter(): Meter {
    if (!this.meter) {
      throw new Error(
        'OtelMeterHolder has not been initialized. Please ensure OtelModule is imported and initialized.'
      )
    }
    return this.meter
  }
}
