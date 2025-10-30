/**
 * Script to verify competition-based calculations
 *
 * This script samples competitions and verifies the calculated values:
 * - competition_trfm_value_norm: Normalized competition market value
 * - competition_rating_norm: Normalized competition rating
 * - competition_elo: Average of the two normalized metrics
 * - competition_level: Qualitative classification (A+, A, B, C, D)
 *
 * Usage:
 * npx tsx scripts/verify-competition-values.ts
 */

import { prisma } from '@/lib/db'

async function main() {
  console.log('='.repeat(60))
  console.log('Verifying Competition Values Calculation')
  console.log('='.repeat(60))
  console.log()

  // Get summary statistics
  const totalCompetitions = await prisma.competition.count()

  const competitionsWithValueNorm = await prisma.competition.count({
    where: {
      competition_trfm_value_norm: { not: null }
    }
  })

  const competitionsWithRatingNorm = await prisma.competition.count({
    where: {
      competition_rating_norm: { not: null }
    }
  })

  const competitionsWithElo = await prisma.competition.count({
    where: {
      competition_elo: { not: null }
    }
  })

  const competitionsWithLevel = await prisma.competition.count({
    where: {
      competition_level: { not: null }
    }
  })

  console.log('Summary Statistics:')
  console.log('-'.repeat(60))
  console.log(`Total competitions: ${totalCompetitions}`)
  console.log(`Competitions with value_norm: ${competitionsWithValueNorm} (${Math.round((competitionsWithValueNorm / totalCompetitions) * 100)}%)`)
  console.log(`Competitions with rating_norm: ${competitionsWithRatingNorm} (${Math.round((competitionsWithRatingNorm / totalCompetitions) * 100)}%)`)
  console.log(`Competitions with elo: ${competitionsWithElo} (${Math.round((competitionsWithElo / totalCompetitions) * 100)}%)`)
  console.log(`Competitions with level: ${competitionsWithLevel} (${Math.round((competitionsWithLevel / totalCompetitions) * 100)}%)`)
  console.log()

  // Sample 10 competitions with calculated values
  console.log('Sample Data (10 competitions with highest Elo):')
  console.log('-'.repeat(60))

  const sampleCompetitions = await prisma.competition.findMany({
    where: {
      competition_elo: { not: null }
    },
    select: {
      competition_name: true,
      correct_competition_name: true,
      competition_country: true,
      competition_trfm_value: true,
      competition_rating: true,
      competition_trfm_value_norm: true,
      competition_rating_norm: true,
      competition_elo: true,
      competition_level: true
    },
    orderBy: {
      competition_elo: 'desc'
    },
    take: 10
  })

  console.table(
    sampleCompetitions.map(c => ({
      Name: c.correct_competition_name || c.competition_name || 'N/A',
      Country: c.competition_country || 'N/A',
      'Market Value': c.competition_trfm_value?.toLocaleString() || 'N/A',
      'Rating': c.competition_rating?.toFixed(2) || 'N/A',
      'Value Norm': c.competition_trfm_value_norm?.toFixed(2) || 'N/A',
      'Rating Norm': c.competition_rating_norm?.toFixed(2) || 'N/A',
      'Elo': c.competition_elo?.toFixed(2) || 'N/A',
      'Level': c.competition_level || 'N/A'
    }))
  )

  console.log()

  // Distribution by level
  console.log('Distribution by Competition Level:')
  console.log('-'.repeat(60))

  const levelDistribution = await prisma.competition.groupBy({
    by: ['competition_level'],
    where: {
      competition_level: { not: null }
    },
    _count: true
  })

  // Sort manually by count
  levelDistribution.sort((a, b) => b._count - a._count)

  console.table(
    levelDistribution.map(item => ({
      Level: item.competition_level,
      Count: item._count
    }))
  )

  console.log()

  // Get max values
  const maxValues = await prisma.competition.aggregate({
    _max: {
      competition_trfm_value: true,
      competition_rating: true,
      competition_elo: true
    }
  })

  console.log('Maximum Values:')
  console.log('-'.repeat(60))
  console.log(`Max Market Value: €${maxValues._max.competition_trfm_value?.toLocaleString() || 'N/A'}`)
  console.log(`Max Rating: ${maxValues._max.competition_rating?.toFixed(2) || 'N/A'}`)
  console.log(`Max Elo: ${maxValues._max.competition_elo?.toFixed(2) || 'N/A'}`)
  console.log()

  // Lowest elo competitions
  console.log('Sample Data (10 competitions with lowest Elo):')
  console.log('-'.repeat(60))

  const lowestCompetitions = await prisma.competition.findMany({
    where: {
      competition_elo: { not: null }
    },
    select: {
      competition_name: true,
      correct_competition_name: true,
      competition_country: true,
      competition_trfm_value: true,
      competition_rating: true,
      competition_elo: true,
      competition_level: true
    },
    orderBy: {
      competition_elo: 'asc'
    },
    take: 10
  })

  console.table(
    lowestCompetitions.map(c => ({
      Name: c.correct_competition_name || c.competition_name || 'N/A',
      Country: c.competition_country || 'N/A',
      'Market Value': c.competition_trfm_value?.toLocaleString() || 'N/A',
      'Rating': c.competition_rating?.toFixed(2) || 'N/A',
      'Elo': c.competition_elo?.toFixed(2) || 'N/A',
      'Level': c.competition_level || 'N/A'
    }))
  )

  console.log()
  console.log('='.repeat(60))
  console.log('✅ Verification Complete')
  console.log('='.repeat(60))

  process.exit(0)
}

main()
