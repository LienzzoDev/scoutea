import { prisma } from '@/lib/db'

/**
 * Correction Service
 * Automatically applies correction rules for team names and leagues
 */
export class CorrectionService {
  /**
   * Apply team name correction if a rule exists
   * @param teamName - Original team name
   * @returns Corrected team name or original if no correction found
   */
  static async applyTeamNameCorrection(
    teamName: string | null | undefined
  ): Promise<string | null> {
    if (!teamName) return null

    const trimmedName = teamName.trim()
    if (!trimmedName) return null

    try {
      const correction = await prisma.teamNameCorrection.findUnique({
        where: { original_name: trimmedName },
        select: { corrected_name: true }
      })

      return correction ? correction.corrected_name : trimmedName
    } catch (error) {
      console.error('Error applying team name correction:', error)
      return trimmedName
    }
  }

  /**
   * Apply league correction if a rule exists
   * @param nationalTier - Original national tier
   * @returns Object with corrected rename_national_tier and country, or null if no correction found
   */
  static async applyLeagueCorrection(
    nationalTier: string | null | undefined
  ): Promise<{ rename_national_tier: string; country: string } | null> {
    if (!nationalTier) return null

    const trimmedTier = nationalTier.trim()
    if (!trimmedTier) return null

    try {
      const correction = await prisma.leagueCorrection.findUnique({
        where: { national_tier: trimmedTier },
        select: {
          rename_national_tier: true,
          country: true
        }
      })

      return correction
        ? {
            rename_national_tier: correction.rename_national_tier,
            country: correction.country
          }
        : null
    } catch (error) {
      console.error('Error applying league correction:', error)
      return null
    }
  }

  /**
   * Apply nationality correction if a rule exists
   * @param nationality - Original nationality name
   * @returns Corrected nationality or original if no correction found
   */
  static async applyNationalityCorrection(
    nationality: string | null | undefined
  ): Promise<string | null> {
    if (!nationality) return null

    const trimmedName = nationality.trim()
    if (!trimmedName) return null

    try {
      const correction = await prisma.nationalityCorrection.findUnique({
        where: { original_name: trimmedName },
        select: { corrected_name: true }
      })

      return correction ? correction.corrected_name : trimmedName
    } catch (error) {
      console.error('Error applying nationality correction:', error)
      return trimmedName
    }
  }

  /**
   * Apply competition correction if a rule exists
   * @param competition - Original competition name
   * @returns Corrected competition or original if no correction found
   */
  static async applyCompetitionCorrection(
    competition: string | null | undefined
  ): Promise<string | null> {
    if (!competition) return null

    const trimmedName = competition.trim()
    if (!trimmedName) return null

    try {
      const correction = await prisma.competitionCorrection.findUnique({
        where: { original_name: trimmedName },
        select: { corrected_name: true }
      })

      return correction ? correction.corrected_name : trimmedName
    } catch (error) {
      console.error('Error applying competition correction:', error)
      return trimmedName
    }
  }

  /**
   * Apply all corrections to player data
   * @param data - Partial player data that may contain team_name and/or national_tier
   * @returns Corrected data object
   */
  static async applyPlayerCorrections(data: {
    team_name?: string | null
    national_tier?: string | null
    rename_national_tier?: string | null
    country?: string | null
    nationality_1?: string | null
    nationality_2?: string | null
    nationality_3?: string | null
    competition?: string | null
    [key: string]: any
  }): Promise<typeof data> {
    const correctedData = { ...data }

    // Apply team name correction
    if (data.team_name) {
      const correctedTeamName = await this.applyTeamNameCorrection(
        data.team_name
      )
      if (correctedTeamName) {
        correctedData.team_name = correctedTeamName
      }
    }

    // Apply league correction
    if (data.national_tier) {
      const leagueCorrection = await this.applyLeagueCorrection(
        data.national_tier
      )
      if (leagueCorrection) {
        correctedData.rename_national_tier =
          leagueCorrection.rename_national_tier
        correctedData.country = leagueCorrection.country
      }
    }

    // Apply nationality corrections
    if (data.nationality_1) {
      const correctedNationality = await this.applyNationalityCorrection(
        data.nationality_1
      )
      if (correctedNationality) {
        correctedData.nationality_1 = correctedNationality
      }
    }

    if (data.nationality_2) {
      const correctedNationality = await this.applyNationalityCorrection(
        data.nationality_2
      )
      if (correctedNationality) {
        correctedData.nationality_2 = correctedNationality
      }
    }

    if (data.nationality_3) {
      const correctedNationality = await this.applyNationalityCorrection(
        data.nationality_3
      )
      if (correctedNationality) {
        correctedData.nationality_3 = correctedNationality
      }
    }

    // Apply competition correction
    if (data.competition) {
      const correctedCompetition = await this.applyCompetitionCorrection(
        data.competition
      )
      if (correctedCompetition) {
        correctedData.competition = correctedCompetition
      }
    }

    return correctedData
  }

  /**
   * Batch apply team name corrections
   * @param teamNames - Array of team names
   * @returns Map of original names to corrected names
   */
  static async batchApplyTeamNameCorrections(
    teamNames: string[]
  ): Promise<Map<string, string>> {
    const uniqueNames = [...new Set(teamNames.filter(Boolean))]
    const corrections = new Map<string, string>()

    if (uniqueNames.length === 0) return corrections

    try {
      const correctionRules = await prisma.teamNameCorrection.findMany({
        where: {
          original_name: { in: uniqueNames }
        },
        select: {
          original_name: true,
          corrected_name: true
        }
      })

      correctionRules.forEach((rule) => {
        corrections.set(rule.original_name, rule.corrected_name)
      })

      return corrections
    } catch (error) {
      console.error('Error batch applying team name corrections:', error)
      return corrections
    }
  }

  /**
   * Batch apply league corrections
   * @param nationalTiers - Array of national tiers
   * @returns Map of original tiers to correction objects
   */
  static async batchApplyLeagueCorrections(
    nationalTiers: string[]
  ): Promise<
    Map<string, { rename_national_tier: string; country: string }>
  > {
    const uniqueTiers = [...new Set(nationalTiers.filter(Boolean))]
    const corrections = new Map<
      string,
      { rename_national_tier: string; country: string }
    >()

    if (uniqueTiers.length === 0) return corrections

    try {
      const correctionRules = await prisma.leagueCorrection.findMany({
        where: {
          national_tier: { in: uniqueTiers }
        },
        select: {
          national_tier: true,
          rename_national_tier: true,
          country: true
        }
      })

      correctionRules.forEach((rule) => {
        corrections.set(rule.national_tier, {
          rename_national_tier: rule.rename_national_tier,
          country: rule.country
        })
      })

      return corrections
    } catch (error) {
      console.error('Error batch applying league corrections:', error)
      return corrections
    }
  }
}
