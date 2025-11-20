import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// GET: Obtener todas las correcciones de ligas
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
            { national_tier: { contains: search, mode: 'insensitive' as const } },
            { rename_national_tier: { contains: search, mode: 'insensitive' as const } },
            { country: { contains: search, mode: 'insensitive' as const } },
          ]
        }
      : {}

    const corrections = await prisma.leagueCorrection.findMany({
      where,
      orderBy: { national_tier: 'asc' }
    })

    return NextResponse.json({ corrections })
  } catch (error) {
    console.error('Error fetching league corrections:', error)
    return NextResponse.json(
      { __error: 'Error al obtener las correcciones de ligas' },
      { status: 500 }
    )
  }
}

// POST: Crear nueva corrección de liga
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { national_tier, rename_national_tier, country } = body

    if (!national_tier || !rename_national_tier || !country) {
      return NextResponse.json(
        { __error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const correction = await prisma.leagueCorrection.create({
      data: {
        national_tier: national_tier.trim(),
        rename_national_tier: rename_national_tier.trim(),
        country: country.trim(),
        created_by: userId
      }
    })

    return NextResponse.json({ correction }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating league correction:', error)

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { __error: 'Ya existe una corrección para esta liga' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { __error: 'Error al crear la corrección' },
      { status: 500 }
    )
  }
}
