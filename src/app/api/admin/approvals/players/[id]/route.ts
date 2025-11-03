import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Get user role from Clerk (using public_metadata with underscore)
    const { sessionClaims } = await auth()
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role

    if (userRole !== 'admin') {
      return NextResponse.json(
        {
          __error: 'Forbidden: Admin access required'
        },
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
    const { id: playerId } = await params

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
        approved_by_admin_id: user.id_usuario,
        approval_date: new Date(),
        rejection_reason: action === 'reject' ? rejectionReason || null : null,
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
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack)
    }
    return NextResponse.json(
      {
        __error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
