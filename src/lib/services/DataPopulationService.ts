/**
 * DataPopulationService - Service for populating null values in player data
 * 
 * This service uses position-based data generators to fill null values in both
 * atributos and player_stats_3m tables, with comprehensive logging and batch processing.
 */

import { PrismaClient } from '@prisma/client';

import { AtributosDataGenerator } from './data-generators/AtributosDataGenerator';
import { PlayerStatsDataGenerator } from './data-generators/PlayerStatsDataGenerator';


export interface PopulationOptions {
  dryRun?: boolean;
  batchSize?: number;
  logProgress?: boolean;
  onlyNullValues?: boolean;
  positions?: string[];
  playerIds?: string[];
}

export interface PopulationResult {
  playersProcessed: number;
  atributosUpdated: number;
  statsUpdated: number;
  errors: string[];
  populatedFields: {
    atributos: Record<string, number>;
    stats: Record<string, number>;
  };
  executionTime: number;
}

export interface PopulationLogEntry {
  playerId: string;
  playerName: string;
  position: string;
  tableName: 'atributos' | 'player_stats_3m';
  fieldName: string;
  originalValue: string | null;
  populatedValue: number;
  populationMethod: string;
  timestamp: Date;
}

export class DataPopulationService {
  private prisma: PrismaClient;
  private atributosGenerator: AtributosDataGenerator;
  private statsGenerator: PlayerStatsDataGenerator;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.atributosGenerator = new AtributosDataGenerator();
    this.statsGenerator = new PlayerStatsDataGenerator();
  }

  /**
   * Populates null values for all players or a specific subset
   */
  async populatePlayerData(options: PopulationOptions = {}): Promise<PopulationResult> {
    const startTime = Date.now();
    const {
      dryRun = false,
      batchSize = 50,
      logProgress = true,
      onlyNullValues = true,
      positions,
      playerIds
    } = options;

    const result: PopulationResult = {
      playersProcessed: 0,
      atributosUpdated: 0,
      statsUpdated: 0,
      errors: [],
      populatedFields: {
        atributos: {},
        stats: {}
      },
      executionTime: 0
    };

    try {
      // Build query filters
      const whereClause: any = {};
      if (positions && positions.length > 0) {
        whereClause.OR = [
          { position_player: { in: positions } },
          { correct_position_player: { in: positions } }
        ];
      }
      if (playerIds && playerIds.length > 0) {
        whereClause.id_player = { in: playerIds };
      }

      // Get players with their current data
      const players = await this.prisma.jugador.findMany({
        where: whereClause,
        select: {
          id_player: true,
          player_name: true,
          position_player: true,
          correct_position_player: true,
          age: true,
          team_competition: true,
          atributos: true,
          playerStats3m: true
        }
      });

      if (logProgress) {
        console.log(`📊 Found ${players.length} players to process`);
      }

      // Process players in batches
      for (let i = 0; i < players.length; i += batchSize) {
        const batch = players.slice(i, i + batchSize);
        
        if (logProgress) {
          console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(players.length / batchSize)}`);
        }

        for (const player of batch) {
          try {
            await this.processPlayer(player, result, dryRun, onlyNullValues);
            result.playersProcessed++;
          } catch (error) {
            const errorMsg = `Error processing player ${player.player_name} (${player.id_player}): ${error}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);
          }
        }

        // Small delay between batches to avoid overwhelming the database
        if (i + batchSize < players.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      result.executionTime = Date.now() - startTime;

      if (logProgress) {
        console.log(`✅ Population completed in ${result.executionTime}ms`);
        console.log(`📈 Players processed: ${result.playersProcessed}`);
        console.log(`🎯 Atributos updated: ${result.atributosUpdated}`);
        console.log(`📊 Stats updated: ${result.statsUpdated}`);
        if (result.errors.length > 0) {
          console.log(`⚠️  Errors: ${result.errors.length}`);
        }
      }

    } catch (error) {
      result.errors.push(`Service error: ${error}`);
      throw error;
    }

    return result;
  }

  /**
   * Processes a single player's data population
   */
  private async processPlayer(
    player: any,
    result: PopulationResult,
    dryRun: boolean,
    onlyNullValues: boolean
  ): Promise<void> {
    const position = player.correct_position_player || player.position_player || 'Central Midfielder';
    const age = player.age;
    const leagueLevel = player.team_competition;

    // Process atributos
    if (player.atributos) {
      const atributosUpdates = await this.processAtributos(
        player,
        position,
        age,
        leagueLevel,
        onlyNullValues,
        dryRun
      );
      
      if (Object.keys(atributosUpdates).length > 0) {
        result.atributosUpdated++;
        
        // Track populated fields
        for (const field of Object.keys(atributosUpdates)) {
          result.populatedFields.atributos[field] = (result.populatedFields.atributos[field] || 0) + 1;
        }
      }
    }

    // Process player_stats_3m
    if (player.playerStats3m) {
      const statsUpdates = await this.processPlayerStats(
        player,
        position,
        age,
        leagueLevel,
        onlyNullValues,
        dryRun
      );
      
      if (Object.keys(statsUpdates).length > 0) {
        result.statsUpdated++;
        
        // Track populated fields
        for (const field of Object.keys(statsUpdates)) {
          result.populatedFields.stats[field] = (result.populatedFields.stats[field] || 0) + 1;
        }
      }
    }
  }

  /**
   * Processes atributos data for a player
   */
  private async processAtributos(
    player: any,
    position: string,
    age: number | null,
    leagueLevel: string | null,
    onlyNullValues: boolean,
    dryRun: boolean
  ): Promise<Record<string, number>> {
    const currentAtributos = player.atributos;
    const updates: Record<string, number> = {};

    try {
      // Generate new values for null fields
      const generatedValues = this.atributosGenerator.generatePlayerAttributes(
        position,
        currentAtributos,
        age || undefined,
        leagueLevel || undefined
      );

      // Prepare updates
      for (const [field, value] of Object.entries(generatedValues)) {
        if (!onlyNullValues || currentAtributos[field] === null || currentAtributos[field] === undefined) {
          updates[field] = value;
        }
      }

      // Apply updates if not dry run
      if (!dryRun && Object.keys(updates).length > 0) {
        await this.prisma.atributos.update({
          where: { id_player: player.id_player },
          data: updates
        });

        // Log the population
        await this.logPopulation(
          player.id_player,
          player.player_name,
          position,
          'atributos',
          updates,
          currentAtributos
        );
      }

    } catch (error) {
      throw new Error(`Failed to process atributos: ${error}`);
    }

    return updates;
  }

  /**
   * Processes player_stats_3m data for a player
   */
  private async processPlayerStats(
    player: any,
    position: string,
    age: number | null,
    leagueLevel: string | null,
    onlyNullValues: boolean,
    dryRun: boolean
  ): Promise<Record<string, number>> {
    const currentStats = player.playerStats3m;
    const updates: Record<string, number> = {};

    try {
      // Generate new values for null fields
      const generatedValues = this.statsGenerator.generatePlayerStats(
        position,
        currentStats,
        age || undefined,
        leagueLevel || undefined
      );

      // Prepare updates, respecting position-specific rules
      for (const [field, value] of Object.entries(generatedValues)) {
        if (this.statsGenerator.shouldPopulateStat(field, position)) {
          if (!onlyNullValues || currentStats[field] === null || currentStats[field] === undefined) {
            updates[field] = value;
          }
        }
      }

      // Apply updates if not dry run
      if (!dryRun && Object.keys(updates).length > 0) {
        await this.prisma.playerStats3m.update({
          where: { id_player: player.id_player },
          data: updates
        });

        // Log the population
        await this.logPopulation(
          player.id_player,
          player.player_name,
          position,
          'player_stats_3m',
          updates,
          currentStats
        );
      }

    } catch (error) {
      throw new Error(`Failed to process player stats: ${error}`);
    }

    return updates;
  }

  /**
   * Logs population activities to the database
   */
  private async logPopulation(
    playerId: string,
    playerName: string,
    position: string,
    tableName: 'atributos' | 'player_stats_3m',
    updates: Record<string, number>,
    originalData: Record<string, any>
  ): Promise<void> {
    try {
      // Check if DataPopulationLog table exists, if not, skip logging
      // This is a fallback since the table might not be created yet
      const logEntries = Object.entries(updates).map(([field, value]) => ({
        playerId,
        playerName,
        position,
        tableName,
        fieldName: field,
        originalValue: originalData[field]?.toString() || 'null',
        populatedValue: value,
        populationMethod: `position_based_${position.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        timestamp: new Date()
      }));

      // For now, we'll just log to console since the DataPopulationLog table
      // will be created in a later task
      console.log(`📝 Population log for ${playerName}:`, {
        table: tableName,
        fieldsUpdated: Object.keys(updates).length,
        position
      });

    } catch (error) {
      // Don't fail the population if logging fails
      console.warn(`Warning: Could not log population for player ${playerId}: ${error}`);
    }
  }

  /**
   * Gets population statistics for analysis
   */
  async getPopulationStats(): Promise<{
    totalPlayers: number;
    playersWithAtributos: number;
    playersWithStats: number;
    avgAtributosCompleteness: number;
    avgStatsCompleteness: number;
    positionBreakdown: Record<string, {
      count: number;
      avgCompleteness: number;
    }>;
  }> {
    const players = await this.prisma.jugador.findMany({
      select: {
        position_player: true,
        correct_position_player: true,
        atributos: true,
        playerStats3m: true
      }
    });

    const stats = {
      totalPlayers: players.length,
      playersWithAtributos: 0,
      playersWithStats: 0,
      avgAtributosCompleteness: 0,
      avgStatsCompleteness: 0,
      positionBreakdown: {} as Record<string, { count: number; avgCompleteness: number }>
    };

    let totalAtributosCompleteness = 0;
    let totalStatsCompleteness = 0;

    for (const player of players) {
      const position = player.correct_position_player || player.position_player || 'Unknown';
      
      if (!stats.positionBreakdown[position]) {
        stats.positionBreakdown[position] = { count: 0, avgCompleteness: 0 };
      }
      stats.positionBreakdown[position].count++;

      if (player.atributos) {
        stats.playersWithAtributos++;
        // Calculate completeness (simplified)
        const nonNullCount = Object.values(player.atributos).filter(v => v !== null).length;
        const totalFields = Object.keys(player.atributos).length;
        const completeness = totalFields > 0 ? (nonNullCount / totalFields) * 100 : 0;
        totalAtributosCompleteness += completeness;
      }

      if (player.playerStats3m) {
        stats.playersWithStats++;
        // Calculate completeness (simplified)
        const nonNullCount = Object.values(player.playerStats3m).filter(v => v !== null).length;
        const totalFields = Object.keys(player.playerStats3m).length;
        const completeness = totalFields > 0 ? (nonNullCount / totalFields) * 100 : 0;
        totalStatsCompleteness += completeness;
      }
    }

    stats.avgAtributosCompleteness = stats.playersWithAtributos > 0 
      ? totalAtributosCompleteness / stats.playersWithAtributos 
      : 0;
    stats.avgStatsCompleteness = stats.playersWithStats > 0 
      ? totalStatsCompleteness / stats.playersWithStats 
      : 0;

    return stats;
  }

  /**
   * Validates the data generators with a small sample
   */
  async validateGenerators(): Promise<{
    atributosValid: boolean;
    statsValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let atributosValid = true;
    let statsValid = true;

    try {
      // Test atributos generator
      const testAtributos = {
        finishing_fmi: null,
        tackling_fmi: null,
        passing_fmi: null
      };

      const generatedAtributos = this.atributosGenerator.generatePlayerAttributes(
        'Striker',
        testAtributos
      );

      // Validate ranges
      if (generatedAtributos.finishing_fmi < 70 || generatedAtributos.finishing_fmi > 95) {
        errors.push('Atributos generator: finishing_fmi out of expected range for Striker');
        atributosValid = false;
      }

      if (generatedAtributos.tackling_fmi < 10 || generatedAtributos.tackling_fmi > 40) {
        errors.push('Atributos generator: tackling_fmi out of expected range for Striker');
        atributosValid = false;
      }

    } catch (error) {
      errors.push(`Atributos generator error: ${error}`);
      atributosValid = false;
    }

    try {
      // Test stats generator
      const testStats = {
        goals_p90_3m: null,
        tackles_p90_3m: null
      };

      const generatedStats = this.statsGenerator.generatePlayerStats(
        'Striker',
        testStats
      );

      // Validate ranges
      if (generatedStats.goals_p90_3m < 0.2 || generatedStats.goals_p90_3m > 1.2) {
        errors.push('Stats generator: goals_p90_3m out of expected range for Striker');
        statsValid = false;
      }

    } catch (error) {
      errors.push(`Stats generator error: ${error}`);
      statsValid = false;
    }

    return {
      atributosValid,
      statsValid,
      errors
    };
  }

  /**
   * Cleanup method to disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}