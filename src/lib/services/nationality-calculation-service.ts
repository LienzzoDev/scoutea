/**
 * Nationality Calculation Service
 *
 * Implements nationality-based calculations for player market values:
 * - nationality_value: Average market value of players with same nationality_1
 * - nationality_value_%: Percentage deviation from nationality-based expected value
 */

import { prisma } from '@/lib/db'

export class NationalityCalculationService {
  /**
   * Calculate nationality_value for a player
   * Formula: Average of player_trfm_value for all players with same correct_nationality_1
   *
   * Excel formula: =SI.ERROR(SI(ESBLANCO(C2);"-";PROMEDIO(FILTRAR(player_trfm_value;nationality_1=B2)));0)
   * Note: Using correct_nationality_1 as it contains the actual nationality data
   *
   * @param nationality - Player's correct_nationality_1
   * @returns Average market value for nationality cohort, or null if no data
   */
  static async calculateNationalityValue(nationality: string | null): Promise<number | null> {
    if (!nationality || nationality === '') return null

    const result = await prisma.jugador.aggregate({
      where: {
        correct_nationality_1: nationality,
        player_trfm_value: {
          not: null
        }
      },
      _avg: {
        player_trfm_value: true
      }
    })

    return result._avg.player_trfm_value ?? null
  }

  /**
   * Calculate nationality_value_% (percentage deviation from expected value)
   * Formula: (100 × player_trfm_value / nationality_value) - 100
   *
   * Excel formula: =SI.ERROR(SI(BS2=0;"-";(100*BS2/BH2)-100);"-")
   * BS2 = player_trfm_value; BH2 = nationality_value
   *
   * @param playerValue - Player's actual market value (player_trfm_value)
   * @param nationalityValue - Expected market value based on nationality (nationality_value)
   * @returns Percentage deviation, or null if calculation not possible
   */
  static calculateNationalityValuePercent(
    playerValue: number | null,
    nationalityValue: number | null
  ): number | null {
    // If player value is 0 or null, return null (equivalent to "-" in Excel)
    if (!playerValue || playerValue === 0) return null

    // If nationality_value is 0 or null, return null to avoid division by zero
    if (!nationalityValue || nationalityValue === 0) return null

    try {
      const percentage = (100 * playerValue / nationalityValue) - 100
      return Math.round(percentage * 100) / 100 // Round to 2 decimals
    } catch (error) {
      // Handle any calculation errors (equivalent to SI.ERROR in Excel)
      return null
    }
  }

  /**
   * Calculate all nationality-based values for a single player
   *
   * @param playerId - Player's ID
   * @returns Object with calculated values
   */
  static async calculatePlayerNationalityValues(playerId: string): Promise<{
    nationality_value: number | null
    nationality_value_percent: number | null
  }> {
    const player = await prisma.jugador.findUnique({
      where: { id_player: playerId },
      select: {
        correct_nationality_1: true,
        player_trfm_value: true,
        player_name: true
      }
    })

    if (!player || !player.player_name) {
      return {
        nationality_value: null,
        nationality_value_percent: null
      }
    }

    const nationality_value = await this.calculateNationalityValue(player.correct_nationality_1)
    const nationality_value_percent = this.calculateNationalityValuePercent(
      player.player_trfm_value,
      nationality_value
    )

    return {
      nationality_value,
      nationality_value_percent
    }
  }

  /**
   * Update nationality-based values for a single player in the database
   *
   * @param playerId - Player's ID
   * @returns Updated player record
   */
  static async updatePlayerNationalityValues(playerId: string) {
    const values = await this.calculatePlayerNationalityValues(playerId)

    return await prisma.jugador.update({
      where: { id_player: playerId },
      data: {
        nationality_value: values.nationality_value,
        nationality_value_percent: values.nationality_value_percent
      }
    })
  }

  /**
   * Calculate and update nationality values for all players in the database
   * This is an expensive operation and should be run as a batch job
   *
   * @param batchSize - Number of players to process in each batch
   * @returns Summary of the operation
   */
  static async updateAllPlayersNationalityValues(
    batchSize: number = 100,
    onProgress?: (current: number, total: number) => void
  ): Promise<{
    total: number
    updated: number
    errors: number
  }> {
    const totalPlayers = await prisma.jugador.count({
      where: {
        player_name: {
          not: ''
        }
      }
    })

    let updated = 0
    let errors = 0
    let offset = 0

    while (offset < totalPlayers) {
      const players = await prisma.jugador.findMany({
        where: {
          player_name: {
            not: ''
          }
        },
        select: {
          id_player: true,
          correct_nationality_1: true,
          player_trfm_value: true
        },
        skip: offset,
        take: batchSize
      })

      // Process batch
      for (const player of players) {
        try {
          const nationality_value = await this.calculateNationalityValue(player.correct_nationality_1)
          const nationality_value_percent = this.calculateNationalityValuePercent(
            player.player_trfm_value,
            nationality_value
          )

          await prisma.jugador.update({
            where: { id_player: player.id_player },
            data: {
              nationality_value,
              nationality_value_percent
            }
          })

          updated++
        } catch (error) {
          console.error(`Error updating player ${player.id_player}:`, error)
          errors++
        }
      }

      offset += batchSize

      if (onProgress) {
        onProgress(offset, totalPlayers)
      }
    }

    return {
      total: totalPlayers,
      updated,
      errors
    }
  }

  /**
   * Recalculate nationality_value for all nationalities (optimization)
   * This creates a lookup table to avoid repeated calculations
   *
   * @returns Map of nationality -> average market value
   */
  static async buildNationalityValueLookup(): Promise<Map<string, number>> {
    const players = await prisma.jugador.findMany({
      where: {
        correct_nationality_1: { not: null },
        player_trfm_value: { not: null }
      },
      select: {
        correct_nationality_1: true,
        player_trfm_value: true
      },
      orderBy: {
        correct_nationality_1: 'asc'
      }
    })

    const nationalityValueMap = new Map<string, number>()
    const uniqueNationalities = [...new Set(
      players
        .map((p: { correct_nationality_1: string | null }) => p.correct_nationality_1)
        .filter(Boolean)
    )] as string[]

    for (const nationality of uniqueNationalities) {
      const avgValue = await this.calculateNationalityValue(nationality)
      if (avgValue !== null) {
        nationalityValueMap.set(nationality, avgValue)
      }
    }

    return nationalityValueMap
  }

  /**
   * Optimized batch update using pre-calculated nationality value lookup
   * This is much faster for large datasets
   *
   * @param batchSize - Number of players to process in each batch
   * @returns Summary of the operation
   */
  static async updateAllPlayersNationalityValuesOptimized(
    batchSize: number = 500,
    onProgress?: (current: number, total: number) => void
  ): Promise<{
    total: number
    updated: number
    errors: number
  }> {
    console.log('Building nationality value lookup table...')
    const nationalityValueLookup = await this.buildNationalityValueLookup()
    console.log(`Lookup table built with ${nationalityValueLookup.size} nationalities`)

    const totalPlayers = await prisma.jugador.count({
      where: {
        player_name: { not: '' }
      }
    })

    let updated = 0
    let errors = 0
    let offset = 0

    while (offset < totalPlayers) {
      const players = await prisma.jugador.findMany({
        where: {
          player_name: { not: '' }
        },
        select: {
          id_player: true,
          correct_nationality_1: true,
          player_trfm_value: true
        },
        skip: offset,
        take: batchSize
      })

      // Prepare batch update data
      const updates = players.map((player: {
        id_player: string
        correct_nationality_1: string | null
        player_trfm_value: number | null
      }) => {
        const nationality_value = player.correct_nationality_1
          ? nationalityValueLookup.get(player.correct_nationality_1) ?? null
          : null
        const nationality_value_percent = this.calculateNationalityValuePercent(
          player.player_trfm_value,
          nationality_value
        )

        return {
          id_player: player.id_player,
          nationality_value,
          nationality_value_percent
        }
      })

      // Execute batch update using transaction
      try {
        await prisma.$transaction(
          updates.map((update: {
            id_player: string
            nationality_value: number | null
            nationality_value_percent: number | null
          }) =>
            prisma.jugador.update({
              where: { id_player: update.id_player },
              data: {
                nationality_value: update.nationality_value,
                nationality_value_percent: update.nationality_value_percent
              }
            })
          )
        )
        updated += updates.length
      } catch (error) {
        console.error(`Error updating batch at offset ${offset}:`, error)
        errors += updates.length
      }

      offset += batchSize

      if (onProgress) {
        onProgress(Math.min(offset, totalPlayers), totalPlayers)
      }
    }

    return {
      total: totalPlayers,
      updated,
      errors
    }
  }
}
