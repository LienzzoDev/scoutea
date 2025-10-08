import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scoutId = searchParams.get('scoutId')

    if (!scoutId) {
      return NextResponse.json({ error: 'Scout ID requerido' }, { status: 400 })
    }

    // Get scout stats
    const [totalReports, totalPlayers] = await Promise.all([
      prisma.reporte.count({
        where: { scout_id: scoutId }
      }),
      prisma.player.count({
        where: {
          reporte: {
            some: {
              scout_id: scoutId
            }
          }
        }
      })
    ])

    const stats = {
      totalReports,
      totalPlayers
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching scout stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}