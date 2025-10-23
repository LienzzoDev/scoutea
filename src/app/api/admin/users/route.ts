import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { UserManagementService } from '@/lib/services/user-management-service'

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  role: z.enum(['admin', 'member', 'scout', 'tester']),
  redirectUrl: z.string().url().optional(),
})

/**
 * GET /api/admin/users - List all users and pending invitations
 * Also syncs users from Clerk to database
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    // Sync users from Clerk to database first
    try {
      await UserManagementService.syncUsersToDatabase()
    } catch (syncError) {
      console.error('Error syncing users (continuing anyway):', syncError)
      // Continue even if sync fails - we can still show Clerk data
    }

    // Get users and pending invitations
    const users = await UserManagementService.listUsersAndInvitations()

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { __error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users - Create a new user invitation
 * Sends an invitation email to the user automatically
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Create invitation in Clerk (automatically sends email)
    const invitation = await UserManagementService.createUser(validatedData)

    return NextResponse.json({
      invitation,
      message: 'Invitación enviada exitosamente. El usuario recibirá un email con instrucciones.'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { __error: 'Datos inválidos', errors: error.errors },
        { status: 400 }
      )
    }

    // Check for Clerk-specific errors
    if (error && typeof error === 'object' && 'errors' in error) {
      const clerkError = error as { errors: Array<{ code: string; message: string; meta?: any }> }
      const firstError = clerkError.errors[0]
      const errorMessage = firstError?.message || 'Error al enviar invitación'
      const errorCode = firstError?.code

      // Handle specific error codes
      if (errorCode === 'form_identifier_exists' || errorCode === 'identifier_exists') {
        return NextResponse.json({
          __error: 'Este email ya ha sido invitado o ya existe en la plataforma. Si deseas reenviar la invitación, primero elimina la invitación pendiente desde el dashboard de Clerk.'
        }, { status: 400 })
      }

      if (errorCode === 'duplicate_record' || errorMessage.toLowerCase().includes('duplicate')) {
        return NextResponse.json({
          __error: 'Ya existe una invitación pendiente para este email. Espera a que expire (30 días) o revócala desde Clerk Dashboard.'
        }, { status: 400 })
      }

      return NextResponse.json({ __error: errorMessage }, { status: 400 })
    }

    return NextResponse.json(
      { __error: 'Error al enviar invitación' },
      { status: 500 }
    )
  }
}