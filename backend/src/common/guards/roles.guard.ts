import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@/common/enums/role.enum'
import { ROLES_KEY } from '@/common/decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles) return true
    const { user } = context.switchToHttp().getRequest()
    if (!requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException('Access denied for this role')
    }
    return true
  }
}
