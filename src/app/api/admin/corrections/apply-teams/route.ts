import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { CorrectionService } from '@/lib/services/correction-service'

/**
 * POST /api/admin/corrections/apply-teams
 * Aplica las correcciones de nombres de equipos a jugadores y equipos
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

    console.log('🔄 Starting team name corrections...', { userId })

    // ==========================================
    // PROCESAR JUGADORES
    // ==========================================
    const players = await prisma.jugador.findMany({
      select: {
        id_player: true,
        team_name: true
      },
      where: {
        team_name: { not: null }
      }
    })

    console.log(`📊 Found ${players.length} players to process for team name corrections`)

    let updatedPlayersCount = 0
    const playerErrors: Array<{ playerId: number; error: string }> = []

    const batchSize = 50
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (player) => {
          try {
            const correctedTeamName = await CorrectionService.applyTeamNameCorrection(
              player.team_name
            )

            const hasChanges = correctedTeamName !== player.team_name

            if (hasChanges) {
              await prisma.jugador.update({
                where: { id_player: player.id_player },
                data: {
                  team_name: correctedTeamName
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
    // PROCESAR EQUIPOS
    // ==========================================
    const teams = await prisma.equipo.findMany({
      select: {
        id_team: true,
        team_name: true
      },
      where: {
        team_name: { not: null }
      }
    })

    console.log(`📊 Found ${teams.length} teams to process for team name corrections`)

    let updatedTeamsCount = 0
    const teamErrors: Array<{ teamId: string; error: string }> = []

    for (let i = 0; i < teams.length; i += batchSize) {
      const batch = teams.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (team) => {
          try {
            const correctedTeamName = await CorrectionService.applyTeamNameCorrection(
              team.team_name
            )

            const hasChanges = correctedTeamName !== team.team_name

            if (hasChanges) {
              await prisma.equipo.update({
                where: { id_team: team.id_team },
                data: {
                  team_name: correctedTeamName ?? undefined
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

    console.log('✅ Team name corrections completed:', {
      totalPlayers: players.length,
      updatedPlayers: updatedPlayersCount,
      totalTeams: teams.length,
      updatedTeams: updatedTeamsCount
    })

    return NextResponse.json({
      success: true,
      message: `Correcciones de nombres de equipo aplicadas exitosamente`,
      stats: {
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
      errors: playerErrors.length > 0 || teamErrors.length > 0
        ? {
            players: playerErrors.length > 0 ? playerErrors : undefined,
            teams: teamErrors.length > 0 ? teamErrors : undefined
          }
        : undefined
    })
  } catch (error) {
    console.error('Error applying team name corrections:', error)
    return NextResponse.json(
      {
        __error: 'Error al aplicar las correcciones de nombres de equipo',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
