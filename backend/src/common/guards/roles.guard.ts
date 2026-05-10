import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@/common/enums/role.enum'
import { ROLES_KEY } from '@/common/decorators/roles.decorator'

/**
 * Guard that restricts access to routes based on user roles.
 *
 * Apply selectively alongside `JwtAuthGuard` using `@UseGuards(JwtAuthGuard, RolesGuard)`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines whether the current request is authorized to access the route.
   *
   * @param context - The execution context of the current request.
   * @returns `true` if the user has one of the required roles or no roles are required.
   * @throws {ForbiddenException} If the user does not have a required role.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles) return true

    const { user } = context.switchToHttp().getRequest()
    if (!user) return true

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Access denied for this role')
    }
    return true
  }
}
