import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// GET: Obtener todas las correcciones de competiciones
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
            { country: { contains: search, mode: 'insensitive' as const } },
          ]
        }
      : {}

    const corrections = await prisma.competitionCorrection.findMany({
      where,
      orderBy: { original_name: 'asc' }
    })

    return NextResponse.json({ corrections })
  } catch (error) {
    console.error('Error fetching competition corrections:', error)
    return NextResponse.json(
      { __error: 'Error al obtener las correcciones de competiciones' },
      { status: 500 }
    )
  }
}

// POST: Crear nueva corrección de competición
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { original_name, corrected_name, country, reason } = body

    if (!original_name || !corrected_name) {
      return NextResponse.json(
        { __error: 'Nombre original y corregido son requeridos' },
        { status: 400 }
      )
    }

    const correction = await prisma.competitionCorrection.create({
      data: {
        original_name: original_name.trim(),
        corrected_name: corrected_name.trim(),
        country: country?.trim() || null,
        reason: reason?.trim() || null,
        created_by: userId
      }
    })

    return NextResponse.json({ correction }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating competition correction:', error)

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { __error: 'Ya existe una corrección para esta competición' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { __error: 'Error al crear la corrección' },
      { status: 500 }
    )
  }
}
