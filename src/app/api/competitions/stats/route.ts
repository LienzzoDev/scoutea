import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { CompetitionService } from '@/lib/services/competition-service'

export async function GET(__request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await CompetitionService.getCompetitionStats()
    
    return NextResponse.json(stats)
  } catch (_error) {
    console.error('Error getting competition stats:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}
