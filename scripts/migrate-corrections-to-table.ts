/**
 * Migration Script: Populate PlayerCorrection Table
 *
 * Purpose: Migrate existing corrections from denormalized "correct_*" fields
 * in the Jugador table to the normalized PlayerCorrection audit table.
 *
 * This script:
 * 1. Reads all players from the database
 * 2. Compares original fields with their "correct_*" counterparts
 * 3. Creates PlayerCorrection records for each difference found
 * 4. Provides detailed logging of the migration process
 *
 * Usage: npm run migrate:corrections
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping of original fields to their correct_* counterparts
const CORRECTION_FIELD_MAPPINGS = [
  { original: 'team_name', corrected: 'correct_team_name' },
  { original: 'position_player', corrected: 'correct_position_player' },
  { original: 'nationality_1', corrected: 'correct_nationality_1' },
  { original: 'nationality_2', corrected: 'correct_nationality_2' },
  { original: 'date_of_birth', corrected: 'correct_date_of_birth' },
  { original: 'height', corrected: 'correct_height' },
  { original: 'foot', corrected: 'correct_foot' },
  { original: 'national_tier', corrected: 'correct_national_tier' },
  { original: 'team_loan_from', corrected: 'correct_team_loan_from' },
  { original: 'agency', corrected: 'correct_agency' },
  { original: 'contract_end', corrected: 'correct_contract_end' },
] as const

interface CorrectionToCreate {
  player_id: string
  field_name: string
  original_value: string | null
  corrected_value: string
  correction_date: Date
  corrected_by: string
  is_verified: boolean
}

async function migrateCorrections() {
  console.log('🚀 Starting PlayerCorrection migration...\n')

  try {
    // Fetch all players with their correction fields
    console.log('📊 Fetching all players from database...')
    const players = await prisma.jugador.findMany({
      select: {
        id_player: true,
        player_name: true,
        team_name: true,
        correct_team_name: true,
        position_player: true,
        correct_position_player: true,
        nationality_1: true,
        correct_nationality_1: true,
        nationality_2: true,
        correct_nationality_2: true,
        date_of_birth: true,
        correct_date_of_birth: true,
        height: true,
        correct_height: true,
        foot: true,
        correct_foot: true,
        national_tier: true,
        correct_national_tier: true,
        team_loan_from: true,
        correct_team_loan_from: true,
        agency: true,
        correct_agency: true,
        contract_end: true,
        correct_contract_end: true,
      }
    })

    console.log(`✓ Found ${players.length} players to process\n`)

    const correctionsToCreate: CorrectionToCreate[] = []
    let playersWithCorrections = 0

    // Process each player
    for (const player of players) {
      let playerHasCorrections = false

      for (const mapping of CORRECTION_FIELD_MAPPINGS) {
        const originalValue = player[mapping.original as keyof typeof player]
        const correctedValue = player[mapping.corrected as keyof typeof player]

        // Check if there's a correction (corrected field exists and differs from original)
        if (correctedValue !== null && correctedValue !== undefined) {
          // Convert values to strings for comparison
          const originalStr = originalValue !== null && originalValue !== undefined
            ? String(originalValue)
            : null
          const correctedStr = String(correctedValue)

          // Only create correction if values actually differ
          if (originalStr !== correctedStr) {
            correctionsToCreate.push({
              player_id: player.id_player,
              field_name: mapping.original,
              original_value: originalStr,
              corrected_value: correctedStr,
              correction_date: new Date(),
              corrected_by: 'migration_script',
              is_verified: true
            })

            if (!playerHasCorrections) {
              playerHasCorrections = true
              playersWithCorrections++
            }

            console.log(`  ✓ ${player.player_name}: ${mapping.original}`)
            console.log(`    Original: "${originalStr || 'NULL'}"`)
            console.log(`    Corrected: "${correctedStr}"`)
          }
        }
      }
    }

    console.log(`\n📈 Summary:`)
    console.log(`  - Total players processed: ${players.length}`)
    console.log(`  - Players with corrections: ${playersWithCorrections}`)
    console.log(`  - Total corrections found: ${correctionsToCreate.length}`)

    if (correctionsToCreate.length === 0) {
      console.log('\n✓ No corrections to migrate. Table is already up to date!')
      return
    }

    // Create corrections in batches using a transaction
    console.log(`\n💾 Creating ${correctionsToCreate.length} correction records...`)

    await prisma.$transaction(async (tx) => {
      // Create corrections in batches of 100 to avoid overwhelming the database
      const batchSize = 100
      for (let i = 0; i < correctionsToCreate.length; i += batchSize) {
        const batch = correctionsToCreate.slice(i, i + batchSize)

        await tx.playerCorrection.createMany({
          data: batch,
          skipDuplicates: true // Skip if correction already exists
        })

        console.log(`  ✓ Created batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(correctionsToCreate.length / batchSize)}`)
      }
    })

    console.log('\n✅ Migration completed successfully!')
    console.log(`   ${correctionsToCreate.length} corrections have been migrated to the PlayerCorrection table.`)
    console.log('\n🎉 You can now view corrections at /admin/correcciones')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateCorrections()
  .then(() => {
    console.log('\n✓ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n✗ Script failed:', error)
    process.exit(1)
  })
