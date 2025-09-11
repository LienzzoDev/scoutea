// 👤 ENDPOINT INDIVIDUAL DE JUGADOR
// ✅ PROPÓSITO: Maneja operaciones con un jugador específico (ver, editar, eliminar)
// ✅ BENEFICIO: Permite operaciones CRUD completas en jugadores individuales
// ✅ RUTAS: GET, PUT, DELETE /api/players/[id]

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PlayerService } from '@/lib/services/player-service'
import { 
  validatePlayerId, 
  validatePlayerUpdate
} from '@/lib/validation/player-schema'
import type { Player } from '@/types/player'

/**
 * 👁️ GET /api/players/[id] - OBTENER JUGADOR POR ID
 * 
 * ✅ QUÉ HACE: Busca y devuelve un jugador específico por su ID
 * ✅ POR QUÉ: Para mostrar perfiles detallados de jugadores
 * ✅ EJEMPLO: GET /api/players/player_123
 * 
 * @param request - Request HTTP
 * @param params - Parámetros de la URL (contiene el ID)
 * @returns El jugador encontrado o error 404 si no existe
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<Player | { error: string }>> {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para ver jugadores.' }, 
        { status: 401 }
      )
    }

    // 🛡️ VALIDAR ID DEL JUGADOR
    let validatedId: string
    try {
      validatedId = validatePlayerId(params.id)
    } catch (validationError) {
      return NextResponse.json(
        { error: `ID inválido: ${validationError instanceof Error ? validationError.message : 'Formato de ID incorrecto'}` },
        { status: 400 }
      )
    }

    // 🔍 BUSCAR JUGADOR EN BASE DE DATOS
    const player = await PlayerService.getPlayerById(validatedId)
    
    // ❌ VERIFICAR SI EL JUGADOR EXISTE
    if (!player) {
      return NextResponse.json(
        { error: `No se encontró ningún jugador con ID: ${validatedId}` }, 
        { status: 404 }
      )
    }

    // 📊 LOG DE ACCESO (para auditoría)
    console.log('✅ Player accessed:', {
      playerId: player.id_player,
      playerName: player.player_name,
      accessedBy: userId,
      timestamp: new Date().toISOString()
    })

    // 📤 DEVOLVER JUGADOR ENCONTRADO
    return NextResponse.json(player)

  } catch (error) {
    // 🚨 MANEJO DE ERRORES
    console.error('❌ Error getting player:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      playerId: params.id,
      userId: (await auth()).userId,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.' },
      { status: 500 }
    )
  }
}

/**
 * ✏️ PUT /api/players/[id] - ACTUALIZAR JUGADOR
 * 
 * ✅ QUÉ HACE: Actualiza los datos de un jugador existente
 * ✅ POR QUÉ: Para mantener la información de jugadores actualizada
 * ✅ EJEMPLO: PUT /api/players/player_123 con body { "player_rating": 85 }
 * 
 * @param request - Request con datos a actualizar
 * @param params - Parámetros de la URL (contiene el ID)
 * @returns El jugador actualizado
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<Player | { error: string }>> {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para actualizar jugadores.' }, 
        { status: 401 }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN (solo admins pueden actualizar)
    const userRole = sessionClaims?.public_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden actualizar jugadores.' },
        { status: 403 }
      )
    }

    // 🛡️ VALIDAR ID DEL JUGADOR
    let validatedId: string
    try {
      validatedId = validatePlayerId(params.id)
    } catch (validationError) {
      return NextResponse.json(
        { error: `ID inválido: ${validationError instanceof Error ? validationError.message : 'Formato de ID incorrecto'}` },
        { status: 400 }
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

    // 🛡️ VALIDAR DATOS DE ACTUALIZACIÓN CON ZOD
    let validatedData
    try {
      validatedData = validatePlayerUpdate(requestBody)
    } catch (validationError) {
      return NextResponse.json(
        { error: `Datos inválidos: ${validationError instanceof Error ? validationError.message : 'Error de validación'}` },
        { status: 400 }
      )
    }

    // 🔍 VERIFICAR QUE EL JUGADOR EXISTE ANTES DE ACTUALIZAR
    const existingPlayer = await PlayerService.getPlayerById(validatedId)
    if (!existingPlayer) {
      return NextResponse.json(
        { error: `No se encontró ningún jugador con ID: ${validatedId}` },
        { status: 404 }
      )
    }

    // ✏️ ACTUALIZAR JUGADOR
    const updatedPlayer = await PlayerService.updatePlayer(validatedId, validatedData)

    // 📊 LOG DE AUDITORÍA
    console.log('✅ Player updated successfully:', {
      playerId: updatedPlayer.id_player,
      playerName: updatedPlayer.player_name,
      updatedFields: Object.keys(validatedData),
      updatedBy: userId,
      timestamp: new Date().toISOString()
    })

    // 📤 DEVOLVER JUGADOR ACTUALIZADO
    return NextResponse.json(updatedPlayer)

  } catch (error) {
    // 🚨 MANEJO DE ERRORES ESPECÍFICOS
    console.error('❌ Error updating player:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      playerId: params.id,
      userId: (await auth()).userId,
      timestamp: new Date().toISOString()
    })

    // 🔍 DETECTAR ERRORES ESPECÍFICOS
    if (error instanceof Error) {
      // 🚫 ERROR DE DUPLICADO
      if (error.message.includes('Unique constraint') || error.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Los datos proporcionados entran en conflicto con otro jugador existente.' },
          { status: 409 }
        )
      }

      // 🔗 ERROR DE RELACIÓN
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Error de referencia de datos. Verifica que todos los datos relacionados existan.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.' },
      { status: 500 }
    )
  }
}

/**
 * 🗑️ DELETE /api/players/[id] - ELIMINAR JUGADOR
 * 
 * ✅ QUÉ HACE: Elimina permanentemente un jugador de la base de datos
 * ✅ POR QUÉ: Para limpiar datos obsoletos o incorrectos
 * ⚠️ CUIDADO: Esta operación es irreversible
 * ✅ EJEMPLO: DELETE /api/players/player_123
 * 
 * @param request - Request HTTP
 * @param params - Parámetros de la URL (contiene el ID)
 * @returns Confirmación de eliminación exitosa
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: boolean; message: string } | { error: string }>> {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para eliminar jugadores.' }, 
        { status: 401 }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN (solo admins pueden eliminar)
    const userRole = sessionClaims?.public_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden eliminar jugadores.' },
        { status: 403 }
      )
    }

    // 🛡️ VALIDAR ID DEL JUGADOR
    let validatedId: string
    try {
      validatedId = validatePlayerId(params.id)
    } catch (validationError) {
      return NextResponse.json(
        { error: `ID inválido: ${validationError instanceof Error ? validationError.message : 'Formato de ID incorrecto'}` },
        { status: 400 }
      )
    }

    // 🔍 VERIFICAR QUE EL JUGADOR EXISTE ANTES DE ELIMINAR
    const existingPlayer = await PlayerService.getPlayerById(validatedId)
    if (!existingPlayer) {
      return NextResponse.json(
        { error: `No se encontró ningún jugador con ID: ${validatedId}` },
        { status: 404 }
      )
    }

    // 📊 GUARDAR INFORMACIÓN PARA LOG ANTES DE ELIMINAR
    const playerInfo = {
      id: existingPlayer.id_player,
      name: existingPlayer.player_name,
      team: existingPlayer.team_name
    }

    // 🗑️ ELIMINAR JUGADOR
    await PlayerService.deletePlayer(validatedId)

    // 📊 LOG DE AUDITORÍA (CRÍTICO para eliminaciones)
    console.log('🗑️ Player deleted successfully:', {
      playerId: playerInfo.id,
      playerName: playerInfo.name,
      playerTeam: playerInfo.team,
      deletedBy: userId,
      timestamp: new Date().toISOString()
    })

    // 📤 CONFIRMAR ELIMINACIÓN EXITOSA
    return NextResponse.json({
      success: true,
      message: `Jugador "${playerInfo.name}" eliminado exitosamente.`
    })

  } catch (error) {
    // 🚨 MANEJO DE ERRORES
    console.error('❌ Error deleting player:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      playerId: params.id,
      userId: (await auth()).userId,
      timestamp: new Date().toISOString()
    })

    // 🔍 DETECTAR ERRORES ESPECÍFICOS
    if (error instanceof Error) {
      // 🔗 ERROR DE RELACIÓN (jugador referenciado en otras tablas)
      if (error.message.includes('Foreign key constraint') || error.message.includes('referenced')) {
        return NextResponse.json(
          { error: 'No se puede eliminar el jugador porque está referenciado en otros registros. Elimina primero las referencias.' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.' },
      { status: 500 }
    )
  }
}