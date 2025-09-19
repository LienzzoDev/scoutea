#!/usr/bin/env tsx

/**
 * Radar Calculation Batch Script (TypeScript)
 * 
 * This script calculates and caches radar data for all players using the RadarCalculationService.
 * It supports incremental updates, data quality validation, and scheduling capabilities.
 * 
 * Usage:
 *   npx tsx scripts/calculate-radar-data.ts [options]
 */

import { PrismaClient } from '@prisma/client';
import { RadarCalculationService } from '../src/lib/services/RadarCalculationService';

interface ScriptOptions {
  dryRun: boolean;
  batchSize: number;
  positions: string[] | null;
  playerIds: string[] | null;
  incremental: boolean;
  period: string;
  validate: boolean;
  statsOnly: boolean;
  clearCache: boolean;
  help: boolean;
}

interface CalculationResult {
  processed: number;
  errors: string[];
  executionTime: number;
  categoryStats?: Record<string, number>;
}

interface RadarStats {
  totalPlayers: number;
  playersWithRadar: number;
  totalRadarEntries: number;
  avgDataCompleteness: number;
  lastUpdated: string | null;
  categoryBreakdown: Record<string, number>;
  positionBreakdown: Record<string, number>;
}

interface ValidationResult {
  totalEntries: number;
  categoriesPerPlayer: Record<string, number>;
  dataCompletenessDistribution: Record<string, number>;
  lowQualityPlayers: Array<{
    playerId: string;
    playerName: string;
    position: string | null;
    categoryCount: number;
    avgCompleteness: number;
  }>;
  missingCategories: string[];
}

class RadarCalculationScript {
  private prisma: PrismaClient;
  private service: RadarCalculationService;
  private startTime: number;

  constructor() {
    this.prisma = new PrismaClient();
    this.service = new RadarCalculationService(this.prisma);
    this.startTime = Date.now();
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(): ScriptOptions {
    const args = process.argv.slice(2);
    const options: ScriptOptions = {
      dryRun: false,
      batchSize: 10,
      positions: null,
      playerIds: null,
      incremental: false,
      period: '2023-24',
      validate: false,
      statsOnly: false,
      clearCache: false,
      help: false
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--batch-size':
          options.batchSize = parseInt(args[++i]) || 10;
          break;
        case '--positions':
          options.positions = args[++i]?.split(',').map(p => p.trim()) || null;
          break;
        case '--player-ids':
          options.playerIds = args[++i]?.split(',').map(p => p.trim()) || null;
          break;
        case '--incremental':
          options.incremental = true;
          break;
        case '--period':
          options.period = args[++i] || '2023-24';
          break;
        case '--validate':
          options.validate = true;
          break;
        case '--stats-only':
          options.statsOnly = true;
          break;
        case '--clear-cache':
          options.clearCache = true;
          break;
        case '--help':
          options.help = true;
          break;
        default:
          if (arg.startsWith('--')) {
            console.warn(`⚠️  Unknown option: ${arg}`);
          }
      }
    }

    return options;
  }

  /**
   * Show help message
   */
  private showHelp(): void {
    console.log(`
🎯 Radar Calculation Batch Script

This script calculates and caches radar data for all players using position-based
tactical analysis across 9 categories.

Usage:
  npx tsx scripts/calculate-radar-data.ts [options]

Options:
  --dry-run          Run without making changes (default: false)
  --batch-size N     Number of players to process per batch (default: 10)
  --positions LIST   Comma-separated positions (e.g., "ST,CM,CB")
  --player-ids LIST  Comma-separated player IDs to process
  --incremental      Only update players with changed data
  --period PERIOD    Period to calculate for (default: "2023-24")
  --validate         Validate data quality after calculation
  --stats-only       Show radar statistics and exit
  --clear-cache      Clear existing radar cache before calculation
  --help             Show this help message

Examples:
  # Dry run to see what would be calculated
  npx tsx scripts/calculate-radar-data.ts --dry-run

  # Calculate radar data for all players
  npx tsx scripts/calculate-radar-data.ts

  # Calculate only for strikers and midfielders
  npx tsx scripts/calculate-radar-data.ts --positions "ST,CM,AM"

  # Incremental update (only changed players)
  npx tsx scripts/calculate-radar-data.ts --incremental

  # Clear cache and recalculate everything
  npx tsx scripts/calculate-radar-data.ts --clear-cache

  # Show current radar statistics
  npx tsx scripts/calculate-radar-data.ts --stats-only
`);
  }

  /**
   * Show radar statistics
   */
  private async showStats(): Promise<void> {
    console.log('🎯 Analyzing current radar data...\n');
    
    try {
      const stats = await this.getRadarStats();
      
      console.log('📈 Overall Statistics:');
      console.log(`  Total Players: ${stats.totalPlayers.toLocaleString()}`);
      console.log(`  Players with Radar Data: ${stats.playersWithRadar.toLocaleString()}`);
      console.log(`  Total Radar Entries: ${stats.totalRadarEntries.toLocaleString()}`);
      console.log(`  Avg Data Completeness: ${stats.avgDataCompleteness.toFixed(1)}%`);
      console.log(`  Last Updated: ${stats.lastUpdated || 'Never'}\n`);
      
      console.log('🎯 Category Breakdown:');
      for (const [category, count] of Object.entries(stats.categoryBreakdown)) {
        console.log(`  ${category.padEnd(20)} ${count.toString().padStart(6)} entries`);
      }
      
      console.log('\n📊 Position Breakdown:');
      const sortedPositions = Object.entries(stats.positionBreakdown)
        .sort(([,a], [,b]) => b - a);
      
      for (const [position, count] of sortedPositions) {
        console.log(`  ${position.padEnd(20)} ${count.toString().padStart(6)} players`);
      }
      
    } catch (error) {
      console.error('❌ Error getting statistics:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get radar statistics
   */
  private async getRadarStats(): Promise<RadarStats> {
    const totalPlayers = await this.prisma.jugador.count({
      where: { atributos: { isNot: null } }
    });

    const playersWithRadar = await this.prisma.jugador.count({
      where: { radarMetrics: { some: {} } }
    });

    const totalRadarEntries = await this.prisma.radarMetrics.count();

    const avgDataCompleteness = await this.prisma.radarMetrics.aggregate({
      _avg: { dataCompleteness: true }
    });

    const lastUpdated = await this.prisma.radarMetrics.findFirst({
      orderBy: { calculatedAt: 'desc' },
      select: { calculatedAt: true }
    });

    // Category breakdown
    const categoryStats = await this.prisma.radarMetrics.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    const categoryBreakdown: Record<string, number> = {};
    for (const stat of categoryStats) {
      categoryBreakdown[stat.category] = stat._count.category;
    }

    // Position breakdown
    const positionStats = await this.prisma.jugador.groupBy({
      by: ['position_player'],
      where: { 
        radarMetrics: { some: {} },
        position_player: { not: null }
      },
      _count: { position_player: true }
    });

    const positionBreakdown: Record<string, number> = {};
    for (const stat of positionStats) {
      positionBreakdown[stat.position_player || 'Unknown'] = stat._count.position_player;
    }

    return {
      totalPlayers,
      playersWithRadar,
      totalRadarEntries,
      avgDataCompleteness: avgDataCompleteness._avg.dataCompleteness || 0,
      lastUpdated: lastUpdated?.calculatedAt?.toISOString() || null,
      categoryBreakdown,
      positionBreakdown
    };
  }

  /**
   * Clear existing radar cache
   */
  private async clearCache(period: string): Promise<number> {
    console.log(`🗑️  Clearing radar cache for period: ${period}`);
    
    try {
      const deleted = await this.prisma.radarMetrics.deleteMany({
        where: { period }
      });
      
      console.log(`✅ Cleared ${deleted.count} radar entries`);
      return deleted.count;
      
    } catch (error) {
      console.error('❌ Error clearing cache:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Get players that need radar calculation
   */
  private async getPlayersToProcess(options: ScriptOptions): Promise<Array<{
    id_player: string;
    player_name: string;
    position_player: string | null;
    correct_position_player: string | null;
  }>> {
    const whereClause: any = {
      atributos: { isNot: null } // Only players with atributos data
    };

    // Position filter
    if (options.positions) {
      whereClause.OR = [
        { position_player: { in: options.positions } },
        { correct_position_player: { in: options.positions } }
      ];
    }

    // Specific player IDs
    if (options.playerIds) {
      whereClause.id_player = { in: options.playerIds };
    }

    // Incremental update - only players without recent radar data
    if (options.incremental) {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24); // 24 hours ago
      
      whereClause.OR = [
        // Players with no radar data
        { radarMetrics: { none: { period: options.period } } },
        // Players with old radar data
        { 
          radarMetrics: { 
            some: { 
              period: options.period,
              calculatedAt: { lt: cutoffDate }
            }
          }
        }
      ];
    }

    const players = await this.prisma.jugador.findMany({
      where: whereClause,
      select: {
        id_player: true,
        player_name: true,
        position_player: true,
        correct_position_player: true
      },
      orderBy: { player_rating: 'desc' }
    });

    return players;
  }

  /**
   * Calculate radar data for players
   */
  private async calculateRadarData(options: ScriptOptions): Promise<CalculationResult> {
    const mode = options.dryRun ? 'DRY RUN' : 'LIVE';
    console.log(`🚀 Starting radar calculation (${mode})\n`);
    
    // Show configuration
    console.log('⚙️  Configuration:');
    console.log(`  Mode: ${mode}`);
    console.log(`  Period: ${options.period}`);
    console.log(`  Batch Size: ${options.batchSize}`);
    console.log(`  Incremental: ${options.incremental ? 'Yes' : 'No'}`);
    if (options.positions) {
      console.log(`  Positions: ${options.positions.join(', ')}`);
    }
    if (options.playerIds) {
      console.log(`  Player IDs: ${options.playerIds.length} specified`);
    }
    console.log('');

    try {
      // Clear cache if requested
      if (options.clearCache && !options.dryRun) {
        await this.clearCache(options.period);
        console.log('');
      }

      // Get players to process
      const players = await this.getPlayersToProcess(options);
      console.log(`📊 Found ${players.length} players to process\n`);

      if (players.length === 0) {
        console.log('✅ No players need radar calculation');
        return { processed: 0, errors: [], executionTime: 0 };
      }

      const result: CalculationResult = {
        processed: 0,
        errors: [],
        executionTime: 0,
        categoryStats: {}
      };

      const startTime = Date.now();

      // Process players in batches
      const playerIds = players.map(p => p.id_player);
      
      if (options.dryRun) {
        console.log('💡 DRY RUN: Would calculate radar data for:');
        players.slice(0, 10).forEach(player => {
          const position = player.correct_position_player || player.position_player || 'Unknown';
          console.log(`  • ${player.player_name} (${position})`);
        });
        if (players.length > 10) {
          console.log(`  ... and ${players.length - 10} more players`);
        }
        result.processed = players.length;
      } else {
        console.log('🔄 Processing players...');
        const batchResult = await this.service.batchCalculateRadarData(
          playerIds,
          options.period,
          options.batchSize
        );
        
        result.processed = batchResult.processed;
        result.errors = batchResult.errors;
      }

      result.executionTime = Date.now() - startTime;

      // Show results
      console.log('\n📊 Calculation Results:');
      console.log(`  Players Processed: ${result.processed.toLocaleString()}`);
      console.log(`  Execution Time: ${(result.executionTime / 1000).toFixed(2)}s`);
      
      if (result.errors.length > 0) {
        console.log(`\n⚠️  Errors (${result.errors.length}):`);
        result.errors.slice(0, 10).forEach(error => {
          console.log(`  • ${error}`);
        });
        if (result.errors.length > 10) {
          console.log(`  ... and ${result.errors.length - 10} more errors`);
        }
      }

      if (options.dryRun) {
        console.log('\n💡 This was a dry run. Use without --dry-run to apply changes.');
      } else {
        console.log('\n✅ Radar calculation completed successfully!');
      }

      return result;
      
    } catch (error) {
      console.error('\n❌ Calculation failed:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Validate data quality
   */
  private async validateDataQuality(period: string): Promise<ValidationResult> {
    console.log('🔍 Validating data quality...\n');
    
    try {
      const validation: ValidationResult = {
        totalEntries: 0,
        categoriesPerPlayer: {},
        dataCompletenessDistribution: {},
        lowQualityPlayers: [],
        missingCategories: []
      };

      // Get all radar entries for the period
      const radarEntries = await this.prisma.radarMetrics.findMany({
        where: { period },
        include: {
          player: {
            select: {
              id_player: true,
              player_name: true,
              position_player: true
            }
          }
        }
      });

      validation.totalEntries = radarEntries.length;

      // Group by player
      const playerGroups: Record<string, {
        player: any;
        categories: any[];
        avgCompleteness: number;
      }> = {};

      for (const entry of radarEntries) {
        const playerId = entry.playerId;
        if (!playerGroups[playerId]) {
          playerGroups[playerId] = {
            player: entry.player,
            categories: [],
            avgCompleteness: 0
          };
        }
        playerGroups[playerId].categories.push(entry);
      }

      // Analyze each player
      const expectedCategories = this.service.getSupportedCategories().length;
      
      for (const [playerId, data] of Object.entries(playerGroups)) {
        const categoryCount = data.categories.length;
        const avgCompleteness = data.categories.reduce((sum, cat) => sum + cat.dataCompleteness, 0) / categoryCount;
        
        // Track categories per player
        if (!validation.categoriesPerPlayer[categoryCount]) {
          validation.categoriesPerPlayer[categoryCount] = 0;
        }
        validation.categoriesPerPlayer[categoryCount]++;

        // Track data completeness distribution
        const completenessRange = Math.floor(avgCompleteness / 10) * 10;
        if (!validation.dataCompletenessDistribution[completenessRange]) {
          validation.dataCompletenessDistribution[completenessRange] = 0;
        }
        validation.dataCompletenessDistribution[completenessRange]++;

        // Identify low quality players
        if (avgCompleteness < 50 || categoryCount < expectedCategories) {
          validation.lowQualityPlayers.push({
            playerId,
            playerName: data.player.player_name,
            position: data.player.position_player,
            categoryCount,
            avgCompleteness: Math.round(avgCompleteness)
          });
        }
      }

      // Show validation results
      console.log('📊 Data Quality Report:');
      console.log(`  Total Radar Entries: ${validation.totalEntries.toLocaleString()}`);
      console.log(`  Players with Radar Data: ${Object.keys(playerGroups).length.toLocaleString()}`);
      console.log(`  Expected Categories per Player: ${expectedCategories}`);
      
      console.log('\n🎯 Categories per Player:');
      for (const [count, players] of Object.entries(validation.categoriesPerPlayer)) {
        console.log(`  ${count} categories: ${players} players`);
      }
      
      console.log('\n📈 Data Completeness Distribution:');
      for (const [range, count] of Object.entries(validation.dataCompletenessDistribution)) {
        console.log(`  ${range}-${parseInt(range) + 9}%: ${count} players`);
      }

      if (validation.lowQualityPlayers.length > 0) {
        console.log(`\n⚠️  Low Quality Players (${validation.lowQualityPlayers.length}):`);
        validation.lowQualityPlayers.slice(0, 10).forEach(player => {
          console.log(`  • ${player.playerName} (${player.position}): ${player.categoryCount}/${expectedCategories} categories, ${player.avgCompleteness}% complete`);
        });
        if (validation.lowQualityPlayers.length > 10) {
          console.log(`  ... and ${validation.lowQualityPlayers.length - 10} more players`);
        }
      } else {
        console.log('\n✅ All players have good data quality');
      }

      return validation;
      
    } catch (error) {
      console.error('❌ Error validating data quality:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Main execution method
   */
  async run(): Promise<void> {
    const options = this.parseArgs();
    
    try {
      if (options.help) {
        this.showHelp();
        return;
      }

      console.log('🎯 Radar Calculation Batch Script');
      console.log('==================================\n');

      if (options.statsOnly) {
        await this.showStats();
        return;
      }

      const result = await this.calculateRadarData(options);

      if (options.validate && !options.dryRun) {
        console.log('');
        await this.validateDataQuality(options.period);
      }
      
    } catch (error) {
      console.error('\n💥 Script failed:', (error as Error).message);
      if (process.env.NODE_ENV === 'development') {
        console.error((error as Error).stack);
      }
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    try {
      await this.service.disconnect();
      const totalTime = Date.now() - this.startTime;
      console.log(`\n⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)}s`);
    } catch (error) {
      console.error('Warning: Cleanup failed:', (error as Error).message);
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  const script = new RadarCalculationScript();
  script.run().catch(console.error);
}

export { RadarCalculationScript };