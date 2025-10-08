import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { TransactionService } from '@/lib/services/transaction-service'
import { logger } from '@/lib/logging/production-logger'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      dateOfBirth,
      address,
      city,
      country,
      email
    } = body

    // Validar datos requeridos
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName and lastName are required' },
        { status: 400 }
      )
    }

    logger.info('Updating user profile', { userId, firstName, lastName })

    // Usar el servicio de transacciones para completar el perfil
    const result = await TransactionService.completeUserProfile(userId, {
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      address,
      city,
      country
    })

    if (!result.success) {
      logger.error('Failed to complete user profile', {
        userId,
        error: result.error,
        rollbackPerformed: result.rollbackPerformed
      })

      return NextResponse.json({
        error: result.error || 'Failed to update profile',
        rollbackPerformed: result.rollbackPerformed
      }, { status: 500 })
    }

    logger.info('User profile completed successfully', {
      userId,
      roleResult: result.data.roleResult
    })

    return NextResponse.json({ 
      success: true,
      message: 'Profile updated successfully',
      user: result.data.profileData,
      roleResult: result.data.roleResult
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error('Error updating user profile', error as Error, {
      userId: (await auth()).userId
    })

    return NextResponse.json({
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 })
  }
}
