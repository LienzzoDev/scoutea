import { NextResponse } from 'next/server'

import { TournamentService } from '@/lib/services/tournament-service'

export async function GET() {
  try {
    const competiciones = await TournamentService.getCompeticiones()
    return NextResponse.json(competiciones)
  } catch (error) {
    console.error('Error fetching competiciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
