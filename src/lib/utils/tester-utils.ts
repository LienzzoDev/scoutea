/**
 * Utilidades específicas para el rol "tester"
 */

import { UserRole } from '@/lib/services/role-service'
import { canAccessMemberArea, canAccessScoutArea } from '@/lib/auth/role-utils'

export interface TesterPermissions {
  canAccessMembers: boolean
  canAccessScouts: boolean
  canSwitchBetweenAreas: boolean
  allowedRoutes: string[]
}

/**
 * Obtiene los permisos específicos para un usuario tester
 */
export function getTesterPermissions(role: UserRole): TesterPermissions {
  const isTester = role === 'tester'
  
  return {
    canAccessMembers: isTester ? canAccessMemberArea(role) : false,
    canAccessScouts: isTester ? canAccessScoutArea(role) : false,
    canSwitchBetweenAreas: isTester,
    allowedRoutes: isTester ? ['/member', '/scout'] : []
  }
}

/**
 * Verifica si un usuario es tester
 */
export function isTester(role: UserRole): boolean {
  return role === 'tester'
}

/**
 * Obtiene las rutas de navegación disponibles para un tester
 */
export function getTesterNavigationRoutes() {
  return [
    {
      label: 'Área de Members',
      href: '/member/dashboard',
      description: 'Acceso completo al área de miembros'
    },
    {
      label: 'Área de Scouts',
      href: '/scout/dashboard', 
      description: 'Acceso completo al área de scouts'
    }
  ]
}

/**
 * Mensaje de bienvenida para usuarios tester
 */
export function getTesterWelcomeMessage(): string {
  return 'Como usuario tester, tienes acceso completo tanto al área de Members como de Scouts. Puedes navegar libremente entre ambas áreas para realizar pruebas.'
}