/**
 * Script to calculate and populate team-based values for all teams
 *
 * This script calculates:
 * - team_trfm_value_norm: Normalized team market value
 * - team_rating_norm: Normalized team rating
 * - team_elo: Average of the two normalized metrics
 * - team_level: Qualitative classification (A+, A, B, C, D)
 *
 * Usage:
 * npx tsx scripts/calculate-team-values.ts
 */

import { TeamCalculationService } from '@/lib/services/team-calculation-service'

async function main() {
  console.log('='.repeat(60))
  console.log('Starting Team Values Calculation')
  console.log('='.repeat(60))
  console.log()

  const startTime = Date.now()

  try {
    const result = await TeamCalculationService.updateAllTeamsOptimized(
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
    console.log(`Total teams: ${result.total}`)
    console.log(`Successfully updated: ${result.updated}`)
    console.log(`Errors: ${result.errors}`)
    console.log()

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`Duration: ${duration}s`)
    console.log()

    if (result.errors > 0) {
      console.warn(`⚠️  ${result.errors} team(s) had errors during calculation`)
      process.exit(1)
    } else {
      console.log('✅ All teams updated successfully!')
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
