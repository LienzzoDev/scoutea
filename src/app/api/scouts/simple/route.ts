import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || ''

    // Construir el where clause
    const where: any = {
      clerkId: { not: null } // Solo scouts con cuenta en Clerk
    }

    if (search) {
      where.OR = [
        { scout_name: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { surname: { contains: search, mode: 'insensitive' } },
        { nationality: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Obtener scouts con clerkId
    const scouts = await prisma.scout.findMany({
      where,
      take: limit * 2, // Obtener más para filtrar por rol después
      orderBy: { createdAt: 'desc' },
      select: {
        id_scout: true,
        clerkId: true,
        scout_name: true,
        name: true,
        surname: true,
        nationality: true,
        total_reports: true,
      }
    })

    // Filtrar solo scouts con rol "scout" en Clerk
    const client = await clerkClient()
    const validScouts = []

    for (const scout of scouts) {
      if (!scout.clerkId) continue

      try {
        const user = await client.users.getUser(scout.clerkId)
        const userRole = user.publicMetadata?.role as string | undefined

        // Solo incluir si tiene rol "scout"
        if (userRole === 'scout') {
          validScouts.push({
            id_scout: scout.id_scout,
            scout_name: scout.scout_name,
            name: scout.name,
            surname: scout.surname,
            nationality: scout.nationality,
            total_reports: scout.total_reports,
          })
        }

        // Limitar a la cantidad solicitada
        if (validScouts.length >= limit) break
      } catch (error) {
        console.warn(`Error fetching Clerk user for scout ${scout.id_scout}:`, error)
        // Continuar con el siguiente scout si hay error
        continue
      }
    }

    return NextResponse.json({
      success: true,
      data: validScouts
    })
  } catch (error) {
    console.error('Error getting scouts:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
