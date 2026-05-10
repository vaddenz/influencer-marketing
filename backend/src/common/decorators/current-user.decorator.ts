import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Decorator to extract the current authenticated user from the request.
 * Can be used to get the full user object or a specific property.
 *
 * @example
 * extract full user: @CurrentUser() user: UserPayload
 * extract email: @CurrentUser('email') email: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user

    return data ? user?.[data] : user
  }
)

/**
 * Interface representing the user payload attached to the request
 */
export interface UserPayload {
  /** User ID */
  id: string
  /** User Email */
  email: string
  /** User Role */
  role: string
}
