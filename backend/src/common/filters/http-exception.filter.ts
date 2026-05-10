import path from 'path'
import { Response } from 'express'
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { ThrottlerException } from '@nestjs/throttler'
import { Prisma } from '@/generated/prisma/client'
import { GLOBAL_PREFIX } from '@/common/const/app'
import { ErrorUtil } from '@/common/utils'

/**
 * Global Exception Filter
 *
 * Catches all exceptions thrown during request processing and formats them into a standard error response.
 * Handles HttpExceptions, Prisma errors, and other unknown errors.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly ignorePaths: string[] = []) {}

  /**
   * Method to handle the caught exception.
   *
   * @param exception - The exception object
   * @param host - The arguments host to access the execution context
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const url = ctx.getRequest().url
    const response = ctx.getResponse<Response>()
    const { status, code, message } = this.parseException(exception)

    // Check if the current URL matches any of the ignored paths
    if (
      this.ignorePaths.some(
        (_path) =>
          url.startsWith(_path) ||
          url.startsWith(path.join('/', GLOBAL_PREFIX, _path))
      ) &&
      exception instanceof HttpException
    ) {
      response.status(exception.getStatus()).json(exception.getResponse())
      return
    }

    const errorBody = {
      success: false,
      data: null,
      error: {
        code,
        message,
      },
      requestId: ctx.getRequest().requestId,
      time: new Date().toISOString(),
    }

    this.logException(exception)
    response.status(status).json(errorBody)
  }

  /**
   * Parses the exception to extract status code, error code, and message.
   *
   * @param exception - The exception to parse
   * @returns An object containing status, code, and message
   */
  private parseException(exception: unknown): {
    status: any
    code: string
    message: string
  } {
    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let code = 'INTERNAL_SERVER_ERROR'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (
        typeof exceptionResponse === 'object' &&
        (exceptionResponse as any).message
      ) {
        const msg = (exceptionResponse as any).message
        message = Array.isArray(msg) ? msg.join(', ') : msg
      }

      // Handle ThrottlerException specially if needed, though it's an HttpException
      if (exception instanceof ThrottlerException) {
        code = 'TOO_MANY_REQUESTS'
        message = 'Too many requests, please try again later'
      } else {
        code = `HTTP_${status}`
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      switch (exception.code) {
        case 'P2002': // Unique constraint violation
          status = HttpStatus.BAD_REQUEST
          message = 'Record already exists'
          code = 'CONFLICT'
          break
        case 'P2003': // Foreign key constraint violation
          status = HttpStatus.BAD_REQUEST
          message = 'Record already exists (constraint violation)'
          code = 'CONFLICT'
          break
        case 'P2025': // Record not found
          status = HttpStatus.NOT_FOUND
          message = 'Record not found'
          code = 'NOT_FOUND'
          break
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST
      message = 'Validation error: Invalid data provided'
      code = 'VALIDATION_ERROR'
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = 'Database connection error'
      code = 'DATABASE_CONNECTION_ERROR'
    }

    return { status, code, message }
  }

  /**
   * Logs the exception to the console/logger.
   * Skips logging for expected exceptions like throttling.
   *
   * @param exception - The exception to log
   */
  private logException(exception: unknown) {
    if (exception instanceof ThrottlerException) {
      return
    }
    Logger.error(ErrorUtil.message(exception))
  }
}
