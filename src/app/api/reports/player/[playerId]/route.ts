import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { ReportService } from '@/lib/services/report-service'

export async function GET(
  __request: NextRequest,
  { params }: { params: { _playerId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const reports = await ReportService.getReportsByPlayer(params.playerId)
    
    return NextResponse.json(reports)
  } catch (_error) {
    console.error('Error getting reports by ___player: ', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}
