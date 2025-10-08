/**
 * Servicio de transacciones para operaciones atómicas
 * 
 * Maneja operaciones que requieren consistencia entre Clerk y la base de datos,
 * implementando rollback en caso de errores.
 */

import { clerkClient } from '@clerk/nextjs/server'
import { UserService } from './user-service'
import { RoleService, UserMetadata } from './role-service'
import { logger } from '../logging/production-logger'

export interface UserCreationData {
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  plan?: string
}

export interface TransactionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  rollbackPerformed?: boolean
}

export class TransactionService {
  /**
   * Crea un usuario de forma atómica en Clerk y base de datos
   */
  static async createUserWithRole(userData: UserCreationData): Promise<TransactionResult> {
    const { clerkId, email, firstName, lastName, plan } = userData
    
    let clerkUpdated = false
    let dbUserCreated = false
    
    try {
      logger.info('Starting atomic user creation', { clerkId, email, plan })

      // 1. Crear metadata inicial
      const initialMetadata = RoleService.createInitialMetadata(email, plan)
      
      // 2. Actualizar Clerk primero
      await clerkClient.users.updateUser(clerkId, {
        publicMetadata: initialMetadata
      })
      clerkUpdated = true
      
      logger.info('Clerk metadata updated', { clerkId, metadata: initialMetadata })

      // 3. Crear usuario en base de datos
      let dbUser = null
      try {
        dbUser = await UserService.createUser({
          clerkId,
          email,
          firstName: firstName || '',
          lastName: lastName || ''
        })
        dbUserCreated = true
        
        logger.info('Database user created', { clerkId, dbUserId: dbUser.id })
      } catch (dbError) {
        // Si el usuario ya existe en DB, obtenerlo
        if (dbError.code === 'P2002') {
          logger.info('User already exists in database, fetching existing user', { clerkId })
          dbUser = await UserService.getUserByClerkId(clerkId)
          dbUserCreated = false // No creamos, ya existía
        } else {
          throw dbError
        }
      }

      return {
        success: true,
        data: {
          clerkId,
          dbUser,
          metadata: initialMetadata,
          created: {
            clerk: clerkUpdated,
            database: dbUserCreated
          }
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      logger.error('User creation transaction failed', error as Error, {
        clerkId,
        email,
        clerkUpdated,
        dbUserCreated
      })

      // Rollback: revertir cambios en Clerk si fue actualizado
      let rollbackPerformed = false
      if (clerkUpdated) {
        try {
          await clerkClient.users.updateUser(clerkId, {
            publicMetadata: {}
          })
          rollbackPerformed = true
          logger.info('Clerk metadata rollback completed', { clerkId })
        } catch (rollbackError) {
          logger.error('Failed to rollback Clerk metadata', rollbackError as Error, { clerkId })
        }
      }

      return {
        success: false,
        error: errorMessage,
        rollbackPerformed
      }
    }
  }

  /**
   * Actualiza usuario después de pago de forma atómica
   */
  static async processPaymentCompletion(
    userId: string,
    plan: string,
    stripeData: {
      customerId?: string
      subscriptionId?: string
      sessionId: string
      billing?: 'monthly' | 'yearly'
    }
  ): Promise<TransactionResult> {
    try {
      logger.info('Processing payment completion', { userId, plan, stripeData })

      // 1. Asignar rol basado en el pago
      const roleResult = await RoleService.assignRoleAfterPayment(userId, plan, stripeData)
      
      if (!roleResult.success) {
        throw new Error(roleResult.error || 'Failed to assign role after payment')
      }

      // 2. Actualizar usuario en base de datos si existe
      try {
        const dbUser = await UserService.getUserByClerkId(userId)
        if (dbUser) {
          await UserService.updateUser(userId, {
            profileCompleted: true
          })
          logger.info('Database user updated after payment', { userId })
        }
      } catch (dbError) {
        // No es crítico si falla la actualización en DB
        logger.warn('Failed to update database user after payment', { 
          userId, 
          error: dbError instanceof Error ? dbError.message : 'Unknown error' 
        })
      }

      return {
        success: true,
        data: {
          userId,
          roleResult,
          plan,
          stripeData
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      logger.error('Payment completion transaction failed', error as Error, {
        userId,
        plan,
        stripeData
      })

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Completa el perfil del usuario de forma atómica
   */
  static async completeUserProfile(
    userId: string,
    profileData: {
      firstName: string
      lastName: string
      dateOfBirth?: Date
      address?: string
      city?: string
      country?: string
    }
  ): Promise<TransactionResult> {
    let clerkUpdated = false
    let dbUpdated = false

    try {
      logger.info('Completing user profile', { userId })

      // 1. Actualizar Clerk metadata
      const roleResult = await RoleService.completeUserProfile(userId)
      if (!roleResult.success) {
        throw new Error(roleResult.error || 'Failed to update Clerk metadata')
      }
      clerkUpdated = true

      // 2. Actualizar/crear usuario en base de datos
      try {
        const user = await UserService.getUserByClerkId(userId)

        if (user) {
          await UserService.updateUser(userId, {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            dateOfBirth: profileData.dateOfBirth,
            address: profileData.address,
            city: profileData.city,
            country: profileData.country,
            profileCompleted: true
          })
        } else {
          // Si no existe, crearlo con email temporal (debería existir por el registro)
          await UserService.createUser({
            clerkId: userId,
            email: `temp-${userId}@scoutea.com`,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            dateOfBirth: profileData.dateOfBirth,
            address: profileData.address,
            city: profileData.city,
            country: profileData.country,
            profileCompleted: true
          })
        }
        dbUpdated = true
      } catch (dbError) {
        logger.error('Error updating/creating user in database', dbError as Error, { userId })
        throw dbError
      }

      return {
        success: true,
        data: {
          userId,
          roleResult,
          profileData
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      logger.error('Profile completion transaction failed', error as Error, {
        userId,
        clerkUpdated,
        dbUpdated
      })

      // Rollback Clerk si fue actualizado
      let rollbackPerformed = false
      if (clerkUpdated) {
        try {
          const currentMetadata = await RoleService.getUserMetadata(userId)
          if (currentMetadata) {
            await RoleService.updateUserRole(userId, {
              profileStatus: 'incomplete'
            }, 'rollback_profile_completion')
          }
          rollbackPerformed = true
        } catch (rollbackError) {
          logger.error('Failed to rollback profile completion', rollbackError as Error, { userId })
        }
      }

      return {
        success: false,
        error: errorMessage,
        rollbackPerformed
      }
    }
  }
}