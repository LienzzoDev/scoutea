/**
 * Team Calculation Service
 *
 * Implements team-based calculations:
 * - team_trfm_val_use_norm: Normalized team market value
 * - team_rating_norm: Normalized team rating
 * - team_elo: Average of the two normalized metrics
 * - team_level: Qualitative classification (A+, A, B, C, D)
 */

import { prisma } from '@/lib/db'

export class TeamCalculationService {
  /**
   * Get the maximum team market value from the database
   *
   * @returns Maximum team market value
   */
  static async getMaxTeamValue(): Promise<number> {
    const result = await prisma.equipo.aggregate({
      where: {
        team_trfm_value: {
          not: null
        }
      },
      _max: {
        team_trfm_value: true
      }
    })

    return result._max.team_trfm_value ?? 1 // Default to 1 to avoid division by zero
  }

  /**
   * Get the maximum team rating from the database
   *
   * @returns Maximum team rating
   */
  static async getMaxTeamRating(): Promise<number> {
    const result = await prisma.equipo.aggregate({
      where: {
        team_rating: {
          not: null
        }
      },
      _max: {
        team_rating: true
      }
    })

    return result._max.team_rating ?? 1 // Default to 1 to avoid division by zero
  }

  /**
   * Calculate team_trfm_val_use_norm
   * Formula: =SI.ERROR(SI(ESBLANCO(B2);" "; (M2*10)/max_team_trfm_value); 0)
   *
   * @param teamValue - Team's market value
   * @param maxValue - Maximum team market value (for normalization)
   * @returns Normalized value (0-10 scale)
   */
  static calculateTeamValueNorm(
    teamValue: number | null,
    maxValue: number
  ): number | null {
    if (!teamValue || teamValue === 0) return null
    if (maxValue === 0) return null

    try {
      const normalized = (teamValue * 10) / maxValue
      return Math.round(normalized * 100) / 100 // Round to 2 decimals
    } catch (error) {
      // Handle any calculation errors (equivalent to SI.ERROR in Excel)
      return null
    }
  }

  /**
   * Calculate team_rating_norm
   * Formula: =SI.ERROR(SI(ESBLANCO(B2);" "; (P2*10)/max_team_rating); 0)
   *
   * @param teamRating - Team's rating
   * @param maxRating - Maximum team rating (for normalization)
   * @returns Normalized rating (0-10 scale)
   */
  static calculateTeamRatingNorm(
    teamRating: number | null,
    maxRating: number
  ): number | null {
    if (!teamRating || teamRating === 0) return null
    if (maxRating === 0) return null

    try {
      const normalized = (teamRating * 10) / maxRating
      return Math.round(normalized * 100) / 100 // Round to 2 decimals
    } catch (error) {
      // Handle any calculation errors (equivalent to SI.ERROR in Excel)
      return null
    }
  }

  /**
   * Calculate team_elo
   * Formula: =SI.ERROR(SI(ESBLANCO(B2); ""; PROMEDIO(N2; Q2)); "")
   * Average of team_trfm_val_use_norm and team_rating_norm
   *
   * @param valueNorm - Normalized team value
   * @param ratingNorm - Normalized team rating
   * @returns Average Elo score
   */
  static calculateTeamElo(
    valueNorm: number | null,
    ratingNorm: number | null
  ): number | null {
    const values = [valueNorm, ratingNorm].filter((v): v is number => v !== null)

    if (values.length === 0) return null

    const average = values.reduce((sum, val) => sum + val, 0) / values.length
    return Math.round(average * 100) / 100 // Round to 2 decimals
  }

  /**
   * Calculate team_level
   * Formula: =SI(R2="-"; "-"; SI(R2>=9; "A+"; SI(R2>=7; "A"; SI(R2>=5; "B"; SI(R2>=3; "C"; "D")))))
   *
   * @param elo - Team Elo score
   * @param hasName - Whether team has a name
   * @returns Qualitative level (A+, A, B, C, D, or null)
   */
  static calculateTeamLevel(elo: number | null, hasName: boolean): string | null {
    if (!hasName || elo === null) return null

    if (elo >= 9) return 'A+'
    if (elo >= 7) return 'A'
    if (elo >= 5) return 'B'
    if (elo >= 3) return 'C'
    return 'D'
  }

  /**
   * Calculate all team-based values for a single team
   *
   * @param teamId - Team's ID
   * @param maxValue - Maximum team market value (pass to avoid repeated queries)
   * @param maxRating - Maximum team rating (pass to avoid repeated queries)
   * @returns Object with calculated values
   */
  static async calculateTeamValues(
    teamId: string,
    maxValue?: number,
    maxRating?: number
  ): Promise<{
    team_trfm_value_norm: number | null
    team_rating_norm: number | null
    team_elo: number | null
    team_level: string | null
  }> {
    const team = await prisma.equipo.findUnique({
      where: { id_team: teamId },
      select: {
        team_name: true,
        correct_team_name: true,
        team_trfm_value: true,
        team_rating: true
      }
    })

    if (!team) {
      return {
        team_trfm_value_norm: null,
        team_rating_norm: null,
        team_elo: null,
        team_level: null
      }
    }

    // Get max values if not provided
    const maxTeamValue = maxValue ?? await this.getMaxTeamValue()
    const maxTeamRating = maxRating ?? await this.getMaxTeamRating()

    const team_trfm_value_norm = this.calculateTeamValueNorm(
      team.team_trfm_value,
      maxTeamValue
    )
    const team_rating_norm = this.calculateTeamRatingNorm(
      team.team_rating,
      maxTeamRating
    )
    const team_elo = this.calculateTeamElo(
      team_trfm_value_norm,
      team_rating_norm
    )
    const hasName = !!(team.team_name || team.correct_team_name)
    const team_level = this.calculateTeamLevel(team_elo, hasName)

    return {
      team_trfm_value_norm,
      team_rating_norm,
      team_elo,
      team_level
    }
  }

  /**
   * Update team-based values for a single team in the database
   *
   * @param teamId - Team's ID
   * @param maxValue - Optional: maximum team market value
   * @param maxRating - Optional: maximum team rating
   * @returns Updated team record
   */
  static async updateTeamValues(
    teamId: string,
    maxValue?: number,
    maxRating?: number
  ) {
    const values = await this.calculateTeamValues(teamId, maxValue, maxRating)

    return await prisma.equipo.update({
      where: { id_team: teamId },
      data: {
        team_trfm_value_norm: values.team_trfm_value_norm,
        team_rating_norm: values.team_rating_norm,
        team_elo: values.team_elo,
        team_level: values.team_level
      }
    })
  }

  /**
   * Calculate and update values for all teams in the database
   *
   * @param batchSize - Number of teams to process in each batch
   * @returns Summary of the operation
   */
  static async updateAllTeamsOptimized(
    batchSize: number = 500,
    onProgress?: (current: number, total: number) => void
  ): Promise<{
    total: number
    updated: number
    errors: number
  }> {
    console.log('Getting maximum team values...')
    const maxValue = await this.getMaxTeamValue()
    const maxRating = await this.getMaxTeamRating()
    console.log(`Max team value: €${maxValue.toLocaleString()}`)
    console.log(`Max team rating: ${maxRating}`)

    const totalTeams = await prisma.equipo.count()

    let updated = 0
    let errors = 0
    let offset = 0

    while (offset < totalTeams) {
      const teams = await prisma.equipo.findMany({
        select: {
          id_team: true,
          team_name: true,
          correct_team_name: true,
          team_trfm_value: true,
          team_rating: true
        },
        skip: offset,
        take: batchSize
      })

      // Prepare batch update data
      const updates = teams.map((team: {
        id_team: string
        team_name: string
        correct_team_name: string | null
        team_trfm_value: number | null
        team_rating: number | null
      }) => {
        const team_trfm_value_norm = this.calculateTeamValueNorm(
          team.team_trfm_value,
          maxValue
        )
        const team_rating_norm = this.calculateTeamRatingNorm(
          team.team_rating,
          maxRating
        )
        const team_elo = this.calculateTeamElo(
          team_trfm_value_norm,
          team_rating_norm
        )
        const hasName = !!(team.team_name || team.correct_team_name)
        const team_level = this.calculateTeamLevel(team_elo, hasName)

        return {
          id_team: team.id_team,
          team_trfm_value_norm,
          team_rating_norm,
          team_elo,
          team_level
        }
      })

      // Execute batch update using transaction
      try {
        await prisma.$transaction(
          updates.map((update: {
            id_team: string
            team_trfm_value_norm: number | null
            team_rating_norm: number | null
            team_elo: number | null
            team_level: string | null
          }) =>
            prisma.equipo.update({
              where: { id_team: update.id_team },
              data: {
                team_trfm_value_norm: update.team_trfm_value_norm,
                team_rating_norm: update.team_rating_norm,
                team_elo: update.team_elo,
                team_level: update.team_level
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
        onProgress(Math.min(offset, totalTeams), totalTeams)
      }
    }

    return {
      total: totalTeams,
      updated,
      errors
    }
  }
}
