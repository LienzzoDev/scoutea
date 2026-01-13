import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { PLAYER_POSITIONS } from '@/constants/player-positions'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Caché en memoria para opciones (se refresca cada 5 minutos)
let cachedOptions: {
  nationalities: string[]
  teams: string[]
  competitions: string[]
  positions: string[]
  stats: {
    age: { min: number; max: number }
    rating: { min: number; max: number }
    value: { min: number; max: number }
  }
  timestamp: number
} | null = null

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function GET() {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // 📦 VERIFICAR CACHÉ
    if (cachedOptions && Date.now() - cachedOptions.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedOptions, { status: 200 })
    }

    // 📊 OBTENER DATOS
    const [
      nationalitiesResult,
      teamsResult,
      competitionsResult,
      statsResult
    ] = await Promise.all([
      // Nacionalidades únicas
      prisma.jugador.findMany({
        where: { approval_status: 'approved', is_visible: true, nationality_1: { not: null } },
        select: { nationality_1: true },
        distinct: ['nationality_1'],
        orderBy: { nationality_1: 'asc' }
      }),
      // Equipos únicos
      prisma.jugador.findMany({
        where: { approval_status: 'approved', is_visible: true, team_name: { not: null } },
        select: { team_name: true },
        distinct: ['team_name'],
        orderBy: { team_name: 'asc' }
      }),
      // Competiciones únicas
      prisma.jugador.findMany({
        where: { approval_status: 'approved', is_visible: true, team_competition: { not: null } },
        select: { team_competition: true },
        distinct: ['team_competition'],
        orderBy: { team_competition: 'asc' }
      }),
      // Estadísticas min/max
      prisma.jugador.aggregate({
        _min: { age: true, player_rating: true, player_trfm_value: true },
        _max: { age: true, player_rating: true, player_trfm_value: true },
        where: { approval_status: 'approved', is_visible: true }
      })
    ])

    // 📋 PROCESAR RESULTADOS
    const nationalities = nationalitiesResult
      .map(r => r.nationality_1)
      .filter((n): n is string => n !== null && n.trim() !== '')

    const teams = teamsResult
      .map(r => r.team_name)
      .filter((t): t is string => t !== null && t.trim() !== '')

    const competitions = competitionsResult
      .map(r => r.team_competition)
      .filter((c): c is string => c !== null && c.trim() !== '')

    // Usar posiciones del constante para consistencia con admin
    const positions = [...PLAYER_POSITIONS]

    const stats = {
      age: {
        min: statsResult._min.age || 15,
        max: statsResult._max.age || 45
      },
      rating: {
        min: statsResult._min.player_rating || 0,
        max: statsResult._max.player_rating || 100
      },
      value: {
        min: statsResult._min.player_trfm_value || 0,
        max: statsResult._max.player_trfm_value || 200000000
      }
    }

    // 💾 ACTUALIZAR CACHÉ
    cachedOptions = {
      nationalities,
      teams,
      competitions,
      positions,
      stats,
      timestamp: Date.now()
    }

    return NextResponse.json(cachedOptions, { status: 200 })

  } catch (error) {
    console.error('❌ Error fetching member filter options:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
