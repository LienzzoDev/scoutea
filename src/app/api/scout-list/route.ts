import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// GET /api/scout-list - Obtener lista de scouts del usuario
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { __error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Buscar usuario en la base de datos
    const user = await prisma.usuario.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json(
        { __error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener lista de scouts del usuario
    const scoutList = await prisma.scoutList.findMany({
      where: { userId: user.id },
      include: {
        scout: {
          select: {
            id_scout: true,
            scout_name: true,
            name: true,
            surname: true,
            nationality: true,
            scout_level: true,
            scout_elo: true,
            total_reports: true,
            url_profile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ scoutList })
  } catch (_error) {
    console.error('Error getting scout list:', error)
    return NextResponse.json(
      { __error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/scout-list - Añadir scout a la lista
export async function POST(__request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { __error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { scoutId } = await request.json()

    if (!scoutId) {
      return NextResponse.json(
        { __error: 'ID de scout requerido' },
        { status: 400 }
      )
    }

    // Buscar usuario en la base de datos
    const user = await prisma.usuario.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json(
        { __error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el scout existe
    const scout = await prisma.scout.findUnique({
      where: { id_scout: scoutId }
    })

    if (!scout) {
      return NextResponse.json(
        { __error: 'Scout no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya está en la lista
    const existingEntry = await prisma.scoutList.findUnique({
      where: {
        userId_scoutId: {
          userId: user.id,
          scoutId: scoutId
        }
      }
    })

    if (existingEntry) {
      return NextResponse.json(
        { __error: 'El scout ya está en tu lista' },
        { status: 409 }
      )
    }

    // Añadir a la lista
    const scoutList = await prisma.scoutList.create({
      data: {
        userId: user.id,
        scoutId: scoutId
      },
      include: {
        scout: {
          select: {
            id_scout: true,
            scout_name: true,
            name: true,
            surname: true,
            nationality: true,
            scout_level: true,
            scout_elo: true,
            total_reports: true,
            url_profile: true
          }
        }
      }
    })

    return NextResponse.json({ scoutList }, { status: 201 })
  } catch (_error) {
    console.error('Error adding scout to list:', error)
    return NextResponse.json(
      { __error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}