import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scoutId = params.id
    
    // Verificar si el scout existe
    const scout = await prisma.scout.findUnique({
      where: { id_scout: scoutId }
    })
    
    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }
    
    // Obtener reportes del scout
    const reports = await prisma.reporte.findMany({
      where: { scout_id: scoutId },
      select: {
        id_report: true,
        report_type: true,
        position_player: true,
        nationality_1: true,
        form_potential: true,
        initial_age: true,
        initial_competition_country: true,
        transfer_team_pts: true,
        initial_player_trfm_value: true,
        scout_id: true,
        player_name: true,
      }
    })
    
    return NextResponse.json({
      scout: {
        id: scout.id_scout,
        name: scout.scout_name,
        total_reports: scout.total_reports
      },
      reports: reports,
      reportCount: reports.length,
      sampleReport: reports[0] || null
    })
    
  } catch (error) {
    console.error('Error en debug:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}