import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import type { Meter, Counter, Histogram } from '@opentelemetry/api'
import { OTEL_METER } from './otel.constants'

@Injectable()
export class OtelMetricsInterceptor implements NestInterceptor {
  private requestsCounter: Counter
  private responseDurationHistogram: Histogram

  constructor(@Inject(OTEL_METER) private readonly meter: Meter) {
    this.requestsCounter = this.meter.createCounter('http_requests_total', {
      description: 'Total number of HTTP requests',
    })
    this.responseDurationHistogram = this.meter.createHistogram(
      'http_request_duration_seconds',
      {
        description: 'HTTP request duration in seconds',
        unit: 's',
      }
    )
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp()
    const req = httpContext.getRequest()
    const res = httpContext.getResponse()

    // Skip if not HTTP (e.g. WebSocket, Microservices)
    if (!req || !res) {
      return next.handle()
    }

    const startTime = process.hrtime()

    return next.handle().pipe(
      tap(() => {
        const endTime = process.hrtime(startTime)
        const durationInSeconds = endTime[0] + endTime[1] / 1e9

        const method = req.method
        const url = req.route?.path || req.url // Use route path to avoid high cardinality
        const statusCode = res.statusCode

        // Extract user ID if available (from AuthGuard)
        const userId = req.user?.id || 'anonymous'

        const attributes = {
          method,
          route: url,
          status_code: statusCode.toString(),
          user_id: userId.toString(),
        }

        this.requestsCounter.add(1, attributes)
        this.responseDurationHistogram.record(durationInSeconds, attributes)
      })
    )
  }
}
