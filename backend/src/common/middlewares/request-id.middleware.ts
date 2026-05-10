import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

/**
 * Request ID Middleware
 *
 * Assigns a unique Request ID to each incoming request.
 * If 'x-request-id' header is present, it uses that; otherwise, it generates a new UUID.
 * The Request ID is attached to the request object and the response headers.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  /**
   * Middleware handler.
   *
   * @param req - Express Request object
   * @param res - Express Response object
   * @param next - Next function
   */
  use(req: Request, res: Response, next: NextFunction) {
    const requestId =
      (req.headers['x-request-id'] as string) || uuidv4().replaceAll('-', '')
    req['requestId'] = requestId
    res.setHeader('X-Request-Id', requestId)
    next()
  }
}
