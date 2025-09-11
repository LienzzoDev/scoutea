import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PlayerService } from '@/lib/db/player-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamName: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamName } = await params
    const players = await PlayerService.getPlayersByTeam(teamName)
    
    return NextResponse.json(players)
  } catch (error) {
    console.error('Error getting players by team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
