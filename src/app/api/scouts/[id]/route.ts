import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Getting scout data for ID:', id)
    
    // Buscar el scout en la base de datos
    const scout = await prisma.scout.findUnique({
      where: { id_scout: id },
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        surname: true,
        country: true,
        nationality: true,
        age: true,
        date_of_birth: true,
        join_date: true,
        favourite_club: true,
        open_to_work: true,
        professional_experience: true,
        total_reports: true,
        original_reports: true,
        nationality_expertise: true,
        competition_expertise: true,
        avg_potential: true,
        avg_initial_age: true,
        
        // Economic fields with history
        total_investment: true,
        previous_total_investment: true,
        previous_total_investment_date: true,
        total_investment_change_percent: true,
        total_investment_last_updated: true,
        
        net_profits: true,
        previous_net_profits: true,
        previous_net_profits_date: true,
        net_profits_change_percent: true,
        net_profits_last_updated: true,
        
        roi: true,
        previous_roi: true,
        previous_roi_date: true,
        roi_change_percent: true,
        roi_last_updated: true,
        
        avg_initial_trfm_value: true,
        previous_avg_initial_trfm_value: true,
        previous_avg_initial_trfm_value_date: true,
        avg_initial_trfm_value_change_percent: true,
        avg_initial_trfm_value_last_updated: true,
        
        max_profit_report: true,
        previous_max_profit_report: true,
        previous_max_profit_report_date: true,
        max_profit_report_change_percent: true,
        max_profit_report_last_updated: true,
        
        min_profit_report: true,
        previous_min_profit_report: true,
        previous_min_profit_report_date: true,
        min_profit_report_change_percent: true,
        min_profit_report_last_updated: true,
        
        avg_profit_report: true,
        previous_avg_profit_report: true,
        previous_avg_profit_report_date: true,
        avg_profit_report_change_percent: true,
        avg_profit_report_last_updated: true,
        
        transfer_team_pts: true,
        previous_transfer_team_pts: true,
        previous_transfer_team_pts_date: true,
        transfer_team_pts_change_percent: true,
        transfer_team_pts_last_updated: true,
        
        avg_initial_team_level: true,
        
        transfer_competition_pts: true,
        previous_transfer_competition_pts: true,
        previous_transfer_competition_pts_date: true,
        transfer_competition_pts_change_percent: true,
        transfer_competition_pts_last_updated: true,
        
        avg_initial_competition_level: true,
        scout_level: true,
        scout_ranking: true,
        scout_elo: true
      }
    })

    if (!scout) {
      return NextResponse.json(
        { error: 'Scout not found', id },
        { status: 404 }
      )
    }

    // Formatear los datos del scout usando el tipo Scout completo
    const formattedScout = {
      id_scout: scout.id_scout,
      scout_name: scout.scout_name,
      name: scout.name,
      surname: scout.surname,
      country: scout.country,
      nationality: scout.nationality,
      age: scout.age,
      date_of_birth: scout.date_of_birth,
      join_date: scout.join_date,
      favourite_club: scout.favourite_club,
      open_to_work: scout.open_to_work,
      professional_experience: scout.professional_experience,
      total_reports: scout.total_reports,
      original_reports: scout.original_reports,
      nationality_expertise: scout.nationality_expertise,
      competition_expertise: scout.competition_expertise,
      avg_potential: scout.avg_potential,
      avg_initial_age: scout.avg_initial_age,
      
      // Economic fields with history
      total_investment: scout.total_investment,
      previous_total_investment: scout.previous_total_investment,
      previous_total_investment_date: scout.previous_total_investment_date,
      total_investment_change_percent: scout.total_investment_change_percent,
      total_investment_last_updated: scout.total_investment_last_updated,
      
      net_profits: scout.net_profits,
      previous_net_profits: scout.previous_net_profits,
      previous_net_profits_date: scout.previous_net_profits_date,
      net_profits_change_percent: scout.net_profits_change_percent,
      net_profits_last_updated: scout.net_profits_last_updated,
      
      roi: scout.roi,
      previous_roi: scout.previous_roi,
      previous_roi_date: scout.previous_roi_date,
      roi_change_percent: scout.roi_change_percent,
      roi_last_updated: scout.roi_last_updated,
      
      avg_initial_trfm_value: scout.avg_initial_trfm_value,
      previous_avg_initial_trfm_value: scout.previous_avg_initial_trfm_value,
      previous_avg_initial_trfm_value_date: scout.previous_avg_initial_trfm_value_date,
      avg_initial_trfm_value_change_percent: scout.avg_initial_trfm_value_change_percent,
      avg_initial_trfm_value_last_updated: scout.avg_initial_trfm_value_last_updated,
      
      max_profit_report: scout.max_profit_report,
      previous_max_profit_report: scout.previous_max_profit_report,
      previous_max_profit_report_date: scout.previous_max_profit_report_date,
      max_profit_report_change_percent: scout.max_profit_report_change_percent,
      max_profit_report_last_updated: scout.max_profit_report_last_updated,
      
      min_profit_report: scout.min_profit_report,
      previous_min_profit_report: scout.previous_min_profit_report,
      previous_min_profit_report_date: scout.previous_min_profit_report_date,
      min_profit_report_change_percent: scout.min_profit_report_change_percent,
      min_profit_report_last_updated: scout.min_profit_report_last_updated,
      
      avg_profit_report: scout.avg_profit_report,
      previous_avg_profit_report: scout.previous_avg_profit_report,
      previous_avg_profit_report_date: scout.previous_avg_profit_report_date,
      avg_profit_report_change_percent: scout.avg_profit_report_change_percent,
      avg_profit_report_last_updated: scout.avg_profit_report_last_updated,
      
      transfer_team_pts: scout.transfer_team_pts,
      previous_transfer_team_pts: scout.previous_transfer_team_pts,
      previous_transfer_team_pts_date: scout.previous_transfer_team_pts_date,
      transfer_team_pts_change_percent: scout.transfer_team_pts_change_percent,
      transfer_team_pts_last_updated: scout.transfer_team_pts_last_updated,
      
      avg_initial_team_level: scout.avg_initial_team_level,
      
      transfer_competition_pts: scout.transfer_competition_pts,
      previous_transfer_competition_pts: scout.previous_transfer_competition_pts,
      previous_transfer_competition_pts_date: scout.previous_transfer_competition_pts_date,
      transfer_competition_pts_change_percent: scout.transfer_competition_pts_change_percent,
      transfer_competition_pts_last_updated: scout.transfer_competition_pts_last_updated,
      
      avg_initial_competition_level: scout.avg_initial_competition_level,
      scout_level: scout.scout_level,
      scout_ranking: scout.scout_ranking,
      scout_elo: scout.scout_elo,
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('✅ Scout data found:', formattedScout.name)

    return NextResponse.json({
      success: true,
      scout: formattedScout
    })
  } catch (error) {
    console.error('❌ Error getting scout data:', error)
    return NextResponse.json(
      { 
        error: 'Error getting scout data',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}