/**
 * Main Players API Endpoint
 * 
 * Handles player searches and creation operations.
 * Replaces the duplicate /api/jugadores API.
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { PlayerService } from '@/lib/services/player-service'
import { 
  validatePlayerSearch, 
  validatePlayerCreate
} from '@/lib/validation/player-schema'
import type { PlayerSearchResult, Player } from '@/types/player'

/**
 * GET /api/players - Search players with filters and pagination
 * 
 * @param request - Request with search parameters
 * @returns Paginated list of players matching the criteria
 * 
 * @example
 * GET /api/players?page=1&limit=20&filters[position_player]=CF
 */
export async function GET(request: NextRequest): Promise<NextResponse<PlayerSearchResult | { error: string }>> {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para acceder a los jugadores.' }, 
        { status: 401 }
      )
    }

    // 📋 OBTENER Y VALIDAR PARÁMETROS DE CONSULTA
    const { searchParams } = new URL(request.url)
    
    // 🛡️ CONVERTIR URLSearchParams A OBJETO PARA VALIDACIÓN
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    // ✅ VALIDAR PARÁMETROS CON ZOD
    let validatedParams
    try {
      validatedParams = validatePlayerSearch(params)
    } catch (validationError) {
      return NextResponse.json(
        { error: `Parámetros inválidos: ${validationError instanceof Error ? validationError.message : 'Error de validación'}` },
        { status: 400 }
      )
    }

    // 🔄 CONVERTIR PARÁMETROS VALIDADOS AL FORMATO DEL SERVICIO
    const searchOptions = {
      page: validatedParams.page,
      limit: validatedParams.limit,
      sortBy: validatedParams.sortBy,
      sortOrder: validatedParams.sortOrder,
      filters: {
        // 🔍 EXTRAER FILTROS DEL OBJETO VALIDADO
        player_name: validatedParams['filters[player_name]'],
        position_player: validatedParams['filters[position_player]'],
        team_name: validatedParams['filters[team_name]'],
        nationality_1: validatedParams['filters[nationality_1]'],
        min_age: validatedParams['filters[min_age]'],
        max_age: validatedParams['filters[max_age]'],
        min_rating: validatedParams['filters[min_rating]'],
        max_rating: validatedParams['filters[max_rating]'],
        on_loan: validatedParams['filters[on_loan]']
      }
    }

    // 🚀 REALIZAR BÚSQUEDA USANDO EL SERVICIO CONSOLIDADO
    const result = await PlayerService.searchPlayers(searchOptions)

    // 📊 AÑADIR HEADERS ÚTILES PARA EL CLIENTE
    const response = NextResponse.json(result)
    response.headers.set('X-Total-Count', result.pagination.total.toString())
    response.headers.set('X-Page', result.pagination.page.toString())
    response.headers.set('X-Total-Pages', result.pagination.totalPages.toString())

    return response

  } catch (error) {
    // 🚨 MANEJO DE ERRORES ROBUSTO
    console.error('❌ Error searching players:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: (await auth()).userId,
      timestamp: new Date().toISOString()
    })

    // 📤 DEVOLVER ERROR GENÉRICO (sin exponer detalles internos)
    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.' },
      { status: 500 }
    )
  }
}

/**
 * ➕ POST /api/players - CREAR NUEVO JUGADOR
 * 
 * ✅ QUÉ HACE: Crea un nuevo jugador en la base de datos
 * ✅ POR QUÉ: Permite a los admins añadir nuevos jugadores al sistema
 * ✅ EJEMPLO: POST /api/players con body { "player_name": "Nuevo Jugador", "age": 20 }
 * 
 * @param request - Request con datos del nuevo jugador
 * @returns El jugador creado con su ID asignado
 */
export async function POST(request: NextRequest): Promise<NextResponse<Player | { error: string }>> {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para crear jugadores.' }, 
        { status: 401 }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN (solo admins pueden crear jugadores)
    const userRole = sessionClaims?.public_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden crear jugadores.' },
        { status: 403 }
      )
    }

    // 📝 OBTENER Y VALIDAR DATOS DEL BODY
    let requestBody
    try {
      requestBody = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Datos inválidos. El body debe ser JSON válido.' },
        { status: 400 }
      )
    }

    // 🛡️ VALIDAR DATOS CON ZOD
    let validatedData
    try {
      validatedData = validatePlayerCreate(requestBody)
    } catch (validationError) {
      return NextResponse.json(
        { error: `Datos inválidos: ${validationError instanceof Error ? validationError.message : 'Error de validación'}` },
        { status: 400 }
      )
    }

    // ➕ CREAR JUGADOR USANDO EL SERVICIO
    const newPlayer = await PlayerService.createPlayer(validatedData)

    // 📊 LOG DE AUDITORÍA
    console.log('✅ Player created successfully:', {
      playerId: newPlayer.id_player,
      playerName: newPlayer.player_name,
      createdBy: userId,
      timestamp: new Date().toISOString()
    })

    // 📤 DEVOLVER JUGADOR CREADO
    return NextResponse.json(newPlayer, { status: 201 })

  } catch (error) {
    // 🚨 MANEJO DE ERRORES ESPECÍFICOS
    console.error('❌ Error creating player:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: (await auth()).userId,
      timestamp: new Date().toISOString()
    })

    // 🔍 DETECTAR ERRORES ESPECÍFICOS DE BASE DE DATOS
    if (error instanceof Error) {
      // 🚫 ERROR DE DUPLICADO (nombre de usuario ya existe)
      if (error.message.includes('Unique constraint') || error.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Ya existe un jugador con ese nombre. Por favor, usa un nombre diferente.' },
          { status: 409 }
        )
      }

      // 🔗 ERROR DE RELACIÓN (referencia a datos que no existen)
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Error de referencia de datos. Verifica que todos los datos relacionados existan.' },
          { status: 400 }
        )
      }
    }

    // 📤 ERROR GENÉRICO
    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.' },
      { status: 500 }
    )
  }
}
