import { NextRequest, NextResponse } from 'next/server'

import { PlayerStatsService, type CohortStatsFilters } from '@/lib/services/player-stats-service'
import { isValidPeriod, type StatsPeriod } from '@/lib/utils/stats-period-utils'

// Multi-select params llegan como CSV (p.ej. positions=CB,CM).
const parseCsv = (v: string | null): string[] => {
  if (!v) return []
  return v.split(',').map(s => s.trim()).filter(Boolean)
}

const parseIntParam = (v: string | null): number | undefined => {
  if (!v) return undefined
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : undefined
}

const parseFloatParam = (v: string | null): number | undefined => {
  if (!v) return undefined
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const periodParam = searchParams.get('period') || '3m'

    const { id: playerId } = await params

    if (!playerId) {
      return NextResponse.json({ __error: 'ID de jugador requerido' }, { status: 400 })
    }

    if (!isValidPeriod(periodParam)) {
      return NextResponse.json(
        { __error: 'Periodo inválido. Debe ser: 3m, 6m, 1y, o 2y' },
        { status: 400 }
      )
    }

    const period = periodParam as StatsPeriod

    // Construimos el objeto omitiendo claves cuyo valor es undefined para
    // cumplir con `exactOptionalPropertyTypes`.
    const filters: CohortStatsFilters = {}
    filters.positions = parseCsv(searchParams.get('positions'))
    filters.nationalities = parseCsv(searchParams.get('nationalities'))
    filters.competitions = parseCsv(searchParams.get('competitions'))
    const ageMin = parseIntParam(searchParams.get('ageMin'))
    if (ageMin !== undefined) filters.ageMin = ageMin
    const ageMax = parseIntParam(searchParams.get('ageMax'))
    if (ageMax !== undefined) filters.ageMax = ageMax
    const trfmMin = parseFloatParam(searchParams.get('trfmMin'))
    if (trfmMin !== undefined) filters.trfmMin = trfmMin
    const trfmMax = parseFloatParam(searchParams.get('trfmMax'))
    if (trfmMax !== undefined) filters.trfmMax = trfmMax

    const { stats, sampleSize } = await PlayerStatsService.getPlayerStatsFormattedWithCohort(
      playerId,
      period,
      filters
    )

    return NextResponse.json({
      success: true,
      data: stats,
      sampleSize,
      period,
    })
  } catch (error) {
    console.error('Error al obtener estadísticas del jugador:', error)
    return NextResponse.json({ __error: 'Error interno del servidor' }, { status: 500 })
  }
}
