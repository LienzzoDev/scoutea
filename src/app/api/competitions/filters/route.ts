import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener países únicos que tienen competiciones
    const countries = await prisma.country.findMany({
      where: {
        competitions: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Obtener confederaciones únicas
    const confederationsResult = await prisma.competition.findMany({
      where: {
        confederation: {
          not: null,
        },
      },
      select: {
        confederation: true,
      },
      distinct: ['confederation'],
    })

    const confederations = confederationsResult
      .map(c => c.confederation)
      .filter((c): c is string => c !== null)
      .sort()

    return NextResponse.json({
      countries,
      confederations,
    })
  } catch (error) {
    console.error('Error getting filter options:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
