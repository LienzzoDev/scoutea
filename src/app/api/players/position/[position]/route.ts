import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { PlayerService } from '@/lib/services/player-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ position: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { position } = await params
    const players = await PlayerService.getPlayersByPosition(position)
    
    return NextResponse.json(players)
  } catch (error) {
    console.error('Error getting players by position:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
