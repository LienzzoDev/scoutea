#!/usr/bin/env tsx

/**
 * Scheduled Radar Update Script
 * 
 * This script is designed to be run on a schedule (e.g., daily via cron)
 * to keep radar data up-to-date with incremental updates.
 * 
 * Usage:
 *   npx tsx scripts/scheduled-radar-update.ts [options]
 * 
 * Cron example (daily at 2 AM):
 *   0 2 * * * cd /path/to/project && npx tsx scripts/scheduled-radar-update.ts
 */

import { PrismaClient } from '@prisma/client';
import { DataPopulationService } from '../src/lib/services/DataPopulationService';
import { RadarCalculationService } from '../src/lib/services/RadarCalculationService';

interface ScheduledUpdateOptions {
  dryRun: boolean;
  batchSize: number;
  maxPlayers: number;
  period: string;
  logLevel: 'minimal' | 'normal' | 'verbose';
  help: boolean;
}

class ScheduledRadarUpdateScript {
  private prisma: PrismaClient;
  private populationService: DataPopulationService;
  private radarService: RadarCalculationService;
  private startTime: number;

  constructor() {
    this.prisma = new PrismaClient();
    this.populationService = new DataPopulationService(this.prisma);
    this.radarService = new RadarCalculationService(this.prisma);
    this.startTime = Date.now();
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(): ScheduledUpdateOptions {
    const args = process.argv.slice(2);
    const options: ScheduledUpdateOptions = {
      dryRun: false,
      batchSize: 20,
      maxPlayers: 1000, // Limit for scheduled runs
      period: '2023-24',
      logLevel: 'normal',
      help: false
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--batch-size':
          options.batchSize = parseInt(args[++i]) || 20;
          break;
        case '--max-players':
          options.maxPlayers = parseInt(args[++i]) || 1000;
          break;
        case '--period':
          options.period = args[++i] || '2023-24';
          break;
        case '--log-level':
          const level = args[++i];
          if (['minimal', 'normal', 'verbose'].includes(level)) {
            options.logLevel = level as any;
          }
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
⏰ Scheduled Radar Update Script

This script performs incremental updates to radar data and is designed
to be run on a schedule (e.g., daily via cron).

Usage:
  npx tsx scripts/scheduled-radar-update.ts [options]

Options:
  --dry-run          Run without making changes (default: false)
  --batch-size N     Number of players to process per batch (default: 20)
  --max-players N    Maximum number of players to process (default: 1000)
  --period PERIOD    Period to calculate for (default: "2023-24")
  --log-level LEVEL  Logging level: minimal, normal, verbose (default: normal)
  --help             Show this help message

Cron Examples:
  # Daily at 2 AM
  0 2 * * * cd /path/to/project && npx tsx scripts/scheduled-radar-update.ts

  # Every 6 hours
  0 */6 * * * cd /path/to/project && npx tsx scripts/scheduled-radar-update.ts

  # Weekly on Sunday at 3 AM (full update)
  0 3 * * 0 cd /path/to/project && npx tsx scripts/scheduled-radar-update.ts --max-players 10000
`);
  }

  /**
   * Log message based on log level
   */
  private log(level: 'minimal' | 'normal' | 'verbose', message: string): void {
    const levels = { minimal: 0, normal: 1, verbose: 2 };
    const currentLevel = levels[this.options?.logLevel || 'normal'];
    const messageLevel = levels[level];
    
    if (messageLevel <= currentLevel) {
      console.log(message);
    }
  }

  private options?: ScheduledUpdateOptions;

  /**
   * Get players that need updates
   */
  private async getPlayersNeedingUpdate(options: ScheduledUpdateOptions): Promise<string[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24); // 24 hours ago

    try {
      // Find players that need updates based on various criteria
      const players = await this.prisma.jugador.findMany({
        where: {
          AND: [
            { atributos: { isNot: null } }, // Must have atributos data
            {
              OR: [
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
                },
                // Players updated recently (data might have changed)
                { updatedAt: { gt: cutoffDate } }
              ]
            }
          ]
        },
        select: { id_player: true },
        orderBy: { player_rating: 'desc' }, // Prioritize higher-rated players
        take: options.maxPlayers
      });

      return players.map(p => p.id_player);
      
    } catch (error) {
      this.log('minimal', `❌ Error finding players needing update: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Run incremental data population
   */
  private async runIncrementalPopulation(playerIds: string[], options: ScheduledUpdateOptions): Promise<any> {
    this.log('normal', '📊 Running incremental data population...');
    
    try {
      const result = await this.populationService.populatePlayerData({
        dryRun: options.dryRun,
        batchSize: options.batchSize,
        logProgress: options.logLevel === 'verbose',
        onlyNullValues: true,
        playerIds: playerIds.slice(0, Math.floor(options.maxPlayers / 2)) // Limit population
      });

      this.log('normal', `  ✓ Populated data for ${result.playersProcessed} players`);
      this.log('verbose', `  ✓ Atributos updated: ${result.atributosUpdated}`);
      this.log('verbose', `  ✓ Stats updated: ${result.statsUpdated}`);
      
      if (result.errors.length > 0) {
        this.log('normal', `  ⚠️  ${result.errors.length} errors during population`);
        if (options.logLevel === 'verbose') {
          result.errors.slice(0, 5).forEach(error => {
            this.log('verbose', `    • ${error}`);
          });
        }
      }

      return result;
      
    } catch (error) {
      this.log('minimal', `❌ Data population failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Run incremental radar calculation
   */
  private async runIncrementalRadarCalculation(playerIds: string[], options: ScheduledUpdateOptions): Promise<any> {
    this.log('normal', '🎯 Running incremental radar calculation...');
    
    try {
      const result = await this.radarService.batchCalculateRadarData(
        playerIds,
        options.period,
        options.batchSize
      );

      this.log('normal', `  ✓ Calculated radar data for ${result.processed} players`);
      
      if (result.errors.length > 0) {
        this.log('normal', `  ⚠️  ${result.errors.length} errors during calculation`);
        if (options.logLevel === 'verbose') {
          result.errors.slice(0, 5).forEach(error => {
            this.log('verbose', `    • ${error}`);
          });
        }
      }

      return result;
      
    } catch (error) {
      this.log('minimal', `❌ Radar calculation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Generate update summary
   */
  private async generateUpdateSummary(options: ScheduledUpdateOptions): Promise<void> {
    this.log('normal', '📊 Generating update summary...');
    
    try {
      const stats = {
        totalPlayers: await this.prisma.jugador.count(),
        playersWithRadar: await this.prisma.jugador.count({
          where: { radarMetrics: { some: { period: options.period } } }
        }),
        recentUpdates: await this.prisma.radarMetrics.count({
          where: {
            period: options.period,
            calculatedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        })
      };

      const coverage = (stats.playersWithRadar / stats.totalPlayers) * 100;
      
      this.log('normal', `  ✓ Total Players: ${stats.totalPlayers.toLocaleString()}`);
      this.log('normal', `  ✓ Players with Radar Data: ${stats.playersWithRadar.toLocaleString()} (${coverage.toFixed(1)}%)`);
      this.log('normal', `  ✓ Recent Updates (24h): ${stats.recentUpdates.toLocaleString()}`);
      
    } catch (error) {
      this.log('verbose', `Warning: Could not generate summary: ${(error as Error).message}`);
    }
  }

  /**
   * Main execution method
   */
  async run(): Promise<void> {
    const options = this.parseArgs();
    this.options = options;
    
    try {
      if (options.help) {
        this.showHelp();
        return;
      }

      const mode = options.dryRun ? 'DRY RUN' : 'LIVE';
      this.log('minimal', `⏰ Scheduled Radar Update (${mode}) - ${new Date().toISOString()}`);
      
      if (options.logLevel === 'verbose') {
        this.log('verbose', `Configuration:`);
        this.log('verbose', `  Period: ${options.period}`);
        this.log('verbose', `  Batch Size: ${options.batchSize}`);
        this.log('verbose', `  Max Players: ${options.maxPlayers}`);
        this.log('verbose', `  Log Level: ${options.logLevel}`);
      }

      // Get players that need updates
      const playersNeedingUpdate = await this.getPlayersNeedingUpdate(options);
      
      if (playersNeedingUpdate.length === 0) {
        this.log('minimal', '✅ No players need updates');
        return;
      }

      this.log('normal', `📋 Found ${playersNeedingUpdate.length} players needing updates`);

      const results = {
        population: null as any,
        radarCalculation: null as any
      };

      // Run incremental data population
      try {
        results.population = await this.runIncrementalPopulation(playersNeedingUpdate, options);
      } catch (error) {
        this.log('minimal', `⚠️  Population step failed, continuing with radar calculation`);
      }

      // Run incremental radar calculation
      try {
        results.radarCalculation = await this.runIncrementalRadarCalculation(playersNeedingUpdate, options);
      } catch (error) {
        this.log('minimal', `❌ Radar calculation step failed`);
        throw error;
      }

      // Generate summary
      await this.generateUpdateSummary(options);

      const totalTime = Date.now() - this.startTime;
      this.log('minimal', `✅ Update completed in ${(totalTime / 1000).toFixed(2)}s`);
      
      if (options.dryRun) {
        this.log('minimal', '💡 This was a dry run - no changes were made');
      }
      
    } catch (error) {
      this.log('minimal', `💥 Scheduled update failed: ${(error as Error).message}`);
      
      // Log error details for debugging
      if (options.logLevel === 'verbose') {
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
      await this.populationService.disconnect();
      await this.radarService.disconnect();
    } catch (error) {
      this.log('verbose', `Warning: Cleanup failed: ${(error as Error).message}`);
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  const script = new ScheduledRadarUpdateScript();
  script.run().catch(console.error);
}

export { ScheduledRadarUpdateScript };