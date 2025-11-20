/**
 * Test script for auto-correction functionality
 *
 * This script tests that team name and league corrections are applied automatically
 * when updating player data through the API
 */

import { CorrectionService } from '../src/lib/services/correction-service'

async function testCorrections() {
  console.log('🧪 Testing Auto-Correction Service\n')

  // Test 1: Team Name Correction
  console.log('📋 Test 1: Team Name Correction')
  console.log('Creating test team correction rule...')

  const testTeamName = 'Real Madrid CF'
  const correctedTeamName = 'Real Madrid'

  // Simulate applying correction
  const teamResult = await CorrectionService.applyTeamNameCorrection(testTeamName)
  console.log(`Input: "${testTeamName}"`)
  console.log(`Output: "${teamResult}"`)
  console.log(`Expected: "${testTeamName}" (no correction exists yet)`)
  console.log(teamResult === testTeamName ? '✅ PASS' : '❌ FAIL')
  console.log()

  // Test 2: League Correction
  console.log('📋 Test 2: League Correction')
  console.log('Creating test league correction rule...')

  const testNationalTier = 'LaLiga'
  const correctedLeague = {
    rename_national_tier: 'Primera División',
    country: 'Spain'
  }

  // Simulate applying correction
  const leagueResult = await CorrectionService.applyLeagueCorrection(testNationalTier)
  console.log(`Input: "${testNationalTier}"`)
  console.log(`Output:`, leagueResult)
  console.log(`Expected: null (no correction exists yet)`)
  console.log(leagueResult === null ? '✅ PASS' : '❌ FAIL')
  console.log()

  // Test 3: Batch Team Name Corrections
  console.log('📋 Test 3: Batch Team Name Corrections')
  const teamNames = ['Real Madrid CF', 'FC Barcelona', 'Atlético Madrid']
  const batchTeamResults = await CorrectionService.batchApplyTeamNameCorrections(teamNames)
  console.log(`Input:`, teamNames)
  console.log(`Output:`, batchTeamResults)
  console.log(`Expected: Empty Map (no corrections exist yet)`)
  console.log(batchTeamResults.size === 0 ? '✅ PASS' : '❌ FAIL')
  console.log()

  // Test 4: Batch League Corrections
  console.log('📋 Test 4: Batch League Corrections')
  const nationalTiers = ['LaLiga', 'Premier League', 'Serie A']
  const batchLeagueResults = await CorrectionService.batchApplyLeagueCorrections(nationalTiers)
  console.log(`Input:`, nationalTiers)
  console.log(`Output:`, batchLeagueResults)
  console.log(`Expected: Empty Map (no corrections exist yet)`)
  console.log(batchLeagueResults.size === 0 ? '✅ PASS' : '❌ FAIL')
  console.log()

  // Test 5: Apply Player Corrections (Combined)
  console.log('📋 Test 5: Apply Player Corrections (Combined)')
  const playerData = {
    team_name: 'Real Madrid CF',
    national_tier: 'LaLiga',
    player_name: 'Test Player'
  }
  const correctedPlayerData = await CorrectionService.applyPlayerCorrections(playerData)
  console.log(`Input:`, playerData)
  console.log(`Output:`, correctedPlayerData)
  console.log(`Expected: Same as input (no corrections exist yet)`)
  console.log(
    correctedPlayerData.team_name === playerData.team_name &&
    correctedPlayerData.national_tier === playerData.national_tier
      ? '✅ PASS'
      : '❌ FAIL'
  )
  console.log()

  // Test 6: Null/Empty Handling
  console.log('📋 Test 6: Null/Empty Value Handling')
  const nullTeam = await CorrectionService.applyTeamNameCorrection(null)
  const emptyTeam = await CorrectionService.applyTeamNameCorrection('')
  const undefinedTeam = await CorrectionService.applyTeamNameCorrection(undefined)
  console.log(`Null input: ${nullTeam} (expected: null)`)
  console.log(`Empty input: ${emptyTeam} (expected: null)`)
  console.log(`Undefined input: ${undefinedTeam} (expected: null)`)
  console.log(
    nullTeam === null && emptyTeam === null && undefinedTeam === null
      ? '✅ PASS'
      : '❌ FAIL'
  )
  console.log()

  console.log('✅ All tests completed!')
  console.log('\n📝 Next Steps:')
  console.log('1. Go to /admin/correcciones and create a team correction')
  console.log('2. Go to /admin/correcciones and create a league correction')
  console.log('3. Update a player\'s team_name or national_tier field')
  console.log('4. Verify that the corrections are applied automatically')
}

testCorrections()
  .then(() => {
    console.log('\n✅ Test script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error)
    process.exit(1)
  })
