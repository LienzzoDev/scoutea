import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('🌱 Iniciando población de datos de scouts...')

    // Verificar si ya hay datos
    const existingScouts = await prisma.scout.count()
    const existingPlayers = await prisma.jugador.count()
    const existingReports = await prisma.reporte.count()

    console.log('📊 Datos existentes:', {
      scouts: existingScouts,
      players: existingPlayers,
      reports: existingReports,
    })

    // Crear algunos scouts de ejemplo
    const scouts = await Promise.all([
      prisma.scout.upsert({
        where: { email: 'carlos.rodriguez@example.com' },
        update: {},
        create: {
          scout_name: 'Carlos Rodríguez',
          name: 'Carlos',
          surname: 'Rodríguez',
          email: 'carlos.rodriguez@example.com',
          nationality: 'España',
          country: 'España',
          favourite_club: 'Real Madrid',
          open_to_work: true,
          professional_experience: 'Ex-jugador profesional con 15 años de experiencia en scouting',
          total_reports: 25,
          original_reports: 20,
          roi: 15.5,
          net_profits: 2500000,
          scout_level: 'Senior',
          scout_ranking: 15,
          join_date: new Date('2022-01-15'),
        },
      }),
      prisma.scout.upsert({
        where: { email: 'maria.gonzalez@example.com' },
        update: {},
        create: {
          scout_name: 'María González',
          name: 'María',
          surname: 'González',
          email: 'maria.gonzalez@example.com',
          nationality: 'Argentina',
          country: 'Argentina',
          favourite_club: 'Boca Juniors',
          open_to_work: false,
          professional_experience: 'Especialista en talentos juveniles sudamericanos',
          total_reports: 18,
          original_reports: 15,
          roi: 22.3,
          net_profits: 1800000,
          scout_level: 'Expert',
          scout_ranking: 8,
          join_date: new Date('2021-08-20'),
        },
      }),
    ])

    // Crear algunos jugadores de ejemplo
    const players = []
    const playerNames = [
      { name: 'Alejandro Martínez', age: 19, position: 'CAM', nationality: 'España', team: 'Real Madrid Castilla', rating: 78.5, value: 5000000 },
      { name: 'Lucas Silva', age: 21, position: 'ST', nationality: 'Brasil', team: 'Santos FC', rating: 82.1, value: 12000000 },
      { name: 'Diego Fernández', age: 18, position: 'CB', nationality: 'Argentina', team: 'River Plate', rating: 75.8, value: 3500000 },
      { name: 'Marco Rossi', age: 20, position: 'CM', nationality: 'Italia', team: 'AC Milan Primavera', rating: 79.2, value: 8000000 },
      { name: 'João Pedro', age: 17, position: 'LW', nationality: 'Brasil', team: 'Flamengo Sub-20', rating: 76.9, value: 4200000 },
    ]

    for (const playerData of playerNames) {
      const existingPlayer = await prisma.jugador.findFirst({
        where: { player_name: playerData.name }
      })

      if (!existingPlayer) {
        const player = await prisma.jugador.create({
          data: {
            player_name: playerData.name,
            age: playerData.age,
            position_player: playerData.position,
            nationality_1: playerData.nationality,
            team_name: playerData.team,
            player_rating: playerData.rating,
            player_trfm_value: playerData.value,
          },
        })
        players.push(player)
      } else {
        players.push(existingPlayer)
      }
    }

    // Crear reportes conectando scouts con jugadores
    const reports = []
    const reportData = [
      { scoutIndex: 0, playerIndex: 0, date: '2024-01-15', type: 'scouting', initialValue: 3000000, roi: 18.5, profit: 2000000, potential: 85 },
      { scoutIndex: 0, playerIndex: 1, date: '2024-01-20', type: 'analysis', initialValue: 8000000, roi: 12.8, profit: 4000000, potential: 88 },
      { scoutIndex: 0, playerIndex: 2, date: '2024-02-01', type: 'follow-up', initialValue: 2000000, roi: 25.2, profit: 1500000, potential: 82 },
      { scoutIndex: 1, playerIndex: 3, date: '2024-01-25', type: 'scouting', initialValue: 5000000, roi: 28.5, profit: 3000000, potential: 90 },
      { scoutIndex: 1, playerIndex: 4, date: '2024-02-05', type: 'recommendation', initialValue: 2500000, roi: 32.1, profit: 1700000, potential: 87 },
    ]

    for (const report of reportData) {
      const scout = scouts[report.scoutIndex]
      const player = players[report.playerIndex]

      if (scout && player) {
        const existingReport = await prisma.reporte.findFirst({
          where: {
            scout_id: scout.id_scout,
            id_player: player.id_player,
          }
        })

        if (!existingReport) {
          const newReport = await prisma.reporte.create({
            data: {
              scout_id: scout.id_scout,
              id_player: player.id_player,
              report_date: new Date(report.date),
              report_type: report.type,
              player_name: player.player_name,
              position_player: player.position_player,
              nationality_1: player.nationality_1,
              team_name: player.team_name,
              age: player.age,
              initial_player_trfm_value: report.initialValue,
              player_trfm_value: player.player_trfm_value,
              roi: report.roi,
              profit: report.profit,
              potential: report.potential,
              report_status: 'approved',
            },
          })
          reports.push(newReport)
        }
      }
    }

    const finalCounts = {
      scouts: await prisma.scout.count(),
      players: await prisma.jugador.count(),
      reports: await prisma.reporte.count(),
    }

    return NextResponse.json({
      success: true,
      message: 'Datos poblados exitosamente',
      data: {
        before: {
          scouts: existingScouts,
          players: existingPlayers,
          reports: existingReports,
        },
        after: finalCounts,
        created: {
          scouts: scouts.length,
          players: players.length,
          reports: reports.length,
        }
      }
    })

  } catch (error) {
    console.error('Error poblando datos:', error)
    return NextResponse.json(
      { 
        error: 'Error poblando datos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}