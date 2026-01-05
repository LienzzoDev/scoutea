import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || ''

    // Verificar si es admin
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    const isAdmin = userRole === 'admin'

    // Construir el where clause
    const where: Record<string, unknown> = {}

    // Si no es admin, solo mostrar scouts con clerkId
    if (!isAdmin) {
      where.clerkId = { not: null }
    }

    if (search) {
      where.OR = [
        { scout_name: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { surname: { contains: search, mode: 'insensitive' } },
        { nationality: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Obtener scouts
    const scouts = await prisma.scout.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        surname: true,
        nationality: true,
        total_reports: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: scouts
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
