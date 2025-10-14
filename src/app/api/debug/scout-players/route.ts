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

    console.log('🔍 DEBUG: Checking scout players for scoutId:', scoutId)

    // 1. Verificar que el scout existe
    const scout = await prisma.scout.findUnique({
      where: { id_scout: scoutId }
    })

    console.log('🔍 DEBUG: Scout exists:', !!scout)

    // 2. Contar reportes del scout
    const reportCount = await prisma.reporte.count({
      where: { scout_id: scoutId }
    })

    console.log('🔍 DEBUG: Total reports:', reportCount)

    // 3. Obtener reportes con info del jugador
    const reports = await prisma.reporte.findMany({
      where: { scout_id: scoutId },
      select: {
        id_report: true,
        id_player: true,
        report_date: true,
      },
      include: {
        player: {
          select: {
            player_name: true,
          },
        },
      },
      take: 5
    })

    console.log('🔍 DEBUG: Sample reports:', reports)

    // 4. Intentar obtener jugadores con reportes
    const players = await prisma.jugador.findMany({
      where: {
        reportes: {
          some: {
            scout_id: scoutId
          }
        }
      },
      include: {
        reportes: {
          where: {
            scout_id: scoutId
          },
          take: 1
        }
      },
      take: 5
    })

    console.log('🔍 DEBUG: Players found:', players.length)

    return NextResponse.json({
      success: true,
      debug: {
        scoutExists: !!scout,
        scoutId: scoutId,
        totalReports: reportCount,
        sampleReports: reports,
        playersFound: players.length,
        samplePlayers: players.map(p => ({
          id: p.id_player,
          name: p.player_name,
          reports: p.reportes.length
        }))
      },
      data: players
    })
  } catch (error) {
    console.error('❌ DEBUG: Error:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
