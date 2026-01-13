import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { CorrectionService } from '@/lib/services/correction-service'

/**
 * POST /api/admin/corrections/apply-competitions
 * Aplica las correcciones de competiciones a:
 * 1. Tabla Competition (tabla de referencia)
 * 2. Tabla Jugador (team_competition)
 * 3. Tabla Equipo (competition)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que sea admin
    const userRole = sessionClaims?.public_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { __error: 'Solo los administradores pueden ejecutar correcciones masivas' },
        { status: 403 }
      )
    }

    console.log('🔄 Starting competition corrections...', { userId })

    const batchSize = 50

    // ==========================================
    // 1. PROCESAR TABLA COMPETITION (REFERENCIA)
    // ==========================================
    const competitions = await prisma.competition.findMany({
      select: {
        id_competition: true,
        name: true
      }
    })

    console.log(`📊 Found ${competitions.length} competitions to process`)

    let updatedCompetitionsCount = 0
    const competitionErrors: Array<{ competitionId: string; error: string }> = []

    for (let i = 0; i < competitions.length; i += batchSize) {
      const batch = competitions.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (competition) => {
          try {
            const correctedName = await CorrectionService.applyCompetitionCorrection(competition.name)

            if (correctedName !== competition.name) {
              await prisma.competition.update({
                where: { id_competition: competition.id_competition },
                data: { name: correctedName ?? competition.name }
              })
              updatedCompetitionsCount++
              console.log(`✏️ Competition corrected: "${competition.name}" → "${correctedName}"`)
            }
          } catch (error) {
            console.error(`Error processing competition ${competition.id_competition}:`, error)
            competitionErrors.push({
              competitionId: competition.id_competition,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        })
      )
    }

    console.log(`✅ Processed ${competitions.length} competitions, updated ${updatedCompetitionsCount}`)

    // ==========================================
    // 2. PROCESAR JUGADORES
    // ==========================================
    const players = await prisma.jugador.findMany({
      select: {
        id_player: true,
        team_competition: true
      },
      where: {
        team_competition: { not: null }
      }
    })

    console.log(`📊 Found ${players.length} players to process for competition corrections`)

    let updatedPlayersCount = 0
    const playerErrors: Array<{ playerId: number; error: string }> = []

    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (player) => {
          try {
            const correctedCompetition = await CorrectionService.applyCompetitionCorrection(
              player.team_competition
            )

            const hasChanges = correctedCompetition !== player.team_competition

            if (hasChanges) {
              await prisma.jugador.update({
                where: { id_player: player.id_player },
                data: {
                  team_competition: correctedCompetition
                }
              })
              updatedPlayersCount++
            }
          } catch (error) {
            console.error(`Error processing player ${player.id_player}:`, error)
            playerErrors.push({
              playerId: player.id_player,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        })
      )

      console.log(`✅ Processed players batch ${i / batchSize + 1}/${Math.ceil(players.length / batchSize)}`)
    }

    // ==========================================
    // 3. PROCESAR EQUIPOS
    // ==========================================
    const teams = await prisma.equipo.findMany({
      select: {
        id_team: true,
        competition: true
      },
      where: {
        competition: { not: null }
      }
    })

    console.log(`📊 Found ${teams.length} teams to process for competition corrections`)

    let updatedTeamsCount = 0
    const teamErrors: Array<{ teamId: string; error: string }> = []

    for (let i = 0; i < teams.length; i += batchSize) {
      const batch = teams.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (team) => {
          try {
            const correctedCompetition = await CorrectionService.applyCompetitionCorrection(
              team.competition
            )

            const hasChanges = correctedCompetition !== team.competition

            if (hasChanges) {
              await prisma.equipo.update({
                where: { id_team: team.id_team },
                data: {
                  competition: correctedCompetition ?? undefined
                }
              })
              updatedTeamsCount++
            }
          } catch (error) {
            console.error(`Error processing team ${team.id_team}:`, error)
            teamErrors.push({
              teamId: team.id_team,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        })
      )

      console.log(`✅ Processed teams batch ${i / batchSize + 1}/${Math.ceil(teams.length / batchSize)}`)
    }

    console.log('✅ Competition corrections completed:', {
      totalCompetitions: competitions.length,
      updatedCompetitions: updatedCompetitionsCount,
      totalPlayers: players.length,
      updatedPlayers: updatedPlayersCount,
      totalTeams: teams.length,
      updatedTeams: updatedTeamsCount
    })

    return NextResponse.json({
      success: true,
      message: `Correcciones de competiciones aplicadas exitosamente`,
      stats: {
        competitions: {
          total: competitions.length,
          updated: updatedCompetitionsCount,
          errors: competitionErrors.length
        },
        players: {
          total: players.length,
          updated: updatedPlayersCount,
          errors: playerErrors.length
        },
        teams: {
          total: teams.length,
          updated: updatedTeamsCount,
          errors: teamErrors.length
        }
      },
      errors: competitionErrors.length > 0 || playerErrors.length > 0 || teamErrors.length > 0
        ? {
            competitions: competitionErrors.length > 0 ? competitionErrors : undefined,
            players: playerErrors.length > 0 ? playerErrors : undefined,
            teams: teamErrors.length > 0 ? teamErrors : undefined
          }
        : undefined
    })
  } catch (error) {
    console.error('Error applying competition corrections:', error)
    return NextResponse.json(
      {
        __error: 'Error al aplicar las correcciones de competiciones',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
