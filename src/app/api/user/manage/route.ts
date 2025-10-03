/**
 * API unificada para manejo de usuarios
 * 
 * Consolida las funcionalidades de:
 * - update-user-metadata
 * - assign-role-after-payment  
 * - update-profile
 * 
 * En una sola API con diferentes acciones.
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { RoleService, UserRole } from '@/lib/services/role-service'
import { TransactionService } from '@/lib/services/transaction-service'
import { logger } from '@/lib/logging/production-logger'

// Schemas de validación
const updateMetadataSchema = z.object({
  action: z.literal('update_metadata'),
  metadata: z.object({
    role: z.enum(['member', 'scout', 'admin']).optional(),
    profileStatus: z.enum(['incomplete', 'complete']).optional(),
    subscription: z.object({
      status: z.enum(['active', 'inactive', 'cancelled', 'pending']).optional(),
      plan: z.string().optional(),
      billing: z.enum(['monthly', 'yearly']).optional()
    }).optional()
  })
})

const assignRoleAfterPaymentSchema = z.object({
  action: z.literal('assign_role_after_payment'),
  sessionId: z.string(),
  plan: z.string(),
  billing: z.enum(['monthly', 'yearly']).optional()
})

const completeProfileSchema = z.object({
  action: z.literal('complete_profile'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  experience: z.number().optional(),
  specialization: z.string().optional(),
  languages: z.array(z.string()).optional(),
  email: z.string().email().optional()
})

const requestSchema = z.discriminatedUnion('action', [
  updateMetadataSchema,
  assignRoleAfterPaymentSchema,
  completeProfileSchema
])

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validar el request
    const validationResult = requestSchema.safeParse(body)
    if (!validationResult.success) {
      logger.warn('Invalid request to user manage API', {
        userId,
        errors: validationResult.error.errors,
        body
      })
      
      return NextResponse.json({
        error: 'Invalid request',
        details: validationResult.error.errors
      }, { status: 400 })
    }

    const data = validationResult.data

    logger.info('Processing user management request', {
      userId,
      action: data.action
    })

    // Procesar según la acción
    switch (data.action) {
      case 'update_metadata':
        return await handleUpdateMetadata(userId, data.metadata)
      
      case 'assign_role_after_payment':
        return await handleAssignRoleAfterPayment(userId, data)
      
      case 'complete_profile':
        return await handleCompleteProfile(userId, data)
      
      default:
        return NextResponse.json({
          error: 'Unknown action'
        }, { status: 400 })
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Error in user management API', error as Error, {
      userId: (await auth()).userId,
      url: request.url
    })

    return NextResponse.json({
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 })
  }
}

async function handleUpdateMetadata(userId: string, metadata: any) {
  try {
    const result = await RoleService.updateUserRole(userId, metadata, 'api_update_metadata')
    
    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to update metadata'
      }, { status: 500 })
    }

    logger.info('Metadata updated successfully', {
      userId,
      previousRole: result.previousRole,
      newRole: result.newRole
    })

    return NextResponse.json({
      success: true,
      message: 'Metadata updated successfully',
      result: {
        userId: result.userId,
        previousRole: result.previousRole,
        newRole: result.newRole,
        metadata: result.metadata
      }
    })

  } catch (error) {
    logger.error('Error updating metadata', error as Error, { userId })
    throw error
  }
}

async function handleAssignRoleAfterPayment(
  userId: string, 
  data: { sessionId: string; plan: string; billing?: 'monthly' | 'yearly' }
) {
  try {
    const result = await TransactionService.processPaymentCompletion(userId, data.plan, {
      sessionId: data.sessionId,
      billing: data.billing || 'monthly'
    })

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to assign role after payment'
      }, { status: 500 })
    }

    logger.info('Role assigned after payment successfully', {
      userId,
      plan: data.plan,
      sessionId: data.sessionId,
      assignedRole: result.data.roleResult.newRole
    })

    return NextResponse.json({
      success: true,
      message: `Role "${result.data.roleResult.newRole}" assigned successfully after payment`,
      result: {
        userId,
        assignedRole: result.data.roleResult.newRole,
        plan: data.plan,
        sessionId: data.sessionId,
        previousRole: result.data.roleResult.previousRole,
        metadata: result.data.roleResult.metadata
      }
    })

  } catch (error) {
    logger.error('Error assigning role after payment', error as Error, { 
      userId, 
      sessionId: data.sessionId,
      plan: data.plan
    })
    throw error
  }
}

async function handleCompleteProfile(userId: string, profileData: any) {
  try {
    const { action, email, ...cleanProfileData } = profileData
    
    // Convertir dateOfBirth si existe
    if (cleanProfileData.dateOfBirth) {
      cleanProfileData.dateOfBirth = new Date(cleanProfileData.dateOfBirth)
    }

    const result = await TransactionService.completeUserProfile(userId, cleanProfileData)

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to complete profile',
        rollbackPerformed: result.rollbackPerformed
      }, { status: 500 })
    }

    logger.info('Profile completed successfully', {
      userId,
      rollbackPerformed: result.rollbackPerformed
    })

    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully',
      result: {
        userId,
        roleResult: result.data.roleResult,
        profileData: result.data.profileData
      }
    })

  } catch (error) {
    logger.error('Error completing profile', error as Error, { userId })
    throw error
  }
}