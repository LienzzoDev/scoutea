import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Buscar el scout en la base de datos
    const scout = await prisma.scout.findUnique({
      where: { id_scout: id },
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        surname: true,
        // Reports
        total_reports: true,
        original_reports: true,
        // Portfolio metrics
        avg_potential: true,
        avg_initial_age: true,
        // Financial metrics
        total_investment: true,
        net_profits: true,
        roi: true,
        // Profit metrics
        avg_initial_trfm_value: true,
        max_profit_report: true,
        min_profit_report: true,
        avg_profit_report: true,
        // Transfer points
        transfer_team_pts: true,
        transfer_competition_pts: true,
        // Rankings
        scout_ranking: true,
        scout_level: true,
      },
    })

    if (!scout) {
      return NextResponse.json(
        { success: false, error: 'Scout not found' },
        { status: 404 }
      )
    }

    // Formatear nombre del scout
    const scoutName =
      scout.scout_name || `${scout.name || ''} ${scout.surname || ''}`.trim() || 'Unknown'

    return NextResponse.json({
      success: true,
      data: {
        id_scout: scout.id_scout,
        scout_name: scoutName,
        // Reports
        total_reports: scout.total_reports,
        original_reports: scout.original_reports,
        // Portfolio metrics
        avg_potential: scout.avg_potential,
        avg_initial_age: scout.avg_initial_age,
        // Financial metrics
        total_investment: scout.total_investment,
        net_profits: scout.net_profits,
        roi: scout.roi,
        // Profit metrics
        avg_initial_trfm_value: scout.avg_initial_trfm_value,
        max_profit_report: scout.max_profit_report,
        min_profit_report: scout.min_profit_report,
        avg_profit_report: scout.avg_profit_report,
        // Transfer points
        transfer_team_pts: scout.transfer_team_pts,
        transfer_competition_pts: scout.transfer_competition_pts,
        // Rankings
        scout_ranking: scout.scout_ranking,
        scout_level: scout.scout_level,
      },
    })
  } catch (error) {
    console.error('Error getting scout stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error getting scout stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
