/**
 * Script to calculate and populate competition-based values for all competitions
 *
 * This script calculates:
 * - competition_trfm_value_norm: Normalized competition market value
 * - competition_rating_norm: Normalized competition rating
 * - competition_elo: Average of the two normalized metrics
 * - competition_level: Qualitative classification (A+, A, B, C, D)
 *
 * Usage:
 * npx tsx scripts/calculate-competition-values.ts
 */

import { CompetitionCalculationService } from '@/lib/services/competition-calculation-service'

async function main() {
  console.log('='.repeat(60))
  console.log('Starting Competition Values Calculation')
  console.log('='.repeat(60))
  console.log()

  const startTime = Date.now()

  try {
    const result = await CompetitionCalculationService.updateAllCompetitionsOptimized(
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
    console.log(`Total competitions: ${result.total}`)
    console.log(`Successfully updated: ${result.updated}`)
    console.log(`Errors: ${result.errors}`)
    console.log()

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`Duration: ${duration}s`)
    console.log()

    if (result.errors > 0) {
      console.warn(`⚠️  ${result.errors} competition(s) had errors during calculation`)
      process.exit(1)
    } else {
      console.log('✅ All competitions updated successfully!')
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
