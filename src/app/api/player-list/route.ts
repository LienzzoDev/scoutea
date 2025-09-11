import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

// GET - Obtener la lista de jugadores del usuario
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.usuario.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    })

    if (!user) {
      console.log('Usuario no encontrado en la base de datos:', userId)
      // Si el usuario no existe, devolver lista vacía en lugar de error
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
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { playerId } = await request.json()

    if (!playerId) {
      return NextResponse.json({ error: 'ID del jugador requerido' }, { status: 400 })
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.usuario.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    })

    if (!user) {
      console.log('Usuario no encontrado en la base de datos para POST:', userId)
      return NextResponse.json({ error: 'Usuario no encontrado en la base de datos' }, { status: 404 })
    }

    // Verificar que el jugador existe
    const player = await prisma.jugador.findUnique({
      where: { id_player: playerId },
      select: { id_player: true }
    })

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    // Verificar si ya está en la lista
    const existingEntry = await prisma.playerList.findUnique({
      where: {
        userId_playerId: {
          userId: user.id,
          playerId: playerId
        }
      }
    })

    if (existingEntry) {
      return NextResponse.json({ error: 'El jugador ya está en tu lista' }, { status: 400 })
    }

    // Añadir a la lista
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

    return NextResponse.json({ playerList })
  } catch (error) {
    console.error('Error adding player to list:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
