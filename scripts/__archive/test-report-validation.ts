import { ScoutReportCreateSchema } from '@/lib/validation/api-schemas'

// Test data similar to what the form sends
const testData = {
  playerName: 'Test Player',
  dateOfBirth: '2000-01-01',
  team: 'Test Team',
  nationality1: 'Spain',
  urlReference: '', // Empty string should be transformed to null
  potential: 8,
  position: 'midfielder',
  height: null,
  foot: null,
  teamCountry: 'Spain',
  nationality2: null,
  nationalTier: null,
  agency: null,
  urlReport: null,
  urlVideo: null,
  reportText: 'This is a test report',
  imageUrl: null
}

console.log('Testing validation with data:', JSON.stringify(testData, null, 2))

try {
  const result = ScoutReportCreateSchema.parse(testData)
  console.log('\n✅ Validation SUCCESS!')
  console.log('Validated data:', JSON.stringify(result, null, 2))
} catch (error) {
  console.error('\n❌ Validation FAILED!')
  console.error(error)
}
