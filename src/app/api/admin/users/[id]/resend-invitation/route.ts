import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { UserManagementService } from '@/lib/services/user-management-service'

/**
 * POST /api/admin/users/[id]/resend-invitation - Resend invitation
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify this is an invitation ID
    if (!id.startsWith('inv_')) {
      return NextResponse.json(
        { __error: 'Solo se pueden reenviar invitaciones pendientes' },
        { status: 400 }
      )
    }

    const result = await UserManagementService.resendInvitation(id)

    return NextResponse.json({
      success: true,
      message: `Invitación reenviada exitosamente a ${result.email}`,
      invitationId: result.invitationId,
    })
  } catch (error) {
    console.error('Error resending invitation:', error)

    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al reenviar invitación'

    return NextResponse.json(
      { __error: errorMessage },
      { status: 500 }
    )
  }
}
