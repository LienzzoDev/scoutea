/**
 * Age Calculation Service
 *
 * Implements age-based calculations for player market values:
 * - age_value: Expected market value based on age cohort average
 * - age_value_%: Percentage deviation from age-based expected value
 * - age_coeff: Age coefficient for weighting calculations
 */

import { prisma } from '@/lib/db'

export class AgeCalculationService {
  /**
   * Calculate age_value for a player
   * Formula: Average of player_trfm_value for all players where age <= player's age
   *
   * @param age - Player's age
   * @returns Average market value for age cohort, or null if no data
   */
  static async calculateAgeValue(age: number | null): Promise<number | null> {
    if (!age) return null

    const result = await prisma.jugador.aggregate({
      where: {
        age: {
          lte: age
        },
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
   * Calculate age_value_% (percentage deviation from expected value)
   * Formula: (100 × player_trfm_value / age_value) - 100
   *
   * @param playerValue - Player's actual market value (player_trfm_value)
   * @param ageValue - Expected market value based on age (age_value)
   * @returns Percentage deviation, or null if calculation not possible
   */
  static calculateAgeValuePercent(
    playerValue: number | null,
    ageValue: number | null
  ): number | null {
    // If player value is 0 or null, return null (equivalent to "-" in Excel)
    if (!playerValue || playerValue === 0) return null

    // If age_value is 0 or null, return null to avoid division by zero
    if (!ageValue || ageValue === 0) return null

    try {
      const percentage = (100 * playerValue / ageValue) - 100
      return Math.round(percentage * 100) / 100 // Round to 2 decimals
    } catch (error) {
      // Handle any calculation errors (equivalent to SI.ERROR in Excel)
      return null
    }
  }

  /**
   * Calculate age_coeff (age coefficient)
   * Formula based on age thresholds:
   * - age <= 22: coefficient = 1
   * - age > 22: coefficient = 2
   *
   * Original Excel formula:
   * =SI(S2=""; ""; SI(S2<=22;1; SI(S2<=21;1; SI(S2<=19;1; SI(S2<=17;1; SI(S2<=16;1; 2))))))
   *
   * Note: The nested conditions all check for <=22, so simplified to single condition
   *
   * @param age - Player's age
   * @returns Age coefficient (1 or 2), or null if age is null
   */
  static calculateAgeCoeff(age: number | null): number | null {
    if (!age) return null

    // All nested conditions in the original formula check for age <= 22
    // So the simplified logic is: if age <= 22, return 1, else return 2
    if (age <= 22) {
      return 1
    }

    return 2
  }

  /**
   * Calculate all age-based values for a single player
   *
   * @param playerId - Player's ID
   * @returns Object with calculated values
   */
  static async calculatePlayerAgeValues(playerId: string): Promise<{
    age_value: number | null
    age_value_percent: number | null
    age_coeff: number | null
  }> {
    const player = await prisma.jugador.findUnique({
      where: { id_player: playerId },
      select: {
        age: true,
        player_trfm_value: true,
        player_name: true
      }
    })

    if (!player || !player.player_name) {
      return {
        age_value: null,
        age_value_percent: null,
        age_coeff: null
      }
    }

    const age_value = await this.calculateAgeValue(player.age)
    const age_value_percent = this.calculateAgeValuePercent(
      player.player_trfm_value,
      age_value
    )
    const age_coeff = this.calculateAgeCoeff(player.age)

    return {
      age_value,
      age_value_percent,
      age_coeff
    }
  }

  /**
   * Update age-based values for a single player in the database
   *
   * @param playerId - Player's ID
   * @returns Updated player record
   */
  static async updatePlayerAgeValues(playerId: string) {
    const values = await this.calculatePlayerAgeValues(playerId)

    return await prisma.jugador.update({
      where: { id_player: playerId },
      data: {
        age_value: values.age_value,
        age_value_percent: values.age_value_percent,
        age_coeff: values.age_coeff
      }
    })
  }

  /**
   * Calculate and update age values for all players in the database
   * This is an expensive operation and should be run as a batch job
   *
   * @param batchSize - Number of players to process in each batch
   * @returns Summary of the operation
   */
  static async updateAllPlayersAgeValues(
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
          age: true,
          player_trfm_value: true
        },
        skip: offset,
        take: batchSize
      })

      // Process batch
      for (const player of players) {
        try {
          const age_value = await this.calculateAgeValue(player.age)
          const age_value_percent = this.calculateAgeValuePercent(
            player.player_trfm_value,
            age_value
          )
          const age_coeff = this.calculateAgeCoeff(player.age)

          await prisma.jugador.update({
            where: { id_player: player.id_player },
            data: {
              age_value,
              age_value_percent,
              age_coeff
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
   * Recalculate age_value for all age groups (optimization)
   * This creates a lookup table to avoid repeated calculations
   *
   * @returns Map of age -> average market value
   */
  static async buildAgeValueLookup(): Promise<Map<number, number>> {
    const players = await prisma.jugador.findMany({
      where: {
        age: { not: null },
        player_trfm_value: { not: null }
      },
      select: {
        age: true,
        player_trfm_value: true
      },
      orderBy: {
        age: 'asc'
      }
    })

    const ageValueMap = new Map<number, number>()
    const uniqueAges = [...new Set(players.map((p: { age: number | null }) => p.age).filter(Boolean))] as number[]

    for (const age of uniqueAges) {
      const avgValue = await this.calculateAgeValue(age)
      if (avgValue !== null) {
        ageValueMap.set(age, avgValue)
      }
    }

    return ageValueMap
  }

  /**
   * Optimized batch update using pre-calculated age value lookup
   * This is much faster for large datasets
   *
   * @param batchSize - Number of players to process in each batch
   * @returns Summary of the operation
   */
  static async updateAllPlayersAgeValuesOptimized(
    batchSize: number = 500,
    onProgress?: (current: number, total: number) => void
  ): Promise<{
    total: number
    updated: number
    errors: number
  }> {
    console.log('Building age value lookup table...')
    const ageValueLookup = await this.buildAgeValueLookup()
    console.log(`Lookup table built with ${ageValueLookup.size} age groups`)

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
          age: true,
          player_trfm_value: true
        },
        skip: offset,
        take: batchSize
      })

      // Prepare batch update data
      const updates = players.map((player: {
        id_player: string
        age: number | null
        player_trfm_value: number | null
      }) => {
        const age_value = player.age ? ageValueLookup.get(player.age) ?? null : null
        const age_value_percent = this.calculateAgeValuePercent(
          player.player_trfm_value,
          age_value
        )
        const age_coeff = this.calculateAgeCoeff(player.age)

        return {
          id_player: player.id_player,
          age_value,
          age_value_percent,
          age_coeff
        }
      })

      // Execute batch update using transaction
      try {
        await prisma.$transaction(
          updates.map((update: {
            id_player: string
            age_value: number | null
            age_value_percent: number | null
            age_coeff: number | null
          }) =>
            prisma.jugador.update({
              where: { id_player: update.id_player },
              data: {
                age_value: update.age_value,
                age_value_percent: update.age_value_percent,
                age_coeff: update.age_coeff
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