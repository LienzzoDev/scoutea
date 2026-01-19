import { PrismaClient, Prisma } from '@prisma/client'

import { logger } from '../logging/production-logger'

/**
 * Configuration for data population
 */
export interface PopulationOptions {
  dryRun?: boolean
  batchSize?: number
  logProgress?: boolean
  onlyNullValues?: boolean
  positions?: string[]
  playerIds?: number[]
}

/**
 * Result of data population
 */
export interface PopulationResult {
  playersProcessed: number
  fieldsPopulated: number
  atributosUpdated: number
  statsUpdated: number
  executionTime: number
  errors: string[]
  populatedFields: {
    atributos: Record<string, number>
    stats: Record<string, number>
    jugadores: Record<string, number>
  }
}

/**
 * Statistics for data population
 */
export interface PopulationStats {
  totalPlayers: number
  playersWithAtributos: number
  playersWithStats: number
  avgAtributosCompleteness: number
  avgStatsCompleteness: number
  positionBreakdown: Record<string, { count: number; avgCompleteness: number }>
}

/**
 * Validation result for generators
 */
export interface ValidationResult {
  atributosValid: boolean
  statsValid: boolean
  errors: string[]
}

// Sample data for populating missing fields
const SAMPLE_DATA = {
  // Football positions - standard abbreviations
  positions: [
    'GK', 'CB', 'LB', 'RB', 'RWB', 'LWB',
    'CDM', 'CM', 'CAM', 'RM', 'LM',
    'RW', 'LW', 'CF', 'ST'
  ],

  // Preferred foot options
  feet: ['Right', 'Left', 'Both'],

  // Common nationalities with tiers
  nationalities: {
    'Tier 1': ['Spain', 'France', 'Brazil', 'Argentina', 'Germany', 'Italy', 'Portugal', 'England', 'Netherlands', 'Belgium'],
    'Tier 2': ['Colombia', 'Mexico', 'Uruguay', 'Croatia', 'Poland', 'Denmark', 'Sweden', 'Switzerland', 'Austria', 'Serbia'],
    'Tier 3': ['Chile', 'Ecuador', 'Peru', 'Paraguay', 'Venezuela', 'Czech Republic', 'Hungary', 'Norway', 'Finland', 'Iceland'],
    'Tier 4': ['Bolivia', 'Costa Rica', 'Panama', 'Honduras', 'El Salvador', 'Guatemala', 'Jamaica', 'Trinidad and Tobago']
  },

  // Common agencies
  agencies: [
    'CAA Sports', 'Wasserman', 'ICM Partners', 'Stellar Group',
    'Base Soccer', 'Promoesport', 'You First Sports', 'Gestifute',
    'Sports Entertainment Group', 'Bahia International', 'Key Sports Management',
    'Unique Sports Group', 'Relatives & Football', 'World Soccer Agency'
  ],

  // Team countries with competitions
  teamCountries: {
    'Spain': { competition: 'La Liga', tier: '1', confederation: 'UEFA', elo: 1800 },
    'England': { competition: 'Premier League', tier: '1', confederation: 'UEFA', elo: 1850 },
    'Italy': { competition: 'Serie A', tier: '1', confederation: 'UEFA', elo: 1750 },
    'Germany': { competition: 'Bundesliga', tier: '1', confederation: 'UEFA', elo: 1780 },
    'France': { competition: 'Ligue 1', tier: '1', confederation: 'UEFA', elo: 1720 },
    'Portugal': { competition: 'Primeira Liga', tier: '2', confederation: 'UEFA', elo: 1650 },
    'Netherlands': { competition: 'Eredivisie', tier: '2', confederation: 'UEFA', elo: 1620 },
    'Brazil': { competition: 'Brasileirão', tier: '2', confederation: 'CONMEBOL', elo: 1680 },
    'Argentina': { competition: 'Liga Profesional', tier: '2', confederation: 'CONMEBOL', elo: 1640 },
    'Mexico': { competition: 'Liga MX', tier: '2', confederation: 'CONCACAF', elo: 1550 },
    'Belgium': { competition: 'Pro League', tier: '2', confederation: 'UEFA', elo: 1580 },
    'United States': { competition: 'MLS', tier: '3', confederation: 'CONCACAF', elo: 1450 },
    'Turkey': { competition: 'Süper Lig', tier: '2', confederation: 'UEFA', elo: 1560 },
    'Russia': { competition: 'Premier Liga', tier: '2', confederation: 'UEFA', elo: 1520 },
    'Ukraine': { competition: 'Premier League', tier: '3', confederation: 'UEFA', elo: 1480 }
  },

  // Team levels based on rating
  teamLevels: [
    { min: 80, max: 100, level: 'Elite', value: 5 },
    { min: 70, max: 79, level: 'Top Tier', value: 4 },
    { min: 60, max: 69, level: 'High', value: 3 },
    { min: 50, max: 59, level: 'Mid', value: 2 },
    { min: 0, max: 49, level: 'Low', value: 1 }
  ],

  // Competition levels
  competitionLevels: [
    { tier: '1', level: 'Elite', value: 5 },
    { tier: '2', level: 'High', value: 4 },
    { tier: '3', level: 'Mid', value: 3 },
    { tier: '4', level: 'Low', value: 2 }
  ],

  // Player level based on rating
  playerLevels: [
    { min: 85, max: 100, level: 'World Class' },
    { min: 80, max: 84, level: 'Elite' },
    { min: 75, max: 79, level: 'Top Professional' },
    { min: 70, max: 74, level: 'Professional' },
    { min: 65, max: 69, level: 'Semi-Professional' },
    { min: 0, max: 64, level: 'Amateur' }
  ]
}

/**
 * DataPopulationService
 *
 * Comprehensive service for populating all missing data in the Jugador table
 * and related tables (Atributos, PlayerStats3m).
 */
export class DataPopulationService {
  private prisma: PrismaClient

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient()
  }

  /**
   * Main method to populate all player data
   */
  async populatePlayerData(options: PopulationOptions = {}): Promise<PopulationResult> {
    const {
      dryRun = false,
      batchSize = 50,
      logProgress = true,
      onlyNullValues = true,
      positions,
      playerIds
    } = options

    const startTime = Date.now()
    const result: PopulationResult = {
      playersProcessed: 0,
      fieldsPopulated: 0,
      atributosUpdated: 0,
      statsUpdated: 0,
      executionTime: 0,
      errors: [],
      populatedFields: {
        atributos: {},
        stats: {},
        jugadores: {}
      }
    }

    try {
      // Build query filters
      const where: Prisma.JugadorWhereInput = {}

      if (positions && positions.length > 0) {
        where.position_player = { in: positions }
      }

      if (playerIds && playerIds.length > 0) {
        where.id_player = { in: playerIds }
      }

      // Get total count
      const totalPlayers = await this.prisma.jugador.count({ where })

      if (logProgress) {
        logger.info(`📊 Starting population for ${totalPlayers} players (${dryRun ? 'DRY RUN' : 'LIVE'})`)
      }

      // Process in batches
      let cursor: number | undefined = undefined
      let processed = 0

      while (processed < totalPlayers) {
        const players = await this.prisma.jugador.findMany({
          where,
          take: batchSize,
          ...(cursor ? { skip: 1, cursor: { id_player: cursor } } : {}),
          orderBy: { id_player: 'asc' },
          include: {
            atributos: true,
            playerStats3m: true
          }
        })

        if (players.length === 0) break

        for (const player of players) {
          try {
            const updates = this.generatePlayerUpdates(player, onlyNullValues)

            // Count populated fields
            for (const [field, _value] of Object.entries(updates)) {
              result.populatedFields.jugadores[field] = (result.populatedFields.jugadores[field] || 0) + 1
              result.fieldsPopulated++
            }

            if (!dryRun && Object.keys(updates).length > 0) {
              await this.prisma.jugador.update({
                where: { id_player: player.id_player },
                data: updates
              })
            }

            result.playersProcessed++
          } catch (error) {
            result.errors.push(`Player ${player.id_player}: ${error instanceof Error ? error.message : String(error)}`)
          }
        }

        processed += players.length
        cursor = players[players.length - 1]?.id_player

        if (logProgress && processed % (batchSize * 2) === 0) {
          logger.info(`✅ Processed ${processed}/${totalPlayers} players (${Math.round(processed / totalPlayers * 100)}%)`)
        }
      }

      result.executionTime = Date.now() - startTime

      if (logProgress) {
        logger.info(`🎉 Population complete: ${result.playersProcessed} players, ${result.fieldsPopulated} fields`)
      }

      return result

    } catch (error) {
      logger.error('Error in populatePlayerData:', error)
      result.errors.push(error instanceof Error ? error.message : String(error))
      result.executionTime = Date.now() - startTime
      return result
    }
  }

  /**
   * Generate all updates needed for a player
   */
  private generatePlayerUpdates(
    player: Prisma.JugadorGetPayload<{ include: { atributos: true; playerStats3m: true } }>,
    onlyNullValues: boolean
  ): Partial<Prisma.JugadorUpdateInput> {
    const updates: Partial<Prisma.JugadorUpdateInput> = {}

    // Helper to check if we should update a field
    const shouldUpdate = (currentValue: any): boolean => {
      if (!onlyNullValues) return true
      return currentValue === null || currentValue === undefined || currentValue === ''
    }

    // 1. Date of birth and age
    if (shouldUpdate(player.date_of_birth)) {
      const dob = this.generateDateOfBirth(player.age)
      updates.date_of_birth = dob
      updates.correct_date_of_birth = dob
    }

    if (shouldUpdate(player.age)) {
      const birthDate = updates.date_of_birth || player.date_of_birth
      if (birthDate) {
        updates.age = this.calculateAge(birthDate as Date)
      } else {
        updates.age = this.randomInt(17, 35)
      }
    }

    // Age-related values
    if (shouldUpdate(player.age_value)) {
      const age = (updates.age || player.age) as number
      updates.age_value = this.calculateAgeValue(age)
    }

    if (shouldUpdate(player.age_value_percent)) {
      updates.age_value_percent = this.randomFloat(40, 100, 1)
    }

    if (shouldUpdate(player.age_coeff)) {
      const age = (updates.age || player.age) as number
      updates.age_coeff = this.calculateAgeCoeff(age)
    }

    // 2. Position
    if (shouldUpdate(player.position_player)) {
      const position = this.getRandomElement(SAMPLE_DATA.positions)
      updates.position_player = position
      updates.correct_position_player = position
    }

    if (shouldUpdate(player.position_value)) {
      updates.position_value = this.randomFloat(50, 100, 1)
    }

    if (shouldUpdate(player.position_value_percent)) {
      updates.position_value_percent = this.randomFloat(40, 100, 1)
    }

    // 3. Physical attributes
    if (shouldUpdate(player.foot)) {
      const foot = this.getRandomElement(SAMPLE_DATA.feet)
      updates.foot = foot
      updates.correct_foot = foot
    }

    if (shouldUpdate(player.height)) {
      const height = this.generateHeight(player.position_player || updates.position_player as string)
      updates.height = height
      updates.correct_height = height
    }

    // 4. Nationality
    if (shouldUpdate(player.nationality_1)) {
      const tier = this.getRandomElement(['Tier 1', 'Tier 2', 'Tier 3'] as const)
      const nationality = this.getRandomElement(SAMPLE_DATA.nationalities[tier])
      updates.nationality_1 = nationality
      updates.correct_nationality_1 = nationality
      updates.national_tier = tier
      updates.rename_national_tier = tier
      updates.correct_national_tier = tier
    }

    if (shouldUpdate(player.nationality_value)) {
      updates.nationality_value = this.randomFloat(50, 100, 1)
    }

    if (shouldUpdate(player.nationality_value_percent)) {
      updates.nationality_value_percent = this.randomFloat(40, 100, 1)
    }

    // Second nationality (30% chance)
    if (shouldUpdate(player.nationality_2) && Math.random() < 0.3) {
      const tier = this.getRandomElement(['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'] as const)
      const availableNationalities = SAMPLE_DATA.nationalities[tier].filter(
        n => n !== (player.nationality_1 || updates.nationality_1)
      )
      if (availableNationalities.length > 0) {
        const nationality2 = this.getRandomElement(availableNationalities)
        updates.nationality_2 = nationality2
        updates.correct_nationality_2 = nationality2
      }
    }

    // 5. Team information
    if (shouldUpdate(player.team_country)) {
      const teamCountry = this.getRandomElement(Object.keys(SAMPLE_DATA.teamCountries))
      updates.team_country = teamCountry

      const countryData = SAMPLE_DATA.teamCountries[teamCountry as keyof typeof SAMPLE_DATA.teamCountries]
      if (countryData) {
        if (shouldUpdate(player.team_competition)) {
          updates.team_competition = countryData.competition
        }
        if (shouldUpdate(player.competition_country)) {
          updates.competition_country = teamCountry
        }
        if (shouldUpdate(player.competition_tier)) {
          updates.competition_tier = countryData.tier
        }
        if (shouldUpdate(player.competition_confederation)) {
          updates.competition_confederation = countryData.confederation
        }
        if (shouldUpdate(player.competition_elo)) {
          updates.competition_elo = countryData.elo + this.randomInt(-100, 100)
        }
      }
    }

    // Team ELO and level
    if (shouldUpdate(player.team_elo)) {
      updates.team_elo = this.randomFloat(1200, 2000, 0)
    }

    const teamElo = (updates.team_elo || player.team_elo) as number
    if (teamElo && shouldUpdate(player.team_level)) {
      const normalized = (teamElo - 1200) / 800 * 100 // Normalize to 0-100
      const levelInfo = SAMPLE_DATA.teamLevels.find(l => normalized >= l.min && normalized <= l.max)
      if (levelInfo) {
        updates.team_level = levelInfo.level
        updates.team_level_value = levelInfo.value
        updates.team_level_value_percent = normalized
      }
    }

    // Competition level values
    if (shouldUpdate(player.team_competition_value)) {
      updates.team_competition_value = this.randomFloat(50, 100, 1)
    }

    if (shouldUpdate(player.team_competition_value_percent)) {
      updates.team_competition_value_percent = this.randomFloat(40, 100, 1)
    }

    if (shouldUpdate(player.competition_level)) {
      const tier = (updates.competition_tier || player.competition_tier) as string
      const levelInfo = SAMPLE_DATA.competitionLevels.find(l => l.tier === tier)
      if (levelInfo) {
        updates.competition_level = levelInfo.level
        updates.competition_level_value = levelInfo.value
        updates.competition_level_value_percent = this.randomFloat(60, 100, 1)
      }
    }

    // 6. Loan status (10% on loan)
    if (shouldUpdate(player.on_loan)) {
      const isOnLoan = Math.random() < 0.1
      updates.on_loan = isOnLoan

      if (isOnLoan) {
        if (shouldUpdate(player.owner_club) && player.team_name) {
          updates.owner_club = `${player.team_name} Owner`
          updates.owner_club_country = player.team_country || updates.team_country
        }
        if (shouldUpdate(player.owner_club_value)) {
          updates.owner_club_value = this.randomFloat(40, 80, 1)
          updates.owner_club_value_percent = this.randomFloat(40, 80, 1)
        }
      }
    }

    // 7. Agency and contract
    if (shouldUpdate(player.agency) && Math.random() < 0.7) {
      const agency = this.getRandomElement(SAMPLE_DATA.agencies)
      updates.agency = agency
      updates.correct_agency = agency
    }

    if (shouldUpdate(player.contract_end)) {
      const contractEnd = this.generateContractEnd()
      updates.contract_end = contractEnd
      updates.correct_contract_end = contractEnd
    }

    // 8. Player rating and value
    if (shouldUpdate(player.player_rating)) {
      updates.player_rating = this.randomFloat(55, 92, 1)
    }

    if (shouldUpdate(player.player_rating_norm)) {
      const rating = (updates.player_rating || player.player_rating) as number
      updates.player_rating_norm = rating / 100
    }

    if (shouldUpdate(player.player_trfm_value)) {
      const rating = (updates.player_rating || player.player_rating || 70) as number
      const age = (updates.age || player.age || 25) as number
      updates.player_trfm_value = this.generateMarketValue(rating, age)
    }

    if (shouldUpdate(player.player_trfm_value_norm)) {
      const value = (updates.player_trfm_value || player.player_trfm_value || 1) as number
      updates.player_trfm_value_norm = Math.log10(value + 1) / 3 // Normalize log scale
    }

    // Player ELO and level
    if (shouldUpdate(player.player_elo)) {
      const rating = (updates.player_rating || player.player_rating || 70) as number
      updates.player_elo = 1000 + (rating - 50) * 20 + this.randomInt(-100, 100)
    }

    if (shouldUpdate(player.player_level)) {
      const rating = (updates.player_rating || player.player_rating || 70) as number
      const levelInfo = SAMPLE_DATA.playerLevels.find(l => rating >= l.min && rating <= l.max)
      if (levelInfo) {
        updates.player_level = levelInfo.level
      }
    }

    // 9. Stats evolution and other metrics
    if (shouldUpdate(player.stats_evo_3m)) {
      updates.stats_evo_3m = this.randomFloat(-10, 15, 2)
    }

    if (shouldUpdate(player.total_fmi_pts_norm)) {
      updates.total_fmi_pts_norm = this.randomFloat(0.3, 0.9, 3)
    }

    if (shouldUpdate(player.community_potential)) {
      updates.community_potential = this.randomFloat(60, 95, 1)
    }

    return updates
  }

  /**
   * Get population statistics
   */
  async getPopulationStats(): Promise<PopulationStats> {
    const [totalPlayers, playersWithAtributos, playersWithStats] = await Promise.all([
      this.prisma.jugador.count(),
      this.prisma.atributos.count(),
      this.prisma.playerStats3m.count()
    ])

    // Get position breakdown
    const positionCounts = await this.prisma.jugador.groupBy({
      by: ['position_player'],
      _count: { id_player: true }
    })

    const positionBreakdown: Record<string, { count: number; avgCompleteness: number }> = {}
    for (const pos of positionCounts) {
      if (pos.position_player) {
        positionBreakdown[pos.position_player] = {
          count: pos._count.id_player,
          avgCompleteness: 0 // Would need additional query to calculate
        }
      }
    }

    return {
      totalPlayers,
      playersWithAtributos,
      playersWithStats,
      avgAtributosCompleteness: playersWithAtributos / totalPlayers * 100,
      avgStatsCompleteness: playersWithStats / totalPlayers * 100,
      positionBreakdown
    }
  }

  /**
   * Validate data generators
   */
  async validateGenerators(): Promise<ValidationResult> {
    const errors: string[] = []

    // Validate position data
    if (SAMPLE_DATA.positions.length === 0) {
      errors.push('No positions defined')
    }

    // Validate nationality data
    for (const [tier, nations] of Object.entries(SAMPLE_DATA.nationalities)) {
      if (nations.length === 0) {
        errors.push(`No nationalities defined for ${tier}`)
      }
    }

    // Validate team countries
    if (Object.keys(SAMPLE_DATA.teamCountries).length === 0) {
      errors.push('No team countries defined')
    }

    return {
      atributosValid: errors.length === 0,
      statsValid: errors.length === 0,
      errors
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }

  // ==================== Helper Methods ====================

  private generateDateOfBirth(age?: number | null): Date {
    const currentYear = new Date().getFullYear()
    const targetAge = age || this.randomInt(17, 35)
    const birthYear = currentYear - targetAge
    const month = this.randomInt(1, 12)
    const day = this.randomInt(1, 28)

    return new Date(birthYear, month - 1, day)
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date()
    let age = today.getFullYear() - dateOfBirth.getFullYear()
    const monthDiff = today.getMonth() - dateOfBirth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--
    }

    return age
  }

  private calculateAgeValue(age: number): number {
    // Peak value around 26-28
    if (age < 21) return 60 + (age - 17) * 5
    if (age <= 28) return 80 + (age - 21) * 2
    if (age <= 32) return 94 - (age - 28) * 3
    return Math.max(50, 82 - (age - 32) * 5)
  }

  private calculateAgeCoeff(age: number): number {
    // Coefficient based on age - peaks at 26
    if (age < 22) return 0.9 + (age - 17) * 0.02
    if (age <= 28) return 1.0 + (28 - age) * 0.005
    return Math.max(0.7, 1.0 - (age - 28) * 0.03)
  }

  private generateHeight(position?: string | null): number {
    // Height based on position
    const baseHeights: Record<string, number> = {
      'GK': 188,
      'CB': 185,
      'LB': 176,
      'RB': 176,
      'RWB': 178,
      'LWB': 178,
      'CDM': 182,
      'CM': 178,
      'CAM': 176,
      'RM': 176,
      'LM': 176,
      'RW': 175,
      'LW': 175,
      'CF': 180,
      'ST': 182
    }

    const baseHeight = position ? (baseHeights[position] || 178) : 178
    return baseHeight + this.randomInt(-8, 8)
  }

  private generateContractEnd(): Date {
    const currentDate = new Date()
    const yearsToAdd = this.randomInt(1, 5)
    const contractEnd = new Date(currentDate)
    contractEnd.setFullYear(currentDate.getFullYear() + yearsToAdd)
    contractEnd.setMonth(5) // June
    contractEnd.setDate(30)

    return contractEnd
  }

  private generateMarketValue(rating: number, age: number): number {
    // Base value from rating
    const baseValue = Math.pow(10, (rating - 50) / 15)

    // Age multiplier (peak at 26)
    let ageMultiplier = 1
    if (age < 22) ageMultiplier = 0.7 + (age - 17) * 0.06
    else if (age <= 28) ageMultiplier = 1.0 + (28 - age) * 0.02
    else if (age <= 32) ageMultiplier = 1.0 - (age - 28) * 0.08
    else ageMultiplier = Math.max(0.2, 0.68 - (age - 32) * 0.1)

    // Add some randomness
    const variance = this.randomFloat(0.8, 1.2, 2)

    return Math.round(baseValue * ageMultiplier * variance * 10) / 10
  }

  private getRandomElement<T>(array: T[]): T {
    const index = Math.floor(Math.random() * array.length)
    return array[index]!
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  private randomFloat(min: number, max: number, decimals: number = 2): number {
    const value = Math.random() * (max - min) + min
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
  }
}

// Legacy static method for backwards compatibility
export const DataPopulationServiceStatic = {
  async populateData(): Promise<{ success: boolean; message: string }> {
    try {
      const service = new DataPopulationService()
      const result = await service.populatePlayerData({ dryRun: false, logProgress: true })
      await service.disconnect()

      return {
        success: result.errors.length === 0,
        message: `Populated ${result.fieldsPopulated} fields for ${result.playersProcessed} players`
      }
    } catch (error) {
      logger.error('Error in DataPopulationService:', error)
      return {
        success: false,
        message: `Failed to populate data: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
}
