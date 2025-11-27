import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { ReportService } from '@/lib/services/report-service'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role
    if (role !== 'admin') {
      return NextResponse.json({ __error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const orphanStats = await ReportService.countOrphanReports()

    return NextResponse.json(orphanStats)
  } catch (error) {
    console.error('Error counting orphan reports:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role
    if (role !== 'admin') {
      return NextResponse.json({ __error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const result = await ReportService.deleteOrphanReports()

    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      message: `${result.deleted} reportes huérfanos eliminados`
    })
  } catch (error) {
    console.error('Error deleting orphan reports:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}
