import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { CorrectionService } from '@/lib/services/correction-service'

/**
 * POST /api/admin/corrections/apply-nationalities
 * Aplica las correcciones de nacionalidades a:
 * 1. Tabla Country (tabla de referencia)
 * 2. Tabla Jugador (nationality_1, nationality_2)
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

    console.log('🔄 Starting nationality corrections...', { userId })

    const batchSize = 50

    // ==========================================
    // 1. PROCESAR TABLA COUNTRY (REFERENCIA)
    // ==========================================
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true
      }
    })

    console.log(`📊 Found ${countries.length} countries to process`)

    let updatedCountriesCount = 0
    const countryErrors: Array<{ countryId: string; error: string }> = []

    for (let i = 0; i < countries.length; i += batchSize) {
      const batch = countries.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (country) => {
          try {
            const correctedName = await CorrectionService.applyNationalityCorrection(country.name)

            if (correctedName !== country.name) {
              await prisma.country.update({
                where: { id: country.id },
                data: { name: correctedName ?? country.name }
              })
              updatedCountriesCount++
              console.log(`✏️ Country corrected: "${country.name}" → "${correctedName}"`)
            }
          } catch (error) {
            console.error(`Error processing country ${country.id}:`, error)
            countryErrors.push({
              countryId: country.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        })
      )
    }

    console.log(`✅ Processed ${countries.length} countries, updated ${updatedCountriesCount}`)

    // ==========================================
    // 2. PROCESAR JUGADORES
    // ==========================================
    const players = await prisma.jugador.findMany({
      select: {
        id_player: true,
        nationality_1: true,
        nationality_2: true
      },
      where: {
        OR: [
          { nationality_1: { not: null } },
          { nationality_2: { not: null } }
        ]
      }
    })

    console.log(`📊 Found ${players.length} players to process for nationality corrections`)

    let updatedPlayersCount = 0
    const playerErrors: Array<{ playerId: number; error: string }> = []

    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (player) => {
          try {
            // Aplicar correcciones de nacionalidad
            const correctedNationality1 = player.nationality_1
              ? await CorrectionService.applyNationalityCorrection(player.nationality_1)
              : null
            const correctedNationality2 = player.nationality_2
              ? await CorrectionService.applyNationalityCorrection(player.nationality_2)
              : null

            // Verificar si hay cambios
            const hasChanges =
              correctedNationality1 !== player.nationality_1 ||
              correctedNationality2 !== player.nationality_2

            if (hasChanges) {
              await prisma.jugador.update({
                where: { id_player: player.id_player },
                data: {
                  nationality_1: correctedNationality1,
                  nationality_2: correctedNationality2
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

    console.log('✅ Nationality corrections completed:', {
      totalCountries: countries.length,
      updatedCountries: updatedCountriesCount,
      totalPlayers: players.length,
      updatedPlayers: updatedPlayersCount
    })

    return NextResponse.json({
      success: true,
      message: `Correcciones de nacionalidad aplicadas exitosamente`,
      stats: {
        countries: {
          total: countries.length,
          updated: updatedCountriesCount,
          errors: countryErrors.length
        },
        players: {
          total: players.length,
          updated: updatedPlayersCount,
          errors: playerErrors.length
        }
      },
      errors: countryErrors.length > 0 || playerErrors.length > 0
        ? {
            countries: countryErrors.length > 0 ? countryErrors : undefined,
            players: playerErrors.length > 0 ? playerErrors : undefined
          }
        : undefined
    })
  } catch (error) {
    console.error('Error applying nationality corrections:', error)
    return NextResponse.json(
      {
        __error: 'Error al aplicar las correcciones de nacionalidad',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
