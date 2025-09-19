import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { getOrCreateUser } from '@/lib/utils/user-sync'

// GET - Obtener la lista de jugadores del usuario
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener o crear el usuario en la base de datos
    let user
    try {
      user = await getOrCreateUser(userId)
    } catch (error) {
      console.error('❌ Error obteniendo/creando usuario en GET:', error)
      // Si falla la creación, devolver lista vacía
      return NextResponse.json({ playerList: [] })
    }

    // Obtener la lista de jugadores del usuario
    const playerList = await prisma.playerList.findMany({
      where: { userId: user.id },
      include: {
        player: {
          select: {
            id_player: true,
            player_name: true,
            team_name: true,
            position_player: true,
            nationality_1: true,
            player_rating: true,
            photo_coverage: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ playerList })
  } catch (error) {
    console.error('Error fetching player list:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Añadir jugador a la lista
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando POST /api/player-list')
    
    const { userId } = await auth()
    console.log('👤 Usuario autenticado:', userId)

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { playerId } = await request.json()
    console.log('🎯 Player ID recibido:', playerId)

    if (!playerId) {
      return NextResponse.json({ error: 'ID del jugador requerido' }, { status: 400 })
    }

    // Obtener o crear el usuario en la base de datos
    console.log('🔍 Obteniendo/creando usuario...')
    let user
    try {
      user = await getOrCreateUser(userId)
      console.log('✅ Usuario obtenido/creado:', user.id)
    } catch (error) {
      console.error('❌ Error obteniendo/creando usuario en POST:', error)
      return NextResponse.json({ 
        error: 'Error al obtener/crear usuario en la base de datos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 })
    }

    // Verificar que el jugador existe
    console.log('🔍 Verificando si el jugador existe...')
    const player = await prisma.jugador.findUnique({
      where: { id_player: playerId },
      select: { id_player: true }
    })

    if (!player) {
      console.log('❌ Jugador no encontrado:', playerId)
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }
    console.log('✅ Jugador encontrado:', player.id_player)

    // Verificar si ya está en la lista
    console.log('🔍 Verificando si ya está en la lista...')
    const existingEntry = await prisma.playerList.findUnique({
      where: {
        userId_playerId: {
          userId: user.id,
          playerId: playerId
        }
      }
    })

    if (existingEntry) {
      console.log('⚠️ Jugador ya está en la lista')
      return NextResponse.json({ error: 'El jugador ya está en tu lista' }, { status: 400 })
    }

    // Añadir a la lista
    console.log('➕ Añadiendo jugador a la lista...')
    const playerList = await prisma.playerList.create({
      data: {
        userId: user.id,
        playerId: playerId
      },
      include: {
        player: {
          select: {
            id_player: true,
            player_name: true,
            team_name: true,
            position_player: true,
            nationality_1: true,
            player_rating: true,
            photo_coverage: true,
          }
        }
      }
    })

    console.log('✅ Jugador añadido exitosamente a la lista')
    return NextResponse.json({ playerList })
  } catch (error) {
    console.error('❌ Error adding player to list:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
