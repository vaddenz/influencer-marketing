import { BadRequestException, Logger } from '@nestjs/common'

/**
 * Utility class for extracting context information from requests
 */
export class ContextUtil {
  /**
   * Get the current user ID from the request object
   * @param req - The request object
   * @returns User ID or null if not found
   */
  static getCurrentUserId(req: any): string | null {
    return req?.user?.id || null
  }

  /**
   * Get the current user ID or throw an exception if not found
   * @param req - The request object
   * @throws BadRequestException if user info is missing
   * @returns User ID
   */
  static getCurrentUserIdOrThrow(req: any): string {
    const userId = this.getCurrentUserId(req)
    if (!userId) {
      throw new BadRequestException('Missing user info in request')
    }
    return userId
  }

  /**
   * Get the tenant ID from the request object
   * @param req - The request object
   * @returns Tenant ID or null if not found
   */
  static getTenantId(req: any): string | null {
    return req?.tenant?.id || null
  }

  /**
   * Get the tenant ID or throw an exception if not found
   * @param req - The request object
   * @throws BadRequestException if tenant info is missing
   * @returns Tenant ID
   */
  static getTenantIdOrThrow(req: any): string {
    const tenantId = this.getTenantId(req)
    if (!tenantId) {
      Logger.warn(
        'Missing tenant info in request (ensure PemissionGuard is applied)'
      )
      throw new BadRequestException('Missing tenant info in request')
    }
    return tenantId
  }
}
