// 📊 ENDPOINT DE ESTADÍSTICAS DE JUGADORES
// ✅ PROPÓSITO: Proporciona datos para dashboards y análisis
// ✅ BENEFICIO: Los admins pueden ver métricas del sistema en tiempo real
// ✅ RUTA: GET /api/players/stats

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { PlayerService } from '@/lib/services/player-service'
import type { PlayerStats } from '@/types/player'

/**
 * 📈 GET /api/players/stats - OBTENER ESTADÍSTICAS GENERALES
 * 
 * ✅ QUÉ HACE: Calcula y devuelve métricas generales del sistema de jugadores
 * ✅ POR QUÉ: Los dashboards necesitan datos agregados para mostrar el estado del sistema
 * ✅ EJEMPLO: GET /api/players/stats
 * 
 * @param request - Request HTTP (puede incluir parámetros de filtro opcionales)
 * @returns Estadísticas completas del sistema de jugadores
 */
export async function GET(__request: NextRequest): Promise<NextResponse<PlayerStats | { _error: string }>> {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { __error: 'No autorizado. Debes iniciar sesión para ver estadísticas.' }, 
        { status: 401 }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS (solo usuarios autenticados pueden ver stats básicas)
    // Los admins pueden ver estadísticas más detalladas
    const userRole = sessionClaims?.public_metadata?.role
    const isAdmin = userRole === 'admin'

    // 📊 OBTENER ESTADÍSTICAS DEL SERVICIO
    console.log('📊 Generating player statistics...', {
      requestedBy: userId,
      userRole: userRole || 'member',
      timestamp: new Date().toISOString()
    })

    // ⏱️ MEDIR TIEMPO DE RESPUESTA PARA OPTIMIZACIÓN
    const startTime = Date.now()
    
    const stats = await PlayerService.getPlayerStats()
    
    const responseTime = Date.now() - startTime

    // 📊 LOG DE PERFORMANCE (para monitoreo)
    console.log('✅ Player statistics generated successfully:', {
      totalPlayers: stats.totalPlayers,
      averageRating: stats.averageRating,
      responseTimeMs: responseTime,
      requestedBy: userId,
      timestamp: new Date().toISOString()
    })

    // 🔒 FILTRAR DATOS SEGÚN PERMISOS
    // Los miembros regulares ven estadísticas básicas
    // Los admins ven estadísticas completas
    const filteredStats: PlayerStats = isAdmin ? stats : {
      // 📊 ESTADÍSTICAS BÁSICAS PARA MIEMBROS
      totalPlayers: stats.totalPlayers,
      averageRating: stats.averageRating,
      playersByPosition: stats.playersByPosition.slice(0, 5), // Solo top 5 posiciones
      playersByNationality: stats.playersByNationality.slice(0, 10), // Solo top 10 países
      topRatedPlayers: stats.topRatedPlayers.slice(0, 5) // Solo top 5 jugadores
    }

    // 📊 AÑADIR METADATOS ÚTILES
    const response = NextResponse.json(filteredStats)
    
    // 🏷️ HEADERS INFORMATIVOS
    response.headers.set('X-Stats-Generated-At', new Date().toISOString())
    response.headers.set('X-Response-Time-Ms', responseTime.toString())
    response.headers.set('X-User-Role', userRole || 'member')
    response.headers.set('Cache-Control', 'public, max-age=300') // Cache por 5 minutos

    return response

  } catch (_error) {
    // 🚨 MANEJO DE ERRORES
    console.error('❌ Error generating player statistics:', {
      __error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: (await auth()).userId,
      timestamp: new Date().toISOString()
    })

    // 🔍 DETECTAR ERRORES ESPECÍFICOS
    if (error instanceof Error) {
      // 🗄️ ERROR DE BASE DE DATOS
      if (error.message.includes('database') || error.message.includes('connection')) {
        return NextResponse.json(
          { __error: 'Error de conexión con la base de datos. Las estadísticas no están disponibles temporalmente.' },
          { status: 503 } // Service Unavailable
        )
      }

      // ⏱️ ERROR DE TIMEOUT
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { __error: 'La consulta de estadísticas está tardando demasiado. Por favor, inténtalo de nuevo.' },
          { status: 408 } // Request Timeout
        )
      }
    }

    // 📤 ERROR GENÉRICO
    return NextResponse.json(
      { __error: 'Error interno del servidor. No se pudieron generar las estadísticas.' },
      { status: 500 }
    )
  }
}

/**
 * 🔄 POST /api/players/stats - REFRESCAR ESTADÍSTICAS (SOLO ADMINS)
 * 
 * ✅ QUÉ HACE: Fuerza la regeneración de estadísticas (útil después de cambios masivos)
 * ✅ POR QUÉ: Los admins pueden necesitar estadísticas actualizadas inmediatamente
 * ✅ EJEMPLO: POST /api/players/stats
 * 
 * @param request - Request HTTP
 * @returns Estadísticas recién calculadas
 */
export async function POST(_request: NextRequest): Promise<NextResponse<PlayerStats | { _error: string }>> {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS DE ADMIN
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { __error: 'No autorizado. Debes iniciar sesión.' }, 
        { status: 401 }
      )
    }

    // 👮‍♂️ SOLO ADMINS PUEDEN FORZAR REFRESH
    const userRole = sessionClaims?.public_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { __error: 'Acceso denegado. Solo los administradores pueden refrescar estadísticas.' },
        { status: 403 }
      )
    }

    // 📊 LOG DE ACCIÓN ADMINISTRATIVA
    console.log('🔄 Admin forcing statistics refresh:', {
      adminId: userId,
      timestamp: new Date().toISOString()
    })

    // ⏱️ MEDIR TIEMPO DE REGENERACIÓN
    const startTime = Date.now()
    
    // 🚀 GENERAR ESTADÍSTICAS FRESCAS (sin caché)
    const freshStats = await PlayerService.getPlayerStats()
    
    const responseTime = Date.now() - startTime

    // 📊 LOG DE RESULTADO
    console.log('✅ Statistics refreshed successfully by admin:', {
      totalPlayers: freshStats.totalPlayers,
      averageRating: freshStats.averageRating,
      responseTimeMs: responseTime,
      refreshedBy: userId,
      timestamp: new Date().toISOString()
    })

    // 📤 DEVOLVER ESTADÍSTICAS FRESCAS
    const response = NextResponse.json(freshStats)
    
    // 🏷️ HEADERS PARA INDICAR QUE SON DATOS FRESCOS
    response.headers.set('X-Stats-Refreshed-At', new Date().toISOString())
    response.headers.set('X-Response-Time-Ms', responseTime.toString())
    response.headers.set('X-Refreshed-By', 'admin')
    response.headers.set('Cache-Control', 'no-cache') // No cachear datos forzados

    return response

  } catch (_error) {
    // 🚨 MANEJO DE ERRORES
    console.error('❌ Error refreshing player statistics:', {
      __error: error instanceof Error ? error.message : 'Unknown error',
      adminId: (await auth()).userId,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { __error: 'Error interno del servidor. No se pudieron refrescar las estadísticas.' },
      { status: 500 }
    )
  }
}