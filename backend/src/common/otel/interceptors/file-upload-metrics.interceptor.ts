import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { OTEL_METER } from '@/common/otel/otel.constants'
import type { Meter, Counter, Histogram } from '@opentelemetry/api'

@Injectable()
export class FileUploadMetricsInterceptor implements NestInterceptor {
  private readonly uploadCounter: Counter
  private readonly uploadSizeHistogram: Histogram
  private readonly uploadDurationHistogram: Histogram

  constructor(@Inject(OTEL_METER) private readonly meter: Meter) {
    this.uploadCounter = this.meter.createCounter('files_uploaded_total', {
      description: 'Total number of files uploaded',
    })
    this.uploadSizeHistogram = this.meter.createHistogram(
      'files_upload_size_bytes',
      {
        description: 'Size of uploaded files in bytes',
        unit: 'bytes',
      }
    )
    this.uploadDurationHistogram = this.meter.createHistogram(
      'files_upload_duration_seconds',
      {
        description: 'Time taken to upload files',
        unit: 's',
      }
    )
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const startTime = process.hrtime()

    return next.handle().pipe(
      tap(() => {
        const endTime = process.hrtime(startTime)
        const durationInSeconds = endTime[0] + endTime[1] / 1e9

        const file = request.file
        const user = request.user

        if (file) {
          this.uploadSizeHistogram.record(file.size, {
            mimetype: file.mimetype,
          })

          const attributes: any = { mimetype: file.mimetype }
          if (user && user.id) {
            attributes.user_id = user.id.toString()
          }
          this.uploadCounter.add(1, attributes)
        }

        this.uploadDurationHistogram.record(durationInSeconds, {
          success: 'true',
        })
      }),
      catchError((error) => {
        const endTime = process.hrtime(startTime)
        const durationInSeconds = endTime[0] + endTime[1] / 1e9

        this.uploadDurationHistogram.record(durationInSeconds, {
          success: 'false',
        })
        return throwError(() => error)
      })
    )
  }
}
