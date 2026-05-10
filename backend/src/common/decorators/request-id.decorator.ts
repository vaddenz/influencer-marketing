import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Decorator to extract the Request ID from the incoming request.
 * The Request ID is usually set by the RequestIdMiddleware.
 *
 * @returns The request ID string or an empty string if not found
 */
export const RequestId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request['requestId'] || ''
  }
)
