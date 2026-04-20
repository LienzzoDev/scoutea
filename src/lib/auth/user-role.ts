import { UserResource } from '@clerk/nextjs/server'

export type Role = 'member' | 'admin' | 'tester'

/**
 * Sistema de roles simplificado.
 * Valid roles: 'member', 'admin', 'tester'. The scout area is admin-only.
 */
export function getUserRole(user: UserResource | null | undefined): Role | null {
  if (!user?.publicMetadata) return null

  const role = user.publicMetadata.role as string

  if (role === 'member' || role === 'admin' || role === 'tester') {
    return role as Role
  }

  return null
}

/**
 * Verifica si el usuario tiene acceso al área de members
 */
export function canAccessMemberArea(user: UserResource | null | undefined): boolean {
  const role = getUserRole(user)
  return role === 'member' || role === 'tester' || role === 'admin'
}

/**
 * El área de scouts está restringida a administradores.
 */
export function canAccessScoutArea(user: UserResource | null | undefined): boolean {
  return getUserRole(user) === 'admin'
}

/**
 * Verifica si el usuario es admin (acceso total)
 */
export function isAdmin(user: UserResource | null | undefined): boolean {
  return getUserRole(user) === 'admin'
}

/**
 * Verifica si el usuario es tester (acceso a member y scout)
 */
export function isTester(user: UserResource | null | undefined): boolean {
  return getUserRole(user) === 'tester'
}
