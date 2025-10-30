/**
 * Script to calculate and populate nationality-based values for all players
 *
 * This script calculates:
 * - nationality_value: Average market value of players with same nationality_1
 * - nationality_value_%: Percentage deviation from nationality-based expected value
 *
 * Usage:
 * npx tsx scripts/calculate-nationality-values.ts
 */

import { NationalityCalculationService } from '@/lib/services/nationality-calculation-service'

async function main() {
  console.log('='.repeat(60))
  console.log('Starting Nationality Values Calculation')
  console.log('='.repeat(60))
  console.log()

  const startTime = Date.now()

  try {
    const result = await NationalityCalculationService.updateAllPlayersNationalityValuesOptimized(
      500, // batch size
      (current, total) => {
        const percentage = Math.round((current / total) * 100)
        const bar = '█'.repeat(Math.floor(percentage / 2))
        const empty = '░'.repeat(50 - Math.floor(percentage / 2))
        process.stdout.write(
          `\rProgress: [${bar}${empty}] ${percentage}% (${current}/${total})`
        )
      }
    )

    console.log('\n')
    console.log('='.repeat(60))
    console.log('Calculation Complete')
    console.log('='.repeat(60))
    console.log()
    console.log(`Total players: ${result.total}`)
    console.log(`Successfully updated: ${result.updated}`)
    console.log(`Errors: ${result.errors}`)
    console.log()

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`Duration: ${duration}s`)
    console.log()

    if (result.errors > 0) {
      console.warn(`⚠️  ${result.errors} player(s) had errors during calculation`)
      process.exit(1)
    } else {
      console.log('✅ All players updated successfully!')
      process.exit(0)
    }
  } catch (error) {
    console.error()
    console.error('❌ Fatal error during calculation:')
    console.error(error)
    process.exit(1)
  }
}

main()
