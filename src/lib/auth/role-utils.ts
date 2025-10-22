/**
 * Utilidades compartidas para manejo de roles y autenticación
 * Evita duplicación de lógica entre middleware y APIs
 */

import { User } from '@clerk/nextjs/server'

import { UserMetadata, UserRole } from '@/lib/services/role-service'

export interface UserRoleInfo {
  userId: string
  email?: string
  role: UserRole
  profileCompleted: boolean
  hasActiveSubscription: boolean
  metadata: UserMetadata
  access: {
    memberArea: boolean
    scoutArea: boolean
    adminArea: boolean
  }
}

/**
 * Extrae información completa del rol del usuario
 */
export function getUserRoleInfo(user: User): UserRoleInfo {
  const metadata = (user.publicMetadata as UserMetadata) || {
    role: 'member',
    profileStatus: 'incomplete'
  }

  const role = metadata.role || 'member'
  const profileCompleted = metadata.profileStatus === 'complete'
  const hasActiveSubscription = metadata.subscription?.status === 'active'

  return {
    userId: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    role,
    profileCompleted,
    hasActiveSubscription,
    metadata,
    access: {
      memberArea: canAccessMemberArea(role),
      scoutArea: canAccessScoutArea(role),
      adminArea: isAdmin(role)
    }
  }
}

/**
 * Verifica si el usuario puede acceder al área de miembros
 */
export function canAccessMemberArea(role: UserRole): boolean {
  return ['member', 'scout', 'tester', 'admin'].includes(role)
}

/**
 * Verifica si el usuario puede acceder al área de scouts
 */
export function canAccessScoutArea(role: UserRole): boolean {
  return ['scout', 'tester', 'admin'].includes(role)
}

/**
 * Verifica si el usuario es administrador
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * Obtiene la URL de dashboard apropiada para el rol
 */
export function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'scout':
      return '/scout/dashboard'
    case 'tester':
      return '/member/dashboard' // Tester por defecto va a member dashboard
    case 'member':
      return '/member/dashboard'
    default:
      return '/member/dashboard'
  }
}

/**
 * Verifica si una ruta requiere suscripción activa
 */
export function requiresActiveSubscription(pathname: string): boolean {
  // Rutas que requieren suscripción activa
  const subscriptionRequiredRoutes = [
    '/member/dashboard',
    '/member/search',
    '/member/player',
    '/member/scouts',
    '/member/comparison',
    '/scout/dashboard'
  ]

  return subscriptionRequiredRoutes.some(route => pathname.startsWith(route))
}

/**
 * Verifica si una ruta es parte del flujo de onboarding
 */
export function isOnboardingRoute(pathname: string): boolean {
  const onboardingRoutes = [
    '/member/complete-profile',
    '/member/welcome',
    '/member/payment-processing',
    '/member/complete-profile-after-payment'
  ]

  return onboardingRoutes.some(route => pathname.startsWith(route))
}

/**
 * Determina a qué ruta de onboarding redirigir según el estado del usuario
 *
 * @param roleInfo - Información del usuario (puede ser null si recién se registró)
 * @returns URL de la ruta de onboarding apropiada
 */
export function getOnboardingRedirectUrl(roleInfo: UserRoleInfo | null): string {
  // Si no hay roleInfo, el webhook aún no ha procesado → ir a complete-profile
  if (!roleInfo) {
    return '/member/complete-profile'
  }

  // Si no tiene suscripción activa → ir a complete-profile
  // (complete-profile se encarga de redirigir al pago)
  if (!roleInfo.hasActiveSubscription) {
    return '/member/complete-profile'
  }

  // Si tiene suscripción pero perfil incompleto → ir a complete-profile
  if (!roleInfo.profileCompleted) {
    return '/member/complete-profile'
  }

  // Si tiene todo completo → ir a dashboard
  return getDashboardUrl(roleInfo.role)
}