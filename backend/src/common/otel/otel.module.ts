import { Module, Global, Inject, OnModuleInit } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { OtelService } from './otel.service'
import { OTEL_METER, OTEL_TRACER } from './otel.constants'
import { OtelMeterHolder } from './otel-meter.holder'
import type { Meter } from '@opentelemetry/api'

/**
 * Global OpenTelemetry Module
 * Registers the OtelService and exports Meter and Tracer providers for dependency injection.
 *
 * @global
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    OtelService,
    {
      provide: OTEL_METER,
      useFactory: (otelService: OtelService) => otelService.getMeter(),
      inject: [OtelService],
    },
    {
      provide: OTEL_TRACER,
      useFactory: (otelService: OtelService) => otelService.getTracer(),
      inject: [OtelService],
    },
  ],
  exports: [OtelService, OTEL_METER, OTEL_TRACER],
})
export class OtelModule implements OnModuleInit {
  constructor(@Inject(OTEL_METER) private readonly meter: Meter) {}

  onModuleInit() {
    OtelMeterHolder.setMeter(this.meter)
  }
}
