#!/usr/bin/env node

/**
 * Data Population Script
 * 
 * This script identifies and populates null values in both atributos and player_stats_3m tables
 * using position-based realistic data generation.
 * 
 * Usage:
 *   node scripts/populate-player-data.js [options]
 * 
 * Options:
 *   --dry-run          Run without making changes (default: false)
 *   --batch-size       Number of players to process per batch (default: 50)
 *   --positions        Comma-separated list of positions to process
 *   --player-ids       Comma-separated list of specific player IDs
 *   --validate         Validate generators before running (default: false)
 *   --stats-only       Show population statistics and exit
 *   --help             Show this help message
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Import the DataPopulationService
const { DataPopulationService } = require('../src/lib/services/DataPopulationService');

class DataPopulationScript {
  constructor() {
    this.prisma = new PrismaClient();
    this.service = new DataPopulationService(this.prisma);
    this.startTime = Date.now();
  }

  /**
   * Parse command line arguments
   */
  parseArgs() {
    const args = process.argv.slice(2);
    const options = {
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
          options.positions = args[++i]?.split(',').map(p => p.trim());
          break;
        case '--player-ids':
          options.playerIds = args[++i]?.split(',').map(p => p.trim());
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
  showHelp() {
    console.log(`
📊 Data Population Script

This script populates null values in atributos and player_stats_3m tables
using position-based realistic data generation.

Usage:
  node scripts/populate-player-data.js [options]

Options:
  --dry-run          Run without making changes (default: false)
  --batch-size N     Number of players to process per batch (default: 50)
  --positions LIST   Comma-separated positions (e.g., "ST,CM,CB")
  --player-ids LIST  Comma-separated player IDs to process
  --validate         Validate generators before running
  --stats-only       Show population statistics and exit
  --help             Show this help message

Examples:
  # Dry run to see what would be populated
  node scripts/populate-player-data.js --dry-run

  # Populate only strikers and midfielders
  node scripts/populate-player-data.js --positions "ST,CM,AM"

  # Populate specific players
  node scripts/populate-player-data.js --player-ids "player1,player2"

  # Show current data completeness statistics
  node scripts/populate-player-data.js --stats-only

  # Validate generators before running
  node scripts/populate-player-data.js --validate --dry-run
`);
  }

  /**
   * Show population statistics
   */
  async showStats() {
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
      
    } catch (error) {
      console.error('❌ Error getting statistics:', error.message);
      throw error;
    }
  }

  /**
   * Validate data generators
   */
  async validateGenerators() {
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
      console.error('❌ Error validating generators:', error.message);
      return false;
    }
  }

  /**
   * Run the population process
   */
  async populate(options) {
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
      const populationOptions = {
        dryRun: options.dryRun,
        batchSize: options.batchSize,
        logProgress: true,
        onlyNullValues: true,
        positions: options.positions,
        playerIds: options.playerIds
      };

      const result = await this.service.populatePlayerData(populationOptions);
      
      // Show results
      console.log('\n📊 Population Results:');
      console.log(`  Players Processed: ${result.playersProcessed.toLocaleString()}`);
      console.log(`  Atributos Updated: ${result.atributosUpdated.toLocaleString()}`);
      console.log(`  Stats Updated: ${result.statsUpdated.toLocaleString()}`);
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
      if (Object.keys(result.populatedFields.atributos).length > 0) {
        console.log('\n🎯 Atributos Fields Populated:');
        const sortedAtributos = Object.entries(result.populatedFields.atributos)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10);
        
        for (const [field, count] of sortedAtributos) {
          console.log(`  ${field.padEnd(25)} ${count.toString().padStart(6)} players`);
        }
      }

      if (Object.keys(result.populatedFields.stats).length > 0) {
        console.log('\n📊 Stats Fields Populated:');
        const sortedStats = Object.entries(result.populatedFields.stats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10);
        
        for (const [field, count] of sortedStats) {
          console.log(`  ${field.padEnd(25)} ${count.toString().padStart(6)} players`);
        }
      }

      if (options.dryRun) {
        console.log('\n💡 This was a dry run. Use without --dry-run to apply changes.');
      } else {
        console.log('\n✅ Data population completed successfully!');
      }

      return result;
      
    } catch (error) {
      console.error('\n❌ Population failed:', error.message);
      throw error;
    }
  }

  /**
   * Main execution method
   */
  async run() {
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
      console.error('\n💥 Script failed:', error.message);
      if (process.env.NODE_ENV === 'development') {
        console.error(error.stack);
      }
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await this.service.disconnect();
      const totalTime = Date.now() - this.startTime;
      console.log(`\n⏱️  Total execution time: ${(totalTime / 1000).toFixed(2)}s`);
    } catch (error) {
      console.error('Warning: Cleanup failed:', error.message);
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  const script = new DataPopulationScript();
  script.run();
}

module.exports = { DataPopulationScript };