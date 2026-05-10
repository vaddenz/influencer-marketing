import path from 'path'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { GLOBAL_PREFIX } from '@/common/const/app'

/**
 * Standard API Response Interface
 */
export interface Response<T> {
  success: boolean
  data: T
  error: any
  requestId: string
  time: string
}

/**
 * Transform Interceptor
 *
 * Intercepts successful responses and wraps them in a standard response format.
 * Ensures consistent API response structure across the application.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T> | T
> {
  constructor(private readonly ignorePaths: string[] = []) {}

  /**
   * Intercepts the request/response flow.
   *
   * @param context - The execution context
   * @param next - The call handler
   * @returns An observable of the transformed response
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T> | T> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest()
    const url = request.url

    // Check if the current URL matches any of the ignored paths
    if (
      this.ignorePaths.some(
        (_path) =>
          url.startsWith(_path) ||
          url.startsWith(path.join('/', GLOBAL_PREFIX, _path))
      )
    ) {
      return next.handle()
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        error: null,
        requestId: request.requestId,
        time: new Date().toISOString(),
      }))
    )
  }
}
