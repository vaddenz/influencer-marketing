import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions'
import {
  ConsoleSpanExporter,
  SpanExporter,
} from '@opentelemetry/sdk-trace-base'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import {
  PeriodicExportingMetricReader,
  MetricReader,
  ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import {
  BatchLogRecordProcessor,
  ConsoleLogRecordExporter,
  LogRecordProcessor,
} from '@opentelemetry/sdk-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston'
import { metrics, trace } from '@opentelemetry/api'
import { SECOND } from '@/common/const/unit'
import { FileMetricExporter } from './file-metric.exporter'

@Injectable()
export class OtelService implements OnModuleDestroy {
  private sdk: NodeSDK | null = null
  private readonly serviceName: string
  private readonly logger = new Logger(OtelService.name)

  constructor(private readonly configService: ConfigService) {
    this.serviceName = this.configService.get<string>('otel.serviceName')!
    // Initialize SDK in constructor to ensure it's ready before other modules might use it
    this.startSDK()
  }

  /**
   * Gracefully shuts down the OpenTelemetry SDK.
   */
  async onModuleDestroy() {
    if (this.sdk) {
      this.logger.log('Shutting down...')
      await this.sdk.shutdown()
      this.logger.log('Shutdown complete')
    }
  }

  /**
   * Starts the OpenTelemetry NodeSDK with configured resources, exporters, and instrumentations.
   */
  private startSDK() {
    const serviceVersion = this.configService.get<string>(
      'otel.serviceVersion'
    )!
    const env = this.configService.get<string>('otel.env')!
    const deployEnv = this.configService.get<string>('otel.deployEnv')!
    const enableMetrics = this.configService.get<boolean>('otel.enableMetrics')
    const enableLogs = this.configService.get<boolean>('otel.enableLogs')
    const metricsExporterType = this.configService.get<string>(
      'otel.metricsExporter'
    )!
    const logsExporterType =
      this.configService.get<string>('otel.logsExporter')!

    // Define service resource attributes
    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: this.serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: deployEnv,
      team: 'backend',
      'app.type': 'backend-api',
    })

    const metricReader = enableMetrics
      ? this.getMetricReader(metricsExporterType)
      : undefined
    const logRecordProcessor = enableLogs
      ? this.getLogRecordProcessor(logsExporterType)
      : undefined
    // Traces are currently always enabled but exporter depends on env (console for dev, otlp for prod)
    // You might want to make this configurable like metrics/logs
    const traceExporter = this.getTraceExporter(env)

    this.sdk = new NodeSDK({
      resource,
      traceExporter,
      metricReader,
      logRecordProcessor,
      instrumentations: [
        // Winston instrumentation to automatically inject trace context into logs
        new WinstonInstrumentation({
          logHook: (span, record) => {
            record['attributes'] = {
              ...record['attributes'],
              'service.name': this.serviceName,
              env: deployEnv,
              trace_id: span?.spanContext().traceId,
              span_id: span?.spanContext().spanId,
            }
          },
        }),
      ],
    })

    try {
      this.sdk.start()
      this.logger.log(
        `SDK started. Metrics: ${metricsExporterType}, Logs: ${logsExporterType}`
      )
    } catch (error) {
      this.logger.error('Failed to start SDK', error)
    }
  }

  /**
   * Returns the OpenTelemetry Meter for the service.
   */
  public getMeter() {
    return metrics.getMeter(this.serviceName)
  }

  /**
   * Returns the OpenTelemetry Tracer for the service.
   */
  public getTracer() {
    return trace.getTracer(this.serviceName)
  }

  /**
   * Parses comma-separated header string into an object.
   * Example: "Authorization=Bearer token,Custom-Header=value"
   */
  private parseHeaders(headers?: string): Record<string, string> {
    if (!headers) return {}
    return headers.split(',').reduce(
      (acc, header) => {
        const [key, value] = header.split('=')
        if (key && value) acc[key.trim()] = value.trim()
        return acc
      },
      {} as Record<string, string>
    )
  }

  /**
   * Factory method to create a MetricReader based on configuration.
   */
  private getMetricReader(exporterType: string): MetricReader {
    const exportInterval = this.configService.get<number>(
      'otel.metricsExportInterval'
    )
    const otlpEndpoint = this.configService.get<string>('otel.otlpEndpoint')
    const otlpHeaders = this.configService.get<string>('otel.otlpHeaders')

    switch (exporterType) {
      case 'prometheus':
        return new PrometheusExporter({
          port: this.configService.get<number>('otel.prometheusPort'),
          endpoint: '/metrics',
        })
      case 'otlp':
        return new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({
            url: `${otlpEndpoint}/metrics`,
            headers: this.parseHeaders(otlpHeaders),
          }),
          exportIntervalMillis: exportInterval,
          exportTimeoutMillis: 10 * SECOND,
        })
      case 'file':
        return new PeriodicExportingMetricReader({
          exporter: new FileMetricExporter(),
          exportIntervalMillis: exportInterval,
        })
      case 'console':
      default:
        return new PeriodicExportingMetricReader({
          exporter: new ConsoleMetricExporter(),
          exportIntervalMillis: exportInterval,
        })
    }
  }

  /**
   * Factory method to create a LogRecordProcessor based on configuration.
   */
  private getLogRecordProcessor(exporterType: string): LogRecordProcessor {
    const otlpEndpoint = this.configService.get<string>('otel.otlpEndpoint')
    const otlpHeaders = this.configService.get<string>('otel.otlpHeaders')

    switch (exporterType) {
      case 'otlp':
        return new BatchLogRecordProcessor(
          new OTLPLogExporter({
            url: `${otlpEndpoint}/logs`,
            headers: this.parseHeaders(otlpHeaders),
          }),
          {
            maxQueueSize: 1000,
            scheduledDelayMillis: 5 * SECOND,
            exportTimeoutMillis: 10 * SECOND,
          }
        )
      case 'console':
      default:
        return new BatchLogRecordProcessor(new ConsoleLogRecordExporter(), {
          scheduledDelayMillis: 1 * SECOND,
        })
    }
  }

  /**
   * Factory method to create a SpanExporter based on environment.
   */
  private getTraceExporter(env: string): SpanExporter {
    const otlpEndpoint = this.configService.get<string>('otel.otlpEndpoint')
    const otlpHeaders = this.configService.get<string>('otel.otlpHeaders')

    return env === 'production'
      ? new OTLPTraceExporter({
          url: `${otlpEndpoint}/traces`,
          headers: this.parseHeaders(otlpHeaders),
        })
      : new ConsoleSpanExporter()
  }
}
