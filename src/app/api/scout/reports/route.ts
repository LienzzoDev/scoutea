import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scoutId = searchParams.get('scoutId')

    if (!scoutId) {
      return NextResponse.json({ error: 'Scout ID requerido' }, { status: 400 })
    }

    // Optional: verify authentication for additional security
    // But allow public access when scoutId is provided (for member area)
    const { userId } = await auth()
    console.log('📋 Fetching reports for scoutId:', scoutId, 'by user:', userId || 'public')

    // Obtener todos los reportes del scout con información del jugador
    const reports = await prisma.reporte.findMany({
      where: {
        scout_id: scoutId
      },
      include: {
        player: {
          select: {
            id_player: true,
            player_name: true,
            position_player: true,
            nationality_1: true,
            team_name: true,
            date_of_birth: true
          }
        }
      },
      orderBy: {
        report_date: 'desc'
      }
    })

    console.log('Found reports:', reports.length)

    // Transformar los datos para incluir edad calculada
    const reportsWithAge = reports.map(report => {
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

      return {
        id_report: report.id_report,
        report_date: report.report_date,
        report_type: report.report_type,
        form_text_report: report.form_text_report,
        form_url_report: report.form_url_report,
        form_url_video: report.form_url_video,
        form_potential: report.form_potential,
        roi: report.roi,
        profit: report.profit,
        approval_status: report.approval_status,
        initial_player_trfm_value: report.initial_player_trfm_value,
        player: {
          id_player: report.player?.id_player || report.id_player || '',
          player_name: report.player?.player_name || 'Unknown',
          position_player: report.player?.position_player,
          nationality_1: report.player?.nationality_1,
          team_name: report.player?.team_name,
          age
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: reportsWithAge,
      total: reportsWithAge.length,
    })
  } catch (error) {
    console.error('Error fetching scout reports:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
