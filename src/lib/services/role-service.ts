/**
 * Servicio centralizado para manejo de roles y metadata de usuarios
 *
 * Consolida toda la lógica de asignación de roles, actualización de metadata
 * y manejo de estados de usuario en un solo lugar.
 */

import { createClerkClient } from '@clerk/nextjs/server'

import { logger } from '../logging/production-logger'

// Crear instancia de clerkClient con la clave secreta
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

export type UserRole = 'member' | 'scout' | 'admin' | 'tester'
export type UserType = 'member' | 'scout' // Tipo de usuario (scout tiene rol member pero es identificado como scout)
export type ProfileStatus = 'incomplete' | 'complete'
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'pending'

export interface UserMetadata {
  role: UserRole
  userType?: UserType // Identifica si es un scout registrado (con rol member pero tipo scout)
  profileStatus: ProfileStatus
  subscription?: {
    status: SubscriptionStatus
    plan: string
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    stripeSessionId?: string
    billing?: 'monthly' | 'yearly'
    activatedAt?: string
    cancelledAt?: string
  }
  onboarding?: {
    completed: boolean
    step: string
    completedAt?: string
  }
}

export interface RoleAssignmentResult {
  success: boolean
  userId: string
  previousRole?: UserRole
  newRole: UserRole
  metadata: UserMetadata
  error?: string
}

export class RoleService {
  /**
   * Determina el rol basado en el plan seleccionado
   *
   * IMPORTANTE:
   * - Plan 'scout' asigna rol 'member' con plan 'basic' y userType 'scout'
   *   (Los scouts acceden al área de member BASIC con opción de upgrade)
   * - Planes 'member', 'basic', 'premium' asignan rol 'member'
   * La diferencia entre basic y premium se maneja en subscription.plan
   * El acceso a features se controla con FeatureAccessService
   */
  static getRoleFromPlan(plan: string): UserRole {
    if (!plan) return 'member'

    const planLower = plan.toLowerCase()

    // Plan 'scout' ahora asigna rol 'member' (acceso al área de member BASIC)
    // El tipo de usuario 'scout' se maneja en metadata.userType
    if (planLower === 'scout') {
      return 'member'
    }

    // Para cualquier otro plan (member, basic, premium, pro), asignar rol 'member'
    // La diferencia entre basic y premium está en subscription.plan
    if (planLower.includes('member') ||
        planLower.includes('basic') ||
        planLower.includes('basica') ||
        planLower.includes('premium') ||
        planLower.includes('pro')) {
      return 'member'
    }

    // Default a member
    logger.warn('Unknown plan type, defaulting to member', { plan })
    return 'member'
  }

  /**
   * Determina si el plan es de tipo Scout
   */
  static isScoutPlan(plan: string): boolean {
    return plan?.toLowerCase() === 'scout'
  }

  /**
   * Determina el rol basado en el email (para casos especiales como admins)
   */
  static getRoleFromEmail(email: string): UserRole {
    if (email.includes('@scoutea.com') || email.includes('@admin.')) {
      return 'admin'
    }
    if (email.includes('@tester.') || email.includes('@test.')) {
      return 'tester'
    }
    return 'member'
  }

  /**
   * Crea metadata inicial para un nuevo usuario
   */
  static createInitialMetadata(email?: string, plan?: string): UserMetadata {
    const role = email ? this.getRoleFromEmail(email) : this.getRoleFromPlan(plan || '')
    
    return {
      role,
      profileStatus: 'incomplete',
      onboarding: {
        completed: false,
        step: 'profile'
      }
    }
  }

  /**
   * Actualiza el rol y metadata de un usuario de forma atómica
   */
  static async updateUserRole(
    userId: string, 
    updates: Partial<UserMetadata>,
    context?: string
  ): Promise<RoleAssignmentResult> {
    try {
      logger.info('Updating user role', { userId, updates, context })

      // Obtener metadata actual
      const user = await clerkClient.users.getUser(userId)
      const currentMetadata = (user.publicMetadata as UserMetadata) || {}
      
      const previousRole = currentMetadata.role || 'member'

      // Merge de metadata preservando datos existentes
      const updatedMetadata: UserMetadata = {
        role: updates.role || currentMetadata.role || 'member',
        profileStatus: updates.profileStatus || currentMetadata.profileStatus || 'incomplete',
        subscription: updates.subscription ? {
          ...currentMetadata.subscription,
          ...updates.subscription
        } : currentMetadata.subscription,
        onboarding: updates.onboarding ? {
          ...currentMetadata.onboarding,
          ...updates.onboarding
        } : currentMetadata.onboarding
      }

      // Actualizar en Clerk
      await clerkClient.users.updateUser(userId, {
        publicMetadata: updatedMetadata
      })

      logger.info('User role updated successfully', {
        userId,
        previousRole,
        newRole: updatedMetadata.role,
        context
      })

      return {
        success: true,
        userId,
        previousRole,
        newRole: updatedMetadata.role,
        metadata: updatedMetadata
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      logger.error('Failed to update user role', error as Error, {
        userId,
        updates,
        context
      })

      return {
        success: false,
        userId,
        newRole: updates.role || 'member',
        metadata: updates as UserMetadata,
        error: errorMessage
      }
    }
  }

  /**
   * Asigna rol después de un pago exitoso
   *
   * Para scouts:
   * - Se asigna rol 'member' (acceso al área de member)
   * - Se guarda plan 'basic' (acceso a Wonderkids + Torneos)
   * - Se marca userType como 'scout' para identificarlos
   */
  static async assignRoleAfterPayment(
    userId: string,
    plan: string,
    stripeData: {
      customerId?: string
      subscriptionId?: string
      sessionId: string
      billing?: 'monthly' | 'yearly'
    }
  ): Promise<RoleAssignmentResult> {
    const role = this.getRoleFromPlan(plan)
    const isScout = this.isScoutPlan(plan)

    // Para scouts: plan se guarda como 'basic' pero userType es 'scout'
    const actualPlan = isScout ? 'basic' : plan

    const updates: Partial<UserMetadata> = {
      role,
      userType: isScout ? 'scout' : 'member',
      subscription: {
        status: 'active' as SubscriptionStatus,
        plan: actualPlan,
        stripeCustomerId: stripeData.customerId,
        stripeSubscriptionId: stripeData.subscriptionId,
        stripeSessionId: stripeData.sessionId,
        billing: stripeData.billing || 'monthly',
        activatedAt: new Date().toISOString()
      },
      onboarding: {
        completed: true,
        step: 'completed',
        completedAt: new Date().toISOString()
      }
    }

    logger.info('Assigning role after payment', {
      userId,
      originalPlan: plan,
      actualPlan,
      role,
      isScout
    })

    return this.updateUserRole(userId, updates, 'payment_completed')
  }

  /**
   * Completa el perfil del usuario
   */
  static async completeUserProfile(userId: string): Promise<RoleAssignmentResult> {
    const updates: Partial<UserMetadata> = {
      profileStatus: 'complete'
    }

    return this.updateUserRole(userId, updates, 'profile_completed')
  }

  /**
   * Cancela la suscripción del usuario
   */
  static async cancelUserSubscription(userId: string): Promise<RoleAssignmentResult> {
    const updates: Partial<UserMetadata> = {
      subscription: {
        status: 'cancelled' as SubscriptionStatus,
        cancelledAt: new Date().toISOString()
      }
    }

    return this.updateUserRole(userId, updates, 'subscription_cancelled')
  }

  /**
   * Obtiene el metadata actual del usuario
   */
  static async getUserMetadata(userId: string): Promise<UserMetadata | null> {
    try {
      const user = await clerkClient.users.getUser(userId)
      return (user.publicMetadata as UserMetadata) || null
    } catch (error) {
      logger.error('Failed to get user metadata', error as Error, { userId })
      return null
    }
  }

  /**
   * Valida si un usuario tiene acceso a una funcionalidad específica
   */
  static hasAccess(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      'member': 1,
      'scout': 2,
      'tester': 3, // Tester tiene acceso a member y scout
      'admin': 4
    }

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
  }

  /**
   * Obtiene las rutas permitidas para un rol
   */
  static getAllowedRoutes(role: UserRole): string[] {
    switch (role) {
      case 'admin':
        return ['/admin', '/member', '/scout']
      case 'tester':
        return ['/member', '/scout'] // Tester puede acceder a member y scout
      case 'scout':
        return ['/scout', '/member']
      case 'member':
        return ['/member']
      default:
        return []
    }
  }
}