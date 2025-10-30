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

    console.log('🔍 Fetching detailed reports for scoutId:', scoutId)

    // Obtener el scout con su nombre
    const scout = await prisma.scout.findUnique({
      where: { id_scout: scoutId },
      select: {
        scout_name: true,
        name: true
      }
    })

    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    const scoutName = scout.name || scout.scout_name || 'Scout'

    // Obtener todos los reportes del scout con información detallada del jugador
    const reports = await prisma.reporte.findMany({
      where: {
        scout_id: scoutId
      },
      include: {
        player: {
          select: {
            id_player: true,
            player_name: true,
            date_of_birth: true,
            nationality_1: true,
            position_player: true,
            team_name: true
          }
        }
      },
      orderBy: {
        report_date: 'desc'
      }
    })

    // Transformar los datos
    const reportsDetail = reports.map(report => {
      let age = null
      if (report.player?.date_of_birth) {
        const today = new Date()
        const birthDate = new Date(report.player.date_of_birth)
        age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
      }

      // Determinar rating basado en métricas
      let rating = 0
      if (report.potential) {
        rating = Math.round(report.potential / 20) // Convertir potencial 0-100 a rating 0-5
      }

      return {
        id_report: report.id_report,
        id_player: report.player?.id_player || report.id_player,
        scoutName: scoutName,
        profileType: report.report_type || 'General',
        playerName: report.player?.player_name || report.player_name || 'Unknown',
        age: age ? `${age} Años` : 'N/A',
        nationality: report.player?.nationality_1 || report.nationality_1 || 'N/A',
        position: report.player?.position_player || report.position_player || 'N/A',
        team: report.player?.team_name || report.team_name || 'N/A',
        description: report.form_text_report || 'No description available',
        rating: rating,
        date: report.report_date ? new Date(report.report_date).toLocaleDateString('es-ES') : 'N/A',
        hasVideo: !!(report.form_url_video || report.url_secondary),
        videoUrl: report.form_url_video || report.url_secondary,
        reportUrl: report.form_url_report,
        roi: report.roi,
        profit: report.profit,
        potential: report.potential,
        approval_status: report.approval_status
      }
    })

    console.log('✅ Detailed reports found:', reportsDetail.length)

    return NextResponse.json({
      success: true,
      data: reportsDetail,
      total: reportsDetail.length
    })
  } catch (error) {
    console.error('❌ Error fetching scout reports:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
