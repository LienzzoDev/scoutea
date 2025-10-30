/**
 * Competition Calculation Service
 *
 * Implements competition-based calculations:
 * - competition_trfm_value_norm: Normalized competition market value
 * - competition_rating_norm: Normalized competition rating
 * - competition_elo: Average of the two normalized metrics
 * - competition_level: Qualitative classification (A+, A, B, C, D)
 */

import { prisma } from '@/lib/db'

// Reference constant for normalization (5 billion)
const MAX_COMPETITION_VALUE = 5000000000

export class CompetitionCalculationService {
  /**
   * Calculate competition_trfm_value_norm
   * Formula: IF((H2*10)/5000000000<=10, (H2*10)/5000000000, 10)
   *
   * @param competitionValue - Competition's total market value
   * @returns Normalized value (max 10)
   */
  static calculateCompetitionValueNorm(competitionValue: number | null): number | null {
    if (!competitionValue || competitionValue === 0) return null

    const normalized = (competitionValue * 10) / MAX_COMPETITION_VALUE

    // Cap at 10
    return normalized <= 10 ? Math.round(normalized * 100) / 100 : 10
  }

  /**
   * Get the maximum competition rating from the database
   *
   * @returns Maximum competition rating
   */
  static async getMaxCompetitionRating(): Promise<number> {
    const result = await prisma.competition.aggregate({
      where: {
        competition_rating: {
          not: null
        }
      },
      _max: {
        competition_rating: true
      }
    })

    return result._max.competition_rating ?? 1 // Default to 1 to avoid division by zero
  }

  /**
   * Calculate competition_rating_norm
   * Formula: =SI.ERROR(SI(ESBLANCO(B2);" "; (J2*10)/max_competition_rating); 0)
   *
   * @param competitionRating - Competition's rating
   * @param maxRating - Maximum competition rating (for normalization)
   * @returns Normalized rating (0-10 scale)
   */
  static calculateCompetitionRatingNorm(
    competitionRating: number | null,
    maxRating: number
  ): number | null {
    if (!competitionRating || competitionRating === 0) return null
    if (maxRating === 0) return null

    try {
      const normalized = (competitionRating * 10) / maxRating
      return Math.round(normalized * 100) / 100 // Round to 2 decimals
    } catch (error) {
      // Handle any calculation errors (equivalent to SI.ERROR in Excel)
      return null
    }
  }

  /**
   * Calculate competition_elo
   * Formula: =PROMEDIO(I2:K2)
   * Average of competition_trfm_value_norm and competition_rating_norm
   *
   * @param valueNorm - Normalized competition value
   * @param ratingNorm - Normalized competition rating
   * @returns Average Elo score
   */
  static calculateCompetitionElo(
    valueNorm: number | null,
    ratingNorm: number | null
  ): number | null {
    const values = [valueNorm, ratingNorm].filter((v): v is number => v !== null)

    if (values.length === 0) return null

    const average = values.reduce((sum, val) => sum + val, 0) / values.length
    return Math.round(average * 100) / 100 // Round to 2 decimals
  }

  /**
   * Calculate competition_level
   * Formula: =SI(ESBLANCO(C2);"";SI(L2>=9;"A+";SI(L2>=7;"A";SI(L2>=5;"B";SI(L2>=3;"C";"D")))))
   *
   * @param elo - Competition Elo score
   * @param hasName - Whether competition has a name
   * @returns Qualitative level (A+, A, B, C, D, or null)
   */
  static calculateCompetitionLevel(elo: number | null, hasName: boolean): string | null {
    if (!hasName || elo === null) return null

    if (elo >= 9) return 'A+'
    if (elo >= 7) return 'A'
    if (elo >= 5) return 'B'
    if (elo >= 3) return 'C'
    return 'D'
  }

  /**
   * Calculate all competition-based values for a single competition
   *
   * @param competitionId - Competition's ID
   * @param maxRating - Maximum competition rating (pass to avoid repeated queries)
   * @returns Object with calculated values
   */
  static async calculateCompetitionValues(
    competitionId: string,
    maxRating?: number
  ): Promise<{
    competition_trfm_value_norm: number | null
    competition_rating_norm: number | null
    competition_elo: number | null
    competition_level: string | null
  }> {
    const competition = await prisma.competition.findUnique({
      where: { id_competition: competitionId },
      select: {
        competition_name: true,
        correct_competition_name: true,
        competition_trfm_value: true,
        competition_rating: true
      }
    })

    if (!competition) {
      return {
        competition_trfm_value_norm: null,
        competition_rating_norm: null,
        competition_elo: null,
        competition_level: null
      }
    }

    // Get max rating if not provided
    const maxCompetitionRating = maxRating ?? await this.getMaxCompetitionRating()

    const competition_trfm_value_norm = this.calculateCompetitionValueNorm(
      competition.competition_trfm_value
    )
    const competition_rating_norm = this.calculateCompetitionRatingNorm(
      competition.competition_rating,
      maxCompetitionRating
    )
    const competition_elo = this.calculateCompetitionElo(
      competition_trfm_value_norm,
      competition_rating_norm
    )
    const hasName = !!(competition.competition_name || competition.correct_competition_name)
    const competition_level = this.calculateCompetitionLevel(competition_elo, hasName)

    return {
      competition_trfm_value_norm,
      competition_rating_norm,
      competition_elo,
      competition_level
    }
  }

  /**
   * Update competition-based values for a single competition in the database
   *
   * @param competitionId - Competition's ID
   * @param maxRating - Optional: maximum competition rating
   * @returns Updated competition record
   */
  static async updateCompetitionValues(competitionId: string, maxRating?: number) {
    const values = await this.calculateCompetitionValues(competitionId, maxRating)

    return await prisma.competition.update({
      where: { id_competition: competitionId },
      data: {
        competition_trfm_value_norm: values.competition_trfm_value_norm,
        competition_rating_norm: values.competition_rating_norm,
        competition_elo: values.competition_elo,
        competition_level: values.competition_level
      }
    })
  }

  /**
   * Calculate and update values for all competitions in the database
   *
   * @param batchSize - Number of competitions to process in each batch
   * @returns Summary of the operation
   */
  static async updateAllCompetitionsOptimized(
    batchSize: number = 500,
    onProgress?: (current: number, total: number) => void
  ): Promise<{
    total: number
    updated: number
    errors: number
  }> {
    console.log('Getting maximum competition rating...')
    const maxRating = await this.getMaxCompetitionRating()
    console.log(`Max competition rating: ${maxRating}`)

    const totalCompetitions = await prisma.competition.count()

    let updated = 0
    let errors = 0
    let offset = 0

    while (offset < totalCompetitions) {
      const competitions = await prisma.competition.findMany({
        select: {
          id_competition: true,
          competition_name: true,
          correct_competition_name: true,
          competition_trfm_value: true,
          competition_rating: true
        },
        skip: offset,
        take: batchSize
      })

      // Prepare batch update data
      const updates = competitions.map((competition: {
        id_competition: string
        competition_name: string | null
        correct_competition_name: string | null
        competition_trfm_value: number | null
        competition_rating: number | null
      }) => {
        const competition_trfm_value_norm = this.calculateCompetitionValueNorm(
          competition.competition_trfm_value
        )
        const competition_rating_norm = this.calculateCompetitionRatingNorm(
          competition.competition_rating,
          maxRating
        )
        const competition_elo = this.calculateCompetitionElo(
          competition_trfm_value_norm,
          competition_rating_norm
        )
        const hasName = !!(competition.competition_name || competition.correct_competition_name)
        const competition_level = this.calculateCompetitionLevel(competition_elo, hasName)

        return {
          id_competition: competition.id_competition,
          competition_trfm_value_norm,
          competition_rating_norm,
          competition_elo,
          competition_level
        }
      })

      // Execute batch update using transaction
      try {
        await prisma.$transaction(
          updates.map((update: {
            id_competition: string
            competition_trfm_value_norm: number | null
            competition_rating_norm: number | null
            competition_elo: number | null
            competition_level: string | null
          }) =>
            prisma.competition.update({
              where: { id_competition: update.id_competition },
              data: {
                competition_trfm_value_norm: update.competition_trfm_value_norm,
                competition_rating_norm: update.competition_rating_norm,
                competition_elo: update.competition_elo,
                competition_level: update.competition_level
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
        onProgress(Math.min(offset, totalCompetitions), totalCompetitions)
      }
    }

    return {
      total: totalCompetitions,
      updated,
      errors
    }
  }
}
