import { registerAs } from '@nestjs/config'
import { SECOND } from '@/common/const/unit'

/**
 * OpenTelemetry Configuration
 *
 * This configuration registers the 'otel' namespace.
 * It provides settings for service identity, environment, exporters, and endpoints.
 */
export default registerAs('otel', () => {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    /**
     * The name of the service, used in traces and metrics.
     * Default: 'backend'
     */
    serviceName: process.env.SERVICE_NAME || 'backend',

    /**
     * The version of the service.
     * Default: '1.0.0'
     */
    serviceVersion: process.env.SERVICE_VERSION || '1.0.0',

    /**
     * The runtime environment (e.g., 'production', 'development').
     */
    env: process.env.NODE_ENV || 'production',

    /**
     * The deployment environment identifier (e.g., 'staging', 'prod-us-east').
     * Useful for filtering in observability platforms.
     */
    deployEnv: process.env.DEPLOY_ENV || process.env.NODE_ENV || 'prod',

    /**
     * Whether to enable metrics collection.
     * Default: true
     */
    enableMetrics: process.env.OTEL_ENABLE_METRICS !== 'false',

    /**
     * Whether to enable log collection.
     * Default: true
     */
    enableLogs: process.env.OTEL_ENABLE_LOGS !== 'false',

    /**
     * The exporter to use for metrics.
     * Options: 'otlp', 'prometheus', 'console', 'file'
     * Default: 'otlp'
     */
    metricsExporter: process.env.OTEL_METRICS_EXPORTER || 'otlp',

    /**
     * The exporter to use for logs.
     * Options: 'otlp', 'console'
     * Default: 'otlp'
     */
    logsExporter: process.env.OTEL_LOGS_EXPORTER || 'otlp',

    /**
     * The interval (in milliseconds) for exporting metrics.
     * Default: 30s for production, 10s for development.
     */
    metricsExportInterval:
      parseInt(
        process.env.OTEL_METRICS_EXPORT_INTERVAL ||
          (isProduction ? '30' : '10'),
        10
      ) * SECOND,

    /**
     * The OTLP endpoint for sending telemetry data.
     * Default: 'http://otel-collector:4318/v1'
     */
    otlpEndpoint: process.env.OTLP_ENDPOINT || 'http://otel-collector:4318/v1',

    /**
     * Additional headers to send with OTLP requests (e.g., for authentication).
     * Format: 'key1=value1,key2=value2'
     */
    otlpHeaders: process.env.OTEL_OTLP_HEADERS || '',

    /**
     * The port to expose Prometheus metrics on (if metricsExporter is 'prometheus').
     * Default: 9464
     */
    prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9464', 10),
  }
})
