import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// GET: Obtener todas las correcciones de nombres de equipos
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where = search
      ? {
          OR: [
            { original_name: { contains: search, mode: 'insensitive' as const } },
            { corrected_name: { contains: search, mode: 'insensitive' as const } },
          ]
        }
      : {}

    const corrections = await prisma.teamNameCorrection.findMany({
      where,
      orderBy: { original_name: 'asc' }
    })

    return NextResponse.json({ corrections })
  } catch (error) {
    console.error('Error fetching team corrections:', error)
    return NextResponse.json(
      { __error: 'Error al obtener las correcciones de equipos' },
      { status: 500 }
    )
  }
}

// POST: Crear nueva corrección de nombre de equipo
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { original_name, corrected_name, reason } = body

    if (!original_name || !corrected_name) {
      return NextResponse.json(
        { __error: 'Nombre original y corregido son requeridos' },
        { status: 400 }
      )
    }

    const correction = await prisma.teamNameCorrection.create({
      data: {
        original_name: original_name.trim(),
        corrected_name: corrected_name.trim(),
        reason: reason?.trim() || null,
        created_by: userId
      }
    })

    return NextResponse.json({ correction }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating team correction:', error)

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { __error: 'Ya existe una corrección para este nombre de equipo' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { __error: 'Error al crear la corrección' },
      { status: 500 }
    )
  }
}
