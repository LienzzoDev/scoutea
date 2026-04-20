// 🔧 ENDPOINT DE FILTROS DISPONIBLES
// ✅ PROPÓSITO: Devuelve opciones disponibles para filtros (posiciones, equipos, etc.)
// ✅ BENEFICIO: Los dropdowns se llenan automáticamente con datos reales
// ✅ RUTA: GET /api/players/filters

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { cachedQuery, cache as memoryCache, MemoryCacheService } from '@/lib/cache/memory-cache'
import { prisma } from '@/lib/db'

// Define FilterOption interface locally
interface FilterOption {
  value: string
  label: string
  count: number
}

interface FilterOptions {
  positions: FilterOption[]
  nationalities: FilterOption[]
  teams: FilterOption[]
  competitions: FilterOption[]
}

// Get available filters from database
async function getAvailableFilters(): Promise<FilterOptions> {
  // Fetch distinct values
  const [positions, nationalities, teams, competitions] = await Promise.all([
    prisma.jugador.findMany({
      select: { position_player: true },
      distinct: ['position_player'],
      where: { position_player: { not: null } }
    }),
    prisma.jugador.findMany({
      select: { nationality_1: true },
      distinct: ['nationality_1'],
      where: { nationality_1: { not: null } }
    }),
    prisma.jugador.findMany({
      select: { team_name: true },
      distinct: ['team_name'],
      where: { team_name: { not: null } }
    }),
    prisma.jugador.findMany({
      select: { team_competition: true },
      distinct: ['team_competition'],
      where: { team_competition: { not: null } }
    })
  ])

  return {
    positions: positions.map(p => ({
      value: p.position_player || '',
      label: p.position_player || '',
      count: 1 // Count not available with distinct
    })),
    nationalities: nationalities.map(n => ({
      value: n.nationality_1 || '',
      label: n.nationality_1 || '',
      count: 1
    })),
    teams: teams.map(t => ({
      value: t.team_name || '',
      label: t.team_name || '',
      count: 1
    })),
    competitions: competitions.map(c => ({
      value: c.team_competition || '',
      label: c.team_competition || '',
      count: 1
    }))
  }
}

/**
 * 🔧 GET /api/players/filters - OBTENER OPCIONES DISPONIBLES PARA FILTROS
 * 
 * ✅ QUÉ HACE: Devuelve todas las opciones disponibles para dropdowns de filtros
 * ✅ POR QUÉ: Los filtros se llenan automáticamente con datos reales del sistema
 * ✅ EJEMPLO: GET /api/players/filters
 * 
 * @param request - Request HTTP (puede incluir parámetros opcionales)
 * @returns Opciones para todos los filtros disponibles
 */
export async function GET(request: NextRequest): Promise<NextResponse<FilterOptions | { error: string }>> {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para acceder a los filtros.' },
        { status: 401 }
      )
    }

    // 📋 OBTENER PARÁMETROS OPCIONALES
    const { searchParams } = new URL(request.url)
    
    // 🔢 PARÁMETRO: Incluir conteos (por defecto: true)
    const includeCounts = searchParams.get('include_counts') !== 'false'
    
    // 🔢 PARÁMETRO: Conteo mínimo para incluir opción (por defecto: 1)
    const minCountParam = searchParams.get('min_count')
    const minCount = minCountParam ? parseInt(minCountParam) : 1

    // ✅ VALIDAR PARÁMETROS
    if (minCount < 0 || minCount >1000) {
      return NextResponse.json(
        { error: 'El parámetro min_count debe estar entre 0 y 1000.' },
        { status: 400 }
      )
    }

    // 📊 LOG DE SOLICITUD
    console.log('🔧 Generating filter options:', {
      requestedBy: userId,
      includeCounts,
      minCount,
      timestamp: new Date().toISOString()
    })

    // ⏱️ MEDIR TIEMPO DE RESPUESTA
    const startTime = Date.now()

    // 🚀 OBTENER OPCIONES DE FILTROS DEL SERVICIO (CON CACHÉ)
    const filterOptions = await cachedQuery<FilterOptions>(
      'filters:all',
      () => getAvailableFilters(),
      MemoryCacheService.TTL.FILTERS
    )

    const responseTime = Date.now() - startTime

    // 🔍 FILTRAR OPCIONES SEGÚN PARÁMETROS
    const filteredOptions: FilterOptions = {
      // 🎯 FILTRAR POSICIONES POR CONTEO MÍNIMO
      positions: filterOptions.positions
        .filter(pos => pos.count >= minCount)
        .sort((a, b) => b.count - a.count) // Ordenar por cantidad (más populares primero)
        .map(pos => includeCounts ? pos : { value: pos.value, label: pos.label, count: 0 }),

      // 🌍 FILTRAR NACIONALIDADES POR CONTEO MÍNIMO
      nationalities: filterOptions.nationalities
        .filter(nat => nat.count >= minCount)
        .sort((a, b) => b.count - a.count)
        .map(nat => includeCounts ? nat : { value: nat.value, label: nat.label, count: 0 }),

      // ⚽ FILTRAR EQUIPOS POR CONTEO MÍNIMO
      teams: filterOptions.teams
        .filter(team => team.count >= minCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 100) // Limitar a top 100 equipos para performance
        .map(team => includeCounts ? team : { value: team.value, label: team.label, count: 0 }),

      // 🏆 FILTRAR COMPETICIONES POR CONTEO MÍNIMO
      competitions: filterOptions.competitions
        .filter(comp => comp.count >= minCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 50) // Limitar a top 50 competiciones
        .map(comp => includeCounts ? comp : { value: comp.value, label: comp.label, count: 0 })
    }

    // 📊 CALCULAR ESTADÍSTICAS DE RESPUESTA
    const totalOptions = 
      filteredOptions.positions.length +
      filteredOptions.nationalities.length +
      filteredOptions.teams.length +
      filteredOptions.competitions.length

    // 📊 LOG DE RESULTADO
    console.log('✅ Filter options generated successfully:', {
      totalOptions,
      positions: filteredOptions.positions.length,
      nationalities: filteredOptions.nationalities.length,
      teams: filteredOptions.teams.length,
      competitions: filteredOptions.competitions.length,
      responseTimeMs: responseTime,
      requestedBy: userId,
      timestamp: new Date().toISOString()
    })

    // 📤 CREAR RESPUESTA CON HEADERS ÚTILES
    const response = NextResponse.json(filteredOptions)
    
    // 🏷️ HEADERS INFORMATIVOS
    response.headers.set('X-Total-Options', totalOptions.toString())
    response.headers.set('X-Generated-At', new Date().toISOString())
    response.headers.set('X-Response-Time-Ms', responseTime.toString())
    response.headers.set('X-Min-Count-Filter', minCount.toString())
    
    // 🕒 CACHE HEADERS (cachear por 10 minutos ya que los filtros no cambian frecuentemente)
    response.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=300')
    response.headers.set('ETag', `"filters-${Date.now()}"`)

    return response

  } catch (error) {
    // 🚨 MANEJO DE ERRORES
    console.error('❌ Error generating filter options:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: (await auth()).userId,
      timestamp: new Date().toISOString()
    })

    // 🔍 DETECTAR ERRORES ESPECÍFICOS
    if (error instanceof Error) {
      // 🗄️ ERROR DE BASE DE DATOS
      if (error.message.includes('database') || error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Error de conexión con la base de datos. Los filtros no están disponibles temporalmente.' },
          { status: 503 } // Service Unavailable
        )
      }

      // 📊 ERROR DE AGREGACIÓN (consultas GROUP BY complejas)
      if (error.message.includes('aggregate') || error.message.includes('group')) {
        return NextResponse.json(
          { error: 'Error al procesar los datos de filtros. Por favor, inténtalo de nuevo.' },
          { status: 500 }
        )
      }
    }

    // 📤 ERROR GENÉRICO
    return NextResponse.json(
      { error: 'Error interno del servidor. No se pudieron generar las opciones de filtros.' },
      { status: 500 }
    )
  }
}

/**
 * 🔄 POST /api/players/filters - REFRESCAR FILTROS (SOLO ADMINS)
 * 
 * ✅ QUÉ HACE: Fuerza la regeneración de opciones de filtros
 * ✅ POR QUÉ: Útil después de añadir muchos jugadores nuevos
 * ✅ EJEMPLO: POST /api/players/filters
 * 
 * @param request - Request HTTP
 * @returns Opciones de filtros recién calculadas
 */
export async function POST(_request: NextRequest): Promise<NextResponse<FilterOptions | { error: string }>> {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS DE ADMIN
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // 👮‍♂️ SOLO ADMINS PUEDEN FORZAR REFRESH
    const userRole = sessionClaims?.public_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden refrescar filtros.' },
        { status: 403 }
      )
    }

    // 📊 LOG DE ACCIÓN ADMINISTRATIVA
    console.log('🔄 Admin forcing filter options refresh:', {
      adminId: userId,
      timestamp: new Date().toISOString()
    })

    // 🗑️ INVALIDAR CACHÉ DE FILTROS
    memoryCache.delete('filters:all')

    // ⏱️ MEDIR TIEMPO DE REGENERACIÓN
    const startTime = Date.now()

    // 🚀 GENERAR FILTROS FRESCOS (sin caché, se volverá a cachear en el próximo GET)
    const freshFilters = await getAvailableFilters()

    const responseTime = Date.now() - startTime

    // 📊 CALCULAR ESTADÍSTICAS
    const totalOptions = 
      freshFilters.positions.length +
      freshFilters.nationalities.length +
      freshFilters.teams.length +
      freshFilters.competitions.length

    // 📊 LOG DE RESULTADO
    console.log('✅ Filter options refreshed successfully by admin:', {
      totalOptions,
      positions: freshFilters.positions.length,
      nationalities: freshFilters.nationalities.length,
      teams: freshFilters.teams.length,
      competitions: freshFilters.competitions.length,
      responseTimeMs: responseTime,
      refreshedBy: userId,
      timestamp: new Date().toISOString()
    })

    // 📤 DEVOLVER FILTROS FRESCOS
    const response = NextResponse.json(freshFilters)
    
    // 🏷️ HEADERS PARA INDICAR QUE SON DATOS FRESCOS
    response.headers.set('X-Total-Options', totalOptions.toString())
    response.headers.set('X-Refreshed-At', new Date().toISOString())
    response.headers.set('X-Response-Time-Ms', responseTime.toString())
    response.headers.set('X-Refreshed-By', 'admin')
    response.headers.set('Cache-Control', 'no-cache') // No cachear datos forzados

    return response

  } catch (error) {
    // 🚨 MANEJO DE ERRORES
    console.error('❌ Error refreshing filter options:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: (await auth()).userId,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: 'Error interno del servidor. No se pudieron refrescar las opciones de filtros.' },
      { status: 500 }
    )
  }
}







