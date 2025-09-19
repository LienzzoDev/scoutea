import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { ScoutService } from '@/lib/services/scout-service'

export async function GET(__request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const scouts = await ScoutService.getScoutRanking(limit)
    
    return NextResponse.json(scouts)
  } catch (_error) {
    console.error('Error getting scout ranking:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}
