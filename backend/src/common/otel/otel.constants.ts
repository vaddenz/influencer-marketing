/**
 * Injection token for OpenTelemetry Meter
 * Used to create metrics (Counters, Histograms, etc.)
 */
export const OTEL_METER = 'OTEL_METER'

/**
 * Injection token for OpenTelemetry Tracer
 * Used to create spans and traces
 */
export const OTEL_TRACER = 'OTEL_TRACER'
