import { SetMetadata } from '@nestjs/common'
import { Role } from '@/common/enums/role.enum'

export const ROLES_KEY = 'roles'

/**
 * Decorator that assigns role-based access control metadata to a route handler or controller.
 *
 * @param roles - The roles allowed to access the decorated route.
 * @returns A decorator function that sets the roles metadata.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)
