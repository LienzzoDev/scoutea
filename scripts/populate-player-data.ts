#!/usr/bin/env tsx

/**
 * Data Population Script (TypeScript)
 *
 * This script populates ALL null/empty values in the Jugador (players) table
 * using realistic position-based data generation.
 *
 * Usage:
 *   npx tsx scripts/populate-player-data.ts [options]
 *   or
 *   node -r esbuild-register scripts/populate-player-data.ts [options]
 */

import { PrismaClient } from '@prisma/client';
import { DataPopulationService, PopulationOptions, PopulationResult } from '../src/lib/services/DataPopulationService';

interface ScriptOptions {
  dryRun: boolean;
  batchSize: number;
  positions: string[] | null;
  playerIds: number[] | null;
  validate: boolean;
  statsOnly: boolean;
  help: boolean;
}

class DataPopulationScript {
  private prisma: PrismaClient;
  private service: DataPopulationService;
  private startTime: number;

  constructor() {
    this.prisma = new PrismaClient();
    this.service = new DataPopulationService(this.prisma);
    this.startTime = Date.now();
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(): ScriptOptions {
    const args = process.argv.slice(2);
    const options: ScriptOptions = {
      dryRun: false,
      batchSize: 50,
      positions: null,
      playerIds: null,
      validate: false,
      statsOnly: false,
      help: false
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--batch-size':
          options.batchSize = parseInt(args[++i]) || 50;
          break;
        case '--positions':
          options.positions = args[++i]?.split(',').map(p => p.trim()) || null;
          break;
        case '--player-ids':
          options.playerIds = args[++i]?.split(',').map(p => parseInt(p.trim())).filter(id => !isNaN(id)) || null;
          break;
        case '--validate':
          options.validate = true;
          break;
        case '--stats-only':
          options.statsOnly = true;
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
📊 Player Data Population Script

This script populates ALL null/empty values in the Jugador (players) table
using realistic position-based data generation.

Usage:
  npx tsx scripts/populate-player-data.ts [options]

Options:
  --dry-run          Run without making changes (default: false)
  --batch-size N     Number of players to process per batch (default: 50)
  --positions LIST   Comma-separated positions (e.g., "ST,CM,CB")
  --player-ids LIST  Comma-separated player IDs to process (numeric)
  --validate         Validate generators before running
  --stats-only       Show population statistics and exit
  --help             Show this help message

Examples:
  # Dry run to see what would be populated
  npx tsx scripts/populate-player-data.ts --dry-run

  # Populate only strikers and midfielders
  npx tsx scripts/populate-player-data.ts --positions "ST,CM,CAM"

  # Populate specific players by ID
  npx tsx scripts/populate-player-data.ts --player-ids "1,2,3,4,5"

  # Show current data completeness statistics
  npx tsx scripts/populate-player-data.ts --stats-only

  # Validate generators before running
  npx tsx scripts/populate-player-data.ts --validate --dry-run

Fields Populated:
  - Personal: date_of_birth, age, age_value, age_coeff, height, foot
  - Position: position_player, position_value, position_value_percent
  - Nationality: nationality_1, nationality_2, nationality_value, national_tier
  - Team: team_country, team_elo, team_level, team_level_value
  - Competition: team_competition, competition_tier, competition_confederation, competition_elo
  - Contract: agency, contract_end, on_loan, owner_club
  - Value: player_rating, player_trfm_value, player_elo, player_level
  - Stats: stats_evo_3m, total_fmi_pts_norm, community_potential
`);
  }

  /**
   * Show population statistics
   */
  private async showStats(): Promise<void> {
    console.log('📊 Analyzing current data completeness...\n');

    try {
      const stats = await this.service.getPopulationStats();

      console.log('📈 Overall Statistics:');
      console.log(`  Total Players: ${stats.totalPlayers.toLocaleString()}`);
      console.log(`  Players with Atributos: ${stats.playersWithAtributos.toLocaleString()}`);
      console.log(`  Players with Stats: ${stats.playersWithStats.toLocaleString()}`);
      console.log(`  Avg Atributos Completeness: ${stats.avgAtributosCompleteness.toFixed(1)}%`);
      console.log(`  Avg Stats Completeness: ${stats.avgStatsCompleteness.toFixed(1)}%\n`);

      console.log('🎯 Position Breakdown:');
      const sortedPositions = Object.entries(stats.positionBreakdown)
        .sort(([,a], [,b]) => b.count - a.count);

      for (const [position, data] of sortedPositions) {
        console.log(`  ${position.padEnd(20)} ${data.count.toString().padStart(6)} players`);
      }

      // Additional field completeness stats
      console.log('\n📋 Field Completeness Analysis:');
      await this.showFieldCompleteness();

    } catch (error) {
      console.error('❌ Error getting statistics:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Show field completeness for key fields
   */
  private async showFieldCompleteness(): Promise<void> {
    const totalPlayers = await this.prisma.jugador.count();

    const fieldsToCheck = [
      { field: 'date_of_birth', label: 'Date of Birth' },
      { field: 'age', label: 'Age' },
      { field: 'position_player', label: 'Position' },
      { field: 'foot', label: 'Foot' },
      { field: 'height', label: 'Height' },
      { field: 'nationality_1', label: 'Nationality' },
      { field: 'team_country', label: 'Team Country' },
      { field: 'team_competition', label: 'Competition' },
      { field: 'agency', label: 'Agency' },
      { field: 'contract_end', label: 'Contract End' },
      { field: 'player_rating', label: 'Player Rating' },
      { field: 'player_trfm_value', label: 'Market Value' },
      { field: 'team_elo', label: 'Team ELO' },
      { field: 'player_elo', label: 'Player ELO' }
    ];

    for (const { field, label } of fieldsToCheck) {
      const count = await this.prisma.jugador.count({
        where: { [field]: { not: null } }
      });
      const percent = ((count / totalPlayers) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(count / totalPlayers * 20)) + '░'.repeat(20 - Math.round(count / totalPlayers * 20));
      console.log(`  ${label.padEnd(18)} ${bar} ${count.toString().padStart(6)}/${totalPlayers} (${percent}%)`);
    }
  }

  /**
   * Validate data generators
   */
  private async validateGenerators(): Promise<boolean> {
    console.log('🔍 Validating data generators...\n');

    try {
      const validation = await this.service.validateGenerators();

      if (validation.atributosValid && validation.statsValid) {
        console.log('✅ All generators are working correctly');
        return true;
      } else {
        console.log('❌ Generator validation failed:');
        for (const error of validation.errors) {
          console.log(`  • ${error}`);
        }
        return false;
      }

    } catch (error) {
      console.error('❌ Error validating generators:', (error as Error).message);
      return false;
    }
  }

  /**
   * Run the population process
   */
  private async populate(options: ScriptOptions): Promise<PopulationResult> {
    const mode = options.dryRun ? 'DRY RUN' : 'LIVE';
    console.log(`🚀 Starting data population (${mode})\n`);

    // Show configuration
    console.log('⚙️  Configuration:');
    console.log(`  Mode: ${mode}`);
    console.log(`  Batch Size: ${options.batchSize}`);
    if (options.positions) {
      console.log(`  Positions: ${options.positions.join(', ')}`);
    }
    if (options.playerIds) {
      console.log(`  Player IDs: ${options.playerIds.length} specified`);
    }
    console.log('');

    try {
      const populationOptions: PopulationOptions = {
        dryRun: options.dryRun,
        batchSize: options.batchSize,
        logProgress: true,
        onlyNullValues: true,
        positions: options.positions || undefined,
        playerIds: options.playerIds || undefined
      };

      const result = await this.service.populatePlayerData(populationOptions);

      // Show results
      console.log('\n📊 Population Results:');
      console.log(`  Players Processed: ${result.playersProcessed.toLocaleString()}`);
      console.log(`  Fields Populated: ${result.fieldsPopulated.toLocaleString()}`);
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

      // Show field breakdown
      if (Object.keys(result.populatedFields.jugadores).length > 0) {
        console.log('\n🎯 Jugador Fields Populated:');
        const sortedFields = Object.entries(result.populatedFields.jugadores)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 15);

        for (const [field, count] of sortedFields) {
          console.log(`  ${field.padEnd(30)} ${count.toString().padStart(6)} players`);
        }

        if (Object.keys(result.populatedFields.jugadores).length > 15) {
          console.log(`  ... and ${Object.keys(result.populatedFields.jugadores).length - 15} more fields`);
        }
      }

      if (options.dryRun) {
        console.log('\n💡 This was a dry run. Use without --dry-run to apply changes.');
      } else {
        console.log('\n✅ Data population completed successfully!');
      }

      return result;

    } catch (error) {
      console.error('\n❌ Population failed:', (error as Error).message);
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

      console.log('🏈 Player Data Population Script');
      console.log('================================\n');

      if (options.statsOnly) {
        await this.showStats();
        return;
      }

      if (options.validate) {
        const isValid = await this.validateGenerators();
        if (!isValid) {
          console.log('\n❌ Validation failed. Please fix generators before proceeding.');
          process.exit(1);
        }
        console.log('');
      }

      await this.populate(options);

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
  const script = new DataPopulationScript();
  script.run().catch(console.error);
}

export { DataPopulationScript };
