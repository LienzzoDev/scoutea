import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scoutId } = await params

    if (!scoutId) {
      return NextResponse.json({ error: 'Scout ID requerido' }, { status: 400 })
    }

    console.log('🔍 Fetching portfolio for scoutId:', scoutId)

    // Obtener todos los jugadores reportados por este scout (portafolio)
    const players = await prisma.jugador.findMany({
      where: {
        reportes: {
          some: {
            scout_id: scoutId
          }
        }
      },
      select: {
        id_player: true,
        player_name: true,
        date_of_birth: true,
        nationality_1: true,
        team_competition: true,
        position_player: true,
        player_rating: true,
        team_name: true,
        reportes: {
          where: {
            scout_id: scoutId
          },
          select: {
            id_report: true,
            report_date: true
          },
          orderBy: {
            report_date: 'desc'
          },
          take: 1
        }
      }
    })

    // Transformar los datos
    const portfolio = players.map(player => {
      let age = null
      if (player.date_of_birth) {
        const today = new Date()
        const birthDate = new Date(player.date_of_birth)
        age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
      }

      return {
        id_player: player.id_player,
        name: player.player_name,
        age: age ? `${age} Años` : 'N/A',
        nationality: player.nationality_1 || 'N/A',
        competition: player.team_competition || 'N/A',
        position: player.position_player || 'N/A',
        rating: player.player_rating || 0,
        team: player.team_name || 'N/A',
        totalReports: player.reportes.length,
        lastReportDate: player.reportes[0]?.report_date
      }
    })

    console.log('✅ Portfolio players found:', portfolio.length)

    return NextResponse.json({
      success: true,
      data: portfolio,
      total: portfolio.length
    })
  } catch (error) {
    console.error('❌ Error fetching scout portfolio:', error)
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
