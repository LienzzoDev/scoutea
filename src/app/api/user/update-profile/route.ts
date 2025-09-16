import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { UserService } from '@/lib/services/user-service'

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
      nationality,
      dateOfBirth,
      location,
      bio,
      experience,
      specialization,
      languages,
      email
    } = body

    // Validar datos requeridos
    if (!firstName || !lastName || !nationality || !bio || !experience || !specialization) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verificar si el usuario existe, si no, crearlo
    let updatedUser
    try {
      updatedUser = await UserService.updateUser(userId, {
        firstName,
        lastName,
        nationality,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        location,
        bio,
        experience: parseInt(experience),
        specialization,
        languages,
        profileCompleted: true
      })
    } catch (error) {
      // Si el usuario no existe, crearlo
      if (error.code === 'P2025') {
        console.log('🔄 Usuario no encontrado, creándolo...')
        
        // Crear usuario con el email proporcionado
        updatedUser = await UserService.createUser({
          clerkId: userId,
          email: email || `temp-${userId}@scoutea.com`, // Usar email proporcionado o temporal
          firstName,
          lastName,
          nationality,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          location,
          bio,
          experience: parseInt(experience),
          specialization,
          languages,
          profileCompleted: true
        })
      } else {
        throw error
      }
    }

    // Actualizar metadatos de Clerk usando funciones integradas (más eficiente)
    try {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)
      const existingMetadata = user.publicMetadata || {}

      await clerk.users.updateUser(userId, {
        publicMetadata: {
          ...existingMetadata, // Preservar metadatos existentes
          role: 'member',
          profile: 'completed'
        }
      })

      console.log('✅ Clerk metadata updated successfully for user:', userId)
    } catch (error) {
      console.warn('Warning: Could not update Clerk metadata:', error)
    }

    return NextResponse.json({ 
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
