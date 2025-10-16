import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

const reportTypes = ['Scouting Report', 'Performance Analysis', 'Potential Assessment', 'Transfer Recommendation']
const potentialLevels = ['High', 'Medium', 'Low']
const ageRanges = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]
const countries = ['Spain', 'Brazil', 'Italy', 'Germany', 'France', 'England', 'Argentina', 'Portugal']
const competitions = ['La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Premier League', 'Brasileirão']
const positions = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper']
const nationalities = ['Spain', 'Brazil', 'Italy', 'Germany', 'France', 'England', 'Argentina', 'Portugal']

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scoutId = params.id
    
    // Verificar que el scout existe
    const scout = await prisma.scout.findUnique({
      where: { id_scout: scoutId }
    })
    
    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }
    
    // Obtener algunos jugadores existentes o crear algunos básicos
    const players = await prisma.jugador.findMany({ take: 10 })
    
    if (players.length === 0) {
      // Crear algunos jugadores básicos si no existen
      const samplePlayers = [
        { player_name: 'João Santos', position_player: 'Forward', nationality_1: 'Brazil', team_name: 'Santos FC' },
        { player_name: 'Pablo García', position_player: 'Midfielder', nationality_1: 'Spain', team_name: 'Valencia CF' },
        { player_name: 'Luca Rossi', position_player: 'Defender', nationality_1: 'Italy', team_name: 'AC Milan' },
        { player_name: 'Thomas Müller Jr', position_player: 'Forward', nationality_1: 'Germany', team_name: 'Bayern Munich II' },
        { player_name: 'Antoine Dubois', position_player: 'Midfielder', nationality_1: 'France', team_name: 'Lyon' },
      ]
      
      for (const playerData of samplePlayers) {
        const player = await prisma.jugador.create({ data: playerData })
        players.push(player)
      }
    }
    
    // Crear reportes para este scout
    const numReports = 25 // Crear 25 reportes
    let createdReports = 0
    
    for (let i = 0; i < numReports; i++) {
      const randomPlayer = players[Math.floor(Math.random() * players.length)]
      const randomReportType = reportTypes[Math.floor(Math.random() * reportTypes.length)]
      const randomPotential = potentialLevels[Math.floor(Math.random() * potentialLevels.length)]
      const randomAge = ageRanges[Math.floor(Math.random() * ageRanges.length)]
      const randomCountry = countries[Math.floor(Math.random() * countries.length)]
      const randomCompetition = competitions[Math.floor(Math.random() * competitions.length)]
      const randomPosition = positions[Math.floor(Math.random() * positions.length)]
      const randomNationality = nationalities[Math.floor(Math.random() * nationalities.length)]
      
      // Generar datos financieros realistas
      const initialValue = Math.floor(Math.random() * 30000000) + 5000000 // Entre 5M y 35M
      const currentValue = initialValue + (Math.floor(Math.random() * 20000000) - 10000000) // Variación de -10M a +10M
      const roi = ((currentValue - initialValue) / initialValue) * 100
      const profit = currentValue - initialValue

      const reportDate = new Date()
      reportDate.setDate(reportDate.getDate() - Math.floor(Math.random() * 365)) // Último año

      await prisma.reporte.create({
        data: {
          report_status: 'Completed',
          report_validation: 'Validated',
          report_author: scout.scout_name,
          scout_id: scoutId,
          report_date: reportDate,
          report_type: randomReportType,
          id_player: randomPlayer.id_player,
          player_name: randomPlayer.player_name || `Player ${i + 1}`,
          position_player: randomPosition,
          nationality_1: randomNationality,
          team_name: randomPlayer.team_name || `Team ${i + 1}`,
          initial_age: randomAge,
          form_potential: randomPotential,
          initial_competition: randomCompetition,
          initial_competition_country: randomCountry,
          initial_player_trfm_value: initialValue,
          player_trfm_value: currentValue,
          roi: roi,
          profit: profit,
          transfer_team_pts: Math.floor(Math.random() * 40) + 60, // Entre 60 y 100
          transfer_competition_pts: Math.floor(Math.random() * 40) + 60, // Entre 60 y 100
          initial_team: randomPlayer.team_name || `Team ${i + 1}`,
          initial_team_level: Math.random() > 0.5 ? 'Elite' : Math.random() > 0.5 ? 'Professional' : 'Amateur',
          initial_competition_level: Math.random() > 0.5 ? 'Top Tier' : Math.random() > 0.5 ? 'Second Tier' : 'Third Tier'
        }
      })
      
      createdReports++
    }
    
    return NextResponse.json({
      success: true,
      message: `Reportes creados para ${scout.scout_name}`,
      data: {
        scoutId: scoutId,
        scoutName: scout.scout_name,
        reportsCreated: createdReports
      }
    })
    
  } catch (error) {
    console.error('Error poblando scout:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al poblar datos del scout',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}