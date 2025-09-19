import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { getOrCreateUser } from '@/lib/utils/user-sync'

// DELETE - Remover jugador de la lista
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { userId } = await auth()
    const { playerId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (!playerId) {
      return NextResponse.json({ error: 'ID del jugador requerido' }, { status: 400 })
    }

    // Obtener o crear el usuario en la base de datos
    let user
    try {
      user = await getOrCreateUser(userId)
    } catch (error) {
      console.error('❌ Error obteniendo/creando usuario en DELETE:', error)
      return NextResponse.json({ error: 'Error al obtener/crear usuario en la base de datos' }, { status: 500 })
    }

    // Buscar la entrada en la lista
    const playerListEntry = await prisma.playerList.findUnique({
      where: {
        userId_playerId: {
          userId: user.id,
          playerId: playerId
        }
      }
    })

    if (!playerListEntry) {
      return NextResponse.json({ error: 'El jugador no está en tu lista' }, { status: 404 })
    }

    // Eliminar de la lista
    await prisma.playerList.delete({
      where: {
        userId_playerId: {
          userId: user.id,
          playerId: playerId
        }
      }
    })

    return NextResponse.json({ message: 'Jugador removido de la lista exitosamente' })
  } catch (error) {
    console.error('Error removing player from list:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
