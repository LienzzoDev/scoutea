import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { ScoutService } from '@/lib/services/scout-service'

export async function GET(__request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const scouts = await ScoutService.getAvailableScouts()
    
    return NextResponse.json(scouts)
  } catch (_error) {
    console.error('Error getting available scouts:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}
