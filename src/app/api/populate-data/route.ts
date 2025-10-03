import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Datos de ejemplo para poblar
const sampleScouts = [
  {
    scout_name: 'Carlos Rodriguez',
    name: 'Carlos',
    surname: 'Rodriguez',
    nationality: 'Spain',
    email: 'carlos.rodriguez@scout.com',
    country: 'Spain',
    favourite_club: 'Real Madrid',
    open_to_work: true,
    total_reports: 45,
    original_reports: 38,
    avg_potential: 7.8,
    avg_initial_age: 22.5,
    roi: 15.2,
    net_profits: 2500000,
    scout_level: 'Elite',
    scout_ranking: 12,
    nationality_expertise: 'Spain',
    competition_expertise: 'La Liga'
  },
  {
    scout_name: 'Maria Silva',
    name: 'Maria',
    surname: 'Silva',
    nationality: 'Brazil',
    email: 'maria.silva@scout.com',
    country: 'Brazil',
    favourite_club: 'Flamengo',
    open_to_work: true,
    total_reports: 32,
    original_reports: 29,
    avg_potential: 8.1,
    avg_initial_age: 20.8,
    roi: 22.7,
    net_profits: 1800000,
    scout_level: 'Professional',
    scout_ranking: 8,
    nationality_expertise: 'Brazil',
    competition_expertise: 'Serie A'
  }
]

const samplePlayers = [
  {
    player_name: 'João Santos',
    position_player: 'Forward',
    nationality_1: 'Brazil',
    team_name: 'Santos FC',
    player_rating: 78.5,
    player_trfm_value: 15000000
  },
  {
    player_name: 'Pablo García',
    position_player: 'Midfielder',
    nationality_1: 'Spain',
    team_name: 'Valencia CF',
    player_rating: 82.1,
    player_trfm_value: 25000000
  },
  {
    player_name: 'Luca Rossi',
    position_player: 'Defender',
    nationality_1: 'Italy',
    team_name: 'AC Milan',
    player_rating: 79.8,
    player_trfm_value: 18000000
  },
  {
    player_name: 'Thomas Müller Jr',
    position_player: 'Forward',
    nationality_1: 'Germany',
    team_name: 'Bayern Munich II',
    player_rating: 75.2,
    player_trfm_value: 12000000
  },
  {
    player_name: 'Antoine Dubois',
    position_player: 'Midfielder',
    nationality_1: 'France',
    team_name: 'Lyon',
    player_rating: 80.3,
    player_trfm_value: 22000000
  },
  {
    player_name: 'Marcus Johnson',
    position_player: 'Defender',
    nationality_1: 'England',
    team_name: 'Brighton',
    player_rating: 76.9,
    player_trfm_value: 14000000
  }
]

const reportTypes = ['Scouting Report', 'Performance Analysis', 'Potential Assessment', 'Transfer Recommendation']
const potentialLevels = ['High', 'Medium', 'Low']
const ageRanges = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]
const countries = ['Spain', 'Brazil', 'Italy', 'Germany', 'France', 'England', 'Argentina', 'Portugal']
const competitions = ['La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Premier League', 'Brasileirão']

export async function POST() {
  try {
    console.log('🚀 Iniciando población de datos...')

    // Crear scouts
    const createdScouts = []
    for (const scoutData of sampleScouts) {
      const scout = await prisma.scout.create({
        data: scoutData
      })
      createdScouts.push(scout)
    }

    // Crear jugadores
    const createdPlayers = []
    for (const playerData of samplePlayers) {
      const player = await prisma.jugador.create({
        data: playerData
      })
      createdPlayers.push(player)
    }

    // Crear reportes para cada scout
    let totalReports = 0

    for (const scout of createdScouts) {
      const numReports = Math.floor(Math.random() * 15) + 10 // Entre 10 y 25 reportes por scout
      
      for (let i = 0; i < numReports; i++) {
        const randomPlayer = createdPlayers[Math.floor(Math.random() * createdPlayers.length)]
        const randomReportType = reportTypes[Math.floor(Math.random() * reportTypes.length)]
        const randomPotential = potentialLevels[Math.floor(Math.random() * potentialLevels.length)]
        const randomAge = ageRanges[Math.floor(Math.random() * ageRanges.length)]
        const randomCountry = countries[Math.floor(Math.random() * countries.length)]
        const randomCompetition = competitions[Math.floor(Math.random() * competitions.length)]
        
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
            scout_id: scout.id_scout,
            report_date: reportDate,
            report_type: randomReportType,
            id_player: randomPlayer.id_player,
            player_name: randomPlayer.player_name,
            position_player: randomPlayer.position_player,
            nationality_1: randomPlayer.nationality_1,
            team_name: randomPlayer.team_name,
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
            initial_team: randomPlayer.team_name,
            initial_team_level: Math.random() > 0.5 ? 'Elite' : Math.random() > 0.5 ? 'Professional' : 'Amateur',
            initial_competition_level: Math.random() > 0.5 ? 'Top Tier' : Math.random() > 0.5 ? 'Second Tier' : 'Third Tier'
          }
        })

        totalReports++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Datos poblados exitosamente',
      data: {
        scouts: createdScouts.length,
        players: createdPlayers.length,
        reports: totalReports,
        scoutIds: createdScouts.map(s => ({ id: s.id_scout, name: s.scout_name }))
      }
    })

  } catch (error) {
    console.error('Error poblando datos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al poblar datos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}