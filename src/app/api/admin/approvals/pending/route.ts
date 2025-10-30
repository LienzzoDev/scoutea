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

    // Get pending reports with all necessary fields
    let pendingReports = []

    try {
      pendingReports = await prisma.reporte.findMany({
        where: {
          approval_status: 'pending',
        },
        select: {
          id_report: true,
          report_date: true,
          report_type: true,
          form_text_report: true,
          form_url_report: true,
          form_url_video: true,
          url_secondary: true,
          form_potential: true,
          roi: true,
          profit: true,
          potential: true,
          createdAt: true,
          player: {
            select: {
              id_player: true,
              player_name: true,
              position_player: true,
              team_name: true,
              nationality_1: true,
              age: true,
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
      reports: pendingReports,
      counts: {
        reports: pendingReports.length,
        total: pendingReports.length,
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
