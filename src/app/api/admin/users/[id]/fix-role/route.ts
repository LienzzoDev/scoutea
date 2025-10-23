import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { RoleService } from '@/lib/services/role-service'

/**
 * POST /api/admin/users/[id]/fix-role
 * Corrige el rol de un usuario basándose en su plan de suscripción
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: adminId } = await auth()
    if (!adminId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params

    // Obtener metadata actual del usuario
    const currentMetadata = await RoleService.getUserMetadata(userId)

    if (!currentMetadata) {
      return NextResponse.json(
        { __error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Determinar el rol correcto basado en el plan
    const plan = currentMetadata.subscription?.plan
    if (!plan) {
      return NextResponse.json(
        { __error: 'Usuario no tiene plan de suscripción' },
        { status: 400 }
      )
    }

    const correctRole = RoleService.getRoleFromPlan(plan)

    // Si el rol ya es correcto, no hacer nada
    if (currentMetadata.role === correctRole) {
      return NextResponse.json({
        message: 'El rol ya es correcto',
        userId,
        currentRole: currentMetadata.role,
        plan
      })
    }

    // Actualizar el rol
    const result = await RoleService.updateUserRole(
      userId,
      { role: correctRole },
      'admin_fix_role'
    )

    if (!result.success) {
      return NextResponse.json(
        { __error: result.error || 'Error al actualizar rol' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Rol corregido exitosamente',
      userId,
      previousRole: result.previousRole,
      newRole: result.newRole,
      plan
    })
  } catch (error) {
    console.error('Error fixing user role:', error)
    return NextResponse.json(
      { __error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}