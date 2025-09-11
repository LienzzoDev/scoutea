import { UserResource } from '@clerk/nextjs/server'

export type Role = 'admin' | 'member'

/**
 * Obtiene el rol del usuario desde publicMetadata (seguro)
 */
export function getUserRole(user: UserResource | null | undefined): Role | null {
  if (!user) return null

  // Solo usar publicMetadata (seguro)
  const publicRole = (user.publicMetadata as { role?: string })?.role
  if (publicRole && (publicRole === 'admin' || publicRole === 'member')) {
    return publicRole as Role
  }

  return null
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(user: UserResource | null | undefined, role: Role): boolean {
  return getUserRole(user) === role
}

/**
 * Verifica si el usuario es admin
 */
export function isAdmin(user: UserResource | null | undefined): boolean {
  return hasRole(user, 'admin')
}

/**
 * Verifica si el usuario es member
 */
export function isMember(user: UserResource | null | undefined): boolean {
  return hasRole(user, 'member')
}

/**
 * Obtiene información detallada del rol del usuario
 */
export function getUserRoleInfo(user: UserResource | null | undefined) {
  const role = getUserRole(user)
  
  return {
    role,
    isAdmin: role === 'admin',
    isMember: role === 'member',
    hasRole: role !== null,
    publicMetadata: user?.publicMetadata
  }
}
