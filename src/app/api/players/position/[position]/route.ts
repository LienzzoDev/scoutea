import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { PlayerService } from '@/lib/services/player-service'

export async function GET(
  __request: NextRequest,
  { params }: { params: Promise<{ position: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { position } = await params
    const players = await PlayerService.getPlayersByPosition(position)
    
    return NextResponse.json(players)
  } catch (_error) {
    console.error('Error getting players by position:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}
