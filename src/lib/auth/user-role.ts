import { UserResource } from '@clerk/nextjs/server'

export type Role = 'member' | 'scout' | 'admin' | 'tester'

/**
 * Sistema de roles simplificado
 * Solo verifica si el usuario tiene el rol 'member', 'scout' o 'admin' en publicMetadata
 */
export function getUserRole(user: UserResource | null | undefined): Role | null {
  if (!user?.publicMetadata) return null
  
  const role = user.publicMetadata.role as string
  
  // Solo roles válidos
  if (role === 'member' || role === 'scout' || role === 'admin' || role === 'tester') {
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
 * Verifica si el usuario tiene acceso al área de scouts
 */
export function canAccessScoutArea(user: UserResource | null | undefined): boolean {
  const role = getUserRole(user)
  return role === 'scout' || role === 'tester' || role === 'admin'
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
