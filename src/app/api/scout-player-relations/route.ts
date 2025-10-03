import { NextRequest, NextResponse } from 'next/server'
import { ScoutPlayerService } from '@/lib/services/scout-player-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scoutId = searchParams.get('scoutId')
    const playerId = searchParams.get('playerId')
    const action = searchParams.get('action') || 'history'

    switch (action) {
      case 'scout-reports':
        if (!scoutId) {
          return NextResponse.json({ error: 'scoutId is required' }, { status: 400 })
        }
        const scoutReports = await ScoutPlayerService.getScoutReports(scoutId)
        return NextResponse.json(scoutReports)

      case 'player-reports':
        if (!playerId) {
          return NextResponse.json({ error: 'playerId is required' }, { status: 400 })
        }
        const playerReports = await ScoutPlayerService.getPlayerReports(playerId)
        return NextResponse.json(playerReports)

      case 'scout-stats':
        if (!scoutId) {
          return NextResponse.json({ error: 'scoutId is required' }, { status: 400 })
        }
        const stats = await ScoutPlayerService.getScoutPlayerStats(scoutId)
        return NextResponse.json(stats)

      case 'history':
      default:
        const history = await ScoutPlayerService.getScoutPlayerHistory(scoutId || undefined, playerId || undefined)
        return NextResponse.json(history)
    }
  } catch (error) {
    console.error('Error in scout-player-relations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scoutId, playerId, reportId, action } = body

    switch (action) {
      case 'create-relation':
        if (!scoutId || !playerId || !reportId) {
          return NextResponse.json(
            { error: 'scoutId, playerId, and reportId are required' },
            { status: 400 }
          )
        }
        const relation = await ScoutPlayerService.createScoutPlayerReport({
          scoutId,
          playerId,
          reportId
        })
        return NextResponse.json(relation, { status: 201 })

      case 'migrate-existing':
        const migrationResult = await ScoutPlayerService.migrateExistingReports()
        return NextResponse.json(migrationResult)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in scout-player-relations POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}