/**
 * 📋 ENDPOINT PARA OPCIONES DE FILTROS DE JUGADORES
 *
 * ✅ PROPÓSITO: Obtener listas únicas para filtros (nacionalidades, equipos, competiciones)
 * ✅ BENEFICIO: Carga dinámica de opciones desde la base de datos
 * ✅ RUTA: GET /api/admin/players/filter-options
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Caché en memoria para opciones (se refresca cada 5 minutos)
let cachedOptions: {
  nationalities: string[]
  teams: string[]
  competitions: string[]
  timestamp: number
} | null = null

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function GET() {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden acceder.' },
        { status: 403 }
      )
    }

    // 📦 VERIFICAR CACHÉ
    if (cachedOptions && Date.now() - cachedOptions.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedOptions, { status: 200 })
    }

    // 📊 OBTENER VALORES ÚNICOS
    const [nationalitiesResult, teamsResult, competitionsResult] = await Promise.all([
      // Nacionalidades únicas
      prisma.jugador.findMany({
        where: {
          nationality_1: { not: null }
        },
        select: {
          nationality_1: true
        },
        distinct: ['nationality_1'],
        orderBy: {
          nationality_1: 'asc'
        }
      }),
      // Equipos únicos
      prisma.jugador.findMany({
        where: {
          team_name: { not: null }
        },
        select: {
          team_name: true
        },
        distinct: ['team_name'],
        orderBy: {
          team_name: 'asc'
        }
      }),
      // Competiciones únicas
      prisma.jugador.findMany({
        where: {
          team_competition: { not: null }
        },
        select: {
          team_competition: true
        },
        distinct: ['team_competition'],
        orderBy: {
          team_competition: 'asc'
        }
      })
    ])

    // 📋 EXTRAER VALORES NO NULOS
    const nationalities = nationalitiesResult
      .map(r => r.nationality_1)
      .filter((n): n is string => n !== null && n.trim() !== '')

    const teams = teamsResult
      .map(r => r.team_name)
      .filter((t): t is string => t !== null && t.trim() !== '')

    const competitions = competitionsResult
      .map(r => r.team_competition)
      .filter((c): c is string => c !== null && c.trim() !== '')

    // 💾 ACTUALIZAR CACHÉ
    cachedOptions = {
      nationalities,
      teams,
      competitions,
      timestamp: Date.now()
    }

    console.log('✅ Filter options loaded:', {
      nationalities: nationalities.length,
      teams: teams.length,
      competitions: competitions.length
    })

    return NextResponse.json({
      nationalities,
      teams,
      competitions
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error fetching filter options:', error)

    return NextResponse.json(
      { error: 'Error interno del servidor al obtener opciones de filtro.' },
      { status: 500 }
    )
  }
}
