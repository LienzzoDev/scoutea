import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

import { ScoutPlayerService } from '@/lib/services/scout-player-service'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scoutId = searchParams.get('scoutId')

    if (!scoutId) {
      return NextResponse.json({ error: 'Scout ID requerido' }, { status: 400 })
    }

    const players = await ScoutPlayerService.getScoutPlayers(scoutId)

    return NextResponse.json({
      success: true,
      data: players,
      total: players.length,
    })
  } catch (error) {
    console.error('Error fetching scout players:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}