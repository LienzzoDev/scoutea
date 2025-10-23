import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { UserManagementService } from '@/lib/services/user-management-service'

const updateUserSchema = z.object({
  role: z.enum(['admin', 'member', 'scout', 'tester']).optional(),
  hasActiveSubscription: z.boolean().optional(),
})

/**
 * PATCH /api/admin/users/[id] - Update user role or subscription
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Update role if provided
    if (validatedData.role) {
      await UserManagementService.updateUserRole(id, validatedData.role)
    }

    // Update subscription if provided
    if (validatedData.hasActiveSubscription !== undefined) {
      await UserManagementService.updateUserSubscription(id, validatedData.hasActiveSubscription)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { __error: 'Datos inválidos', errors: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { __error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id] - Delete a user
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Prevent admin from deleting themselves
    if (id === userId) {
      return NextResponse.json(
        { __error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    await UserManagementService.deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)

    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar usuario'

    return NextResponse.json(
      { __error: errorMessage },
      { status: 500 }
    )
  }
}
