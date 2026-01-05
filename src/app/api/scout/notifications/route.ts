import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// Constante para el tiempo de expiración de notificaciones (15 días en milisegundos)
const NOTIFICATION_EXPIRATION_DAYS = 15
const NOTIFICATION_EXPIRATION_MS = NOTIFICATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000

// GET - Obtener notificaciones del scout autenticado
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el scout asociado al usuario
    const scout = await prisma.scout.findUnique({
      where: { clerkId: userId },
      select: { id_scout: true }
    })

    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    // Eliminar notificaciones antiguas (mayores a 15 días)
    const expirationDate = new Date(Date.now() - NOTIFICATION_EXPIRATION_MS)
    await prisma.scoutNotification.deleteMany({
      where: {
        scout_id: scout.id_scout,
        createdAt: { lt: expirationDate }
      }
    })

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    // Obtener notificaciones (solo las que no han expirado)
    const notifications = await prisma.scoutNotification.findMany({
      where: {
        scout_id: scout.id_scout,
        ...(unreadOnly ? { read: false } : {})
      },
      include: {
        player: {
          select: {
            player_name: true,
            position_player: true,
            team_name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // Contar no leídas
    const unreadCount = await prisma.scoutNotification.count({
      where: {
        scout_id: scout.id_scout,
        read: false
      }
    })

    return NextResponse.json({
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Marcar notificaciones como leídas
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el scout asociado al usuario
    const scout = await prisma.scout.findUnique({
      where: { clerkId: userId },
      select: { id_scout: true }
    })

    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { notificationIds, markAll } = body as { notificationIds?: string[], markAll?: boolean }

    if (markAll) {
      // Marcar todas como leídas
      await prisma.scoutNotification.updateMany({
        where: {
          scout_id: scout.id_scout,
          read: false
        },
        data: {
          read: true,
          read_at: new Date()
        }
      })
    } else if (notificationIds && notificationIds.length > 0) {
      // Marcar específicas como leídas
      await prisma.scoutNotification.updateMany({
        where: {
          id: { in: notificationIds },
          scout_id: scout.id_scout // Asegurar que son del scout correcto
        },
        data: {
          read: true,
          read_at: new Date()
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
