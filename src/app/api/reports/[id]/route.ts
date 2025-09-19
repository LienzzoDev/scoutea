import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { ReportService } from '@/lib/services/report-service'

export async function GET(
  __request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const report = await ReportService.getReportById(params.id)
    
    if (!report) {
      return NextResponse.json({ __error: 'Report not found' }, { status: 404 })
    }
    
    return NextResponse.json(report)
  } catch (_error) {
    console.error('Error getting report:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  __request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const _body = await request.json()
    const report = await ReportService.updateReport(params.id, body)
    
    return NextResponse.json(report)
  } catch (_error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  __request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    await ReportService.deleteReport(params.id)
    
    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (_error) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}
