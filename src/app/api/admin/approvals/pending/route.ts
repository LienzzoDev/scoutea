import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role from Clerk session claims
    const publicMetadata = sessionClaims?.public_metadata as { role?: string } | undefined
    const userRole = publicMetadata?.role

    // Only admins can access this endpoint
    if (userRole !== 'admin') {
      console.error('Access denied: User role is', userRole, 'but admin required')
      return NextResponse.json(
        { __error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get pending players
    let pendingPlayers = []
    let pendingReports = []

    try {
      pendingPlayers = await prisma.jugador.findMany({
        where: {
          approval_status: 'pending',
        },
        select: {
          id_player: true,
          player_name: true,
          position_player: true,
          team_name: true,
          nationality_1: true,
          age: true,
          created_by_scout_id: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } catch (error) {
      console.error('Error fetching pending players:', error)
    }

    // Get pending reports
    try {
      pendingReports = await prisma.reporte.findMany({
        where: {
          approval_status: 'pending',
        },
        include: {
          player: {
            select: {
              id_player: true,
              player_name: true,
              position_player: true,
              team_name: true,
            },
          },
          scout: {
            select: {
              id_scout: true,
              scout_name: true,
              name: true,
              surname: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } catch (error) {
      console.error('Error fetching pending reports:', error)
    }

    return NextResponse.json({
      players: pendingPlayers,
      reports: pendingReports,
      counts: {
        players: pendingPlayers.length,
        reports: pendingReports.length,
        total: pendingPlayers.length + pendingReports.length,
      },
    })
  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}
