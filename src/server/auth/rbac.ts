/**
 * src/server/auth/rbac.ts
 * WP-0.7: RBAC authorization guard.
 */

import { ROLE_PERMISSIONS, PermissionKey } from './permissions';

export class ForbiddenError extends Error {
  status = 403;
  constructor(message: string = 'Access denied: insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Checks if a given role has the required permission.
 */
export function hasPermission(role: string, permission: PermissionKey | string): boolean {
  if (!role) return false;
  const normalizedRole = role.toUpperCase();
  if (normalizedRole === 'OWNER' || normalizedRole === 'SUPERADMIN' || normalizedRole === 'HOTEL_ADMIN') {
    return true;
  }
  const allowed = ROLE_PERMISSIONS[normalizedRole] || [];
  return allowed.includes(permission);
}

/**
 * Asserts that the role has the permission, otherwise throws 403 ForbiddenError.
 */
export function requirePermission(role: string, permission: PermissionKey | string): void {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(
      `Role '${role}' is not authorized to perform action '${permission}'`
    );
  }
}
