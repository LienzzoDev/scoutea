import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserRoleInfo } from '@/lib/auth/role-utils'
import { prisma } from '@/lib/db'

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const user = await prisma.usuario.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ __error: 'User not found' }, { status: 404 })
    }

    const roleInfo = getUserRoleInfo({ publicMetadata: { role: 'admin' } })

    if (roleInfo.role !== 'admin') {
      return NextResponse.json(
        { __error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = approvalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { __error: 'Invalid request data', errors: validation.error.errors },
        { status: 400 }
      )
    }

    const { action, rejectionReason } = validation.data
    const playerId = params.id

    // Check if player exists and is pending
    const player = await prisma.jugador.findUnique({
      where: { id_player: playerId },
    })

    if (!player) {
      return NextResponse.json(
        { __error: 'Player not found' },
        { status: 404 }
      )
    }

    if (player.approval_status !== 'pending') {
      return NextResponse.json(
        { __error: 'Player is not pending approval' },
        { status: 400 }
      )
    }

    // Update player approval status
    const updatedPlayer = await prisma.jugador.update({
      where: { id_player: playerId },
      data: {
        approval_status: action === 'approve' ? 'approved' : 'rejected',
        approved_by_admin_id: userId,
        approval_date: new Date(),
        rejection_reason: action === 'reject' ? rejectionReason : null,
      },
    })

    return NextResponse.json({
      success: true,
      player: updatedPlayer,
      message:
        action === 'approve'
          ? 'Player approved successfully'
          : 'Player rejected',
    })
  } catch (error) {
    console.error('Error updating player approval:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}
