import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { CorrectionService } from '@/lib/services/correction-service'

/**
 * POST /api/admin/corrections/apply-all
 * Aplica todas las correcciones a los jugadores existentes
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

    console.log('🔄 Starting batch corrections...', { userId })

    // Obtener todos los jugadores
    const players = await prisma.jugador.findMany({
      select: {
        id_player: true,
        team_name: true,
        national_tier: true,
        nationality_1: true,
        nationality_2: true,
        team_competition: true
      }
    })

    console.log(`📊 Found ${players.length} players to process`)

    let updatedCount = 0
    const errors: Array<{ playerId: number; error: string }> = []

    // Procesar en lotes de 50 para no sobrecargar
    const batchSize = 50
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (player) => {
          try {
            // Aplicar correcciones
            // Mapeamos team_competition a competition para el servicio
            const correctedData = await CorrectionService.applyPlayerCorrections({
              team_name: player.team_name,
              national_tier: player.national_tier,
              nationality_1: player.nationality_1,
              nationality_2: player.nationality_2,
              competition: player.team_competition
            })

            // Verificar si hay cambios
            const hasChanges =
              correctedData.team_name !== player.team_name ||
              correctedData.nationality_1 !== player.nationality_1 ||
              correctedData.nationality_2 !== player.nationality_2 ||
              correctedData.competition !== player.team_competition ||
              correctedData.rename_national_tier !== undefined ||
              correctedData.country !== undefined

            if (hasChanges) {
              // Actualizar solo los campos que cambiaron
              // Mapeamos competition de vuelta a team_competition
              await prisma.jugador.update({
                where: { id_player: player.id_player },
                data: {
                  team_name: correctedData.team_name ?? null,
                  nationality_1: correctedData.nationality_1 ?? null,
                  nationality_2: correctedData.nationality_2 ?? null,
                  team_competition: correctedData.competition ?? null,
                  ...(correctedData.rename_national_tier && {
                    rename_national_tier: correctedData.rename_national_tier
                  }),
                  ...(correctedData.country && {
                    country: correctedData.country
                  })
                }
              })
              updatedCount++
            }
          } catch (error) {
            console.error(`Error processing player ${player.id_player}:`, error)
            errors.push({
              playerId: player.id_player,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        })
      )

      console.log(`✅ Processed batch ${i / batchSize + 1}/${Math.ceil(players.length / batchSize)}`)
    }

    // ==========================================
    // PROCESAR EQUIPOS
    // ==========================================
    
    // Obtener todos los equipos
    const teams = await prisma.equipo.findMany({
      select: {
        id_team: true,
        team_name: true,
        competition: true,
        team_country: true
      }
    })

    console.log(`📊 Found ${teams.length} teams to process`)

    let updatedTeamsCount = 0
    // Usamos el mismo array de errores, agregando info del tipo
    const teamErrors: Array<{ teamId: string; error: string }> = []

    // Procesar en lotes de 50
    for (let i = 0; i < teams.length; i += batchSize) {
      const batch = teams.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (team) => {
          try {
            // Aplicar correcciones
            const correctedData = await CorrectionService.applyTeamCorrections({
              team_name: team.team_name,
              competition: team.competition,
              team_country: team.team_country
            })

            // Verificar si hay cambios
            const hasChanges =
              correctedData.team_name !== team.team_name ||
              correctedData.competition !== team.competition

            if (hasChanges) {
              await prisma.equipo.update({
                where: { id_team: team.id_team },
                data: {
                  team_name: correctedData.team_name ?? undefined,
                  competition: correctedData.competition ?? undefined
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

    console.log('✅ Batch corrections completed:', {
      totalPlayers: players.length,
      updatedPlayers: updatedCount,
      totalTeams: teams.length,
      updatedTeams: updatedTeamsCount
    })

    const allErrors = [
      ...errors.map(e => ({ type: 'player', id: e.playerId, error: e.error })),
      ...teamErrors.map(e => ({ type: 'team', id: e.teamId, error: e.error }))
    ]

    return NextResponse.json({
      success: true,
      message: `Correcciones aplicadas exitosamente`,
      stats: {
        players: {
          total: players.length,
          updated: updatedCount,
          errors: errors.length
        },
        teams: {
          total: teams.length,
          updated: updatedTeamsCount,
          errors: teamErrors.length
        }
      },
      errors: allErrors.length > 0 ? allErrors : undefined
    })
  } catch (error) {
    console.error('Error applying batch corrections:', error)
    return NextResponse.json(
      {
        __error: 'Error al aplicar las correcciones',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
