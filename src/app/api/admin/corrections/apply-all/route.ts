import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { CorrectionService } from '@/lib/services/correction-service'
import { prisma } from '@/lib/db'

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
        nationality_3: true,
        competition: true
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
            const correctedData = await CorrectionService.applyPlayerCorrections({
              team_name: player.team_name,
              national_tier: player.national_tier,
              nationality_1: player.nationality_1,
              nationality_2: player.nationality_2,
              nationality_3: player.nationality_3,
              competition: player.competition
            })

            // Verificar si hay cambios
            const hasChanges =
              correctedData.team_name !== player.team_name ||
              correctedData.nationality_1 !== player.nationality_1 ||
              correctedData.nationality_2 !== player.nationality_2 ||
              correctedData.nationality_3 !== player.nationality_3 ||
              correctedData.competition !== player.competition ||
              correctedData.rename_national_tier !== undefined ||
              correctedData.country !== undefined

            if (hasChanges) {
              // Actualizar solo los campos que cambiaron
              await prisma.jugador.update({
                where: { id_player: player.id_player },
                data: {
                  team_name: correctedData.team_name,
                  nationality_1: correctedData.nationality_1,
                  nationality_2: correctedData.nationality_2,
                  nationality_3: correctedData.nationality_3,
                  competition: correctedData.competition,
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

    console.log('✅ Batch corrections completed:', {
      totalPlayers: players.length,
      updatedCount,
      errorsCount: errors.length
    })

    return NextResponse.json({
      success: true,
      message: `Correcciones aplicadas exitosamente`,
      stats: {
        totalPlayers: players.length,
        updatedPlayers: updatedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
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
