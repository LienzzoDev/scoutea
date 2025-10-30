/**
 * Script to verify team-based calculations
 *
 * This script samples teams and verifies the calculated values:
 * - team_trfm_value_norm: Normalized team market value
 * - team_rating_norm: Normalized team rating
 * - team_elo: Average of the two normalized metrics
 * - team_level: Qualitative classification (A+, A, B, C, D)
 *
 * Usage:
 * npx tsx scripts/verify-team-values.ts
 */

import { prisma } from '@/lib/db'

async function main() {
  console.log('='.repeat(60))
  console.log('Verifying Team Values Calculation')
  console.log('='.repeat(60))
  console.log()

  // Get summary statistics
  const totalTeams = await prisma.equipo.count()

  const teamsWithValueNorm = await prisma.equipo.count({
    where: {
      team_trfm_value_norm: { not: null }
    }
  })

  const teamsWithRatingNorm = await prisma.equipo.count({
    where: {
      team_rating_norm: { not: null }
    }
  })

  const teamsWithElo = await prisma.equipo.count({
    where: {
      team_elo: { not: null }
    }
  })

  const teamsWithLevel = await prisma.equipo.count({
    where: {
      team_level: { not: null }
    }
  })

  console.log('Summary Statistics:')
  console.log('-'.repeat(60))
  console.log(`Total teams: ${totalTeams}`)
  console.log(`Teams with value_norm: ${teamsWithValueNorm} (${Math.round((teamsWithValueNorm / totalTeams) * 100)}%)`)
  console.log(`Teams with rating_norm: ${teamsWithRatingNorm} (${Math.round((teamsWithRatingNorm / totalTeams) * 100)}%)`)
  console.log(`Teams with elo: ${teamsWithElo} (${Math.round((teamsWithElo / totalTeams) * 100)}%)`)
  console.log(`Teams with level: ${teamsWithLevel} (${Math.round((teamsWithLevel / totalTeams) * 100)}%)`)
  console.log()

  // Sample 10 teams with calculated values
  console.log('Sample Data (10 teams with highest Elo):')
  console.log('-'.repeat(60))

  const sampleTeams = await prisma.equipo.findMany({
    where: {
      team_elo: { not: null }
    },
    select: {
      team_name: true,
      correct_team_name: true,
      team_country: true,
      team_trfm_value: true,
      team_rating: true,
      team_trfm_value_norm: true,
      team_rating_norm: true,
      team_elo: true,
      team_level: true
    },
    orderBy: {
      team_elo: 'desc'
    },
    take: 10
  })

  console.table(
    sampleTeams.map(t => ({
      Name: t.correct_team_name || t.team_name,
      Country: t.team_country || 'N/A',
      'Market Value': t.team_trfm_value?.toLocaleString() || 'N/A',
      'Rating': t.team_rating?.toFixed(2) || 'N/A',
      'Value Norm': t.team_trfm_value_norm?.toFixed(2) || 'N/A',
      'Rating Norm': t.team_rating_norm?.toFixed(2) || 'N/A',
      'Elo': t.team_elo?.toFixed(2) || 'N/A',
      'Level': t.team_level || 'N/A'
    }))
  )

  console.log()

  // Distribution by level
  console.log('Distribution by Team Level:')
  console.log('-'.repeat(60))

  const levelDistribution = await prisma.equipo.groupBy({
    by: ['team_level'],
    where: {
      team_level: { not: null }
    },
    _count: true
  })

  // Sort manually by count
  levelDistribution.sort((a, b) => b._count - a._count)

  console.table(
    levelDistribution.map(item => ({
      Level: item.team_level,
      Count: item._count
    }))
  )

  console.log()

  // Get max values
  const maxValues = await prisma.equipo.aggregate({
    _max: {
      team_trfm_value: true,
      team_rating: true,
      team_elo: true
    }
  })

  console.log('Maximum Values:')
  console.log('-'.repeat(60))
  console.log(`Max Market Value: €${maxValues._max.team_trfm_value?.toLocaleString() || 'N/A'}`)
  console.log(`Max Rating: ${maxValues._max.team_rating?.toFixed(2) || 'N/A'}`)
  console.log(`Max Elo: ${maxValues._max.team_elo?.toFixed(2) || 'N/A'}`)
  console.log()

  // Lowest elo teams
  console.log('Sample Data (10 teams with lowest Elo):')
  console.log('-'.repeat(60))

  const lowestTeams = await prisma.equipo.findMany({
    where: {
      team_elo: { not: null }
    },
    select: {
      team_name: true,
      correct_team_name: true,
      team_country: true,
      team_trfm_value: true,
      team_rating: true,
      team_elo: true,
      team_level: true
    },
    orderBy: {
      team_elo: 'asc'
    },
    take: 10
  })

  console.table(
    lowestTeams.map(t => ({
      Name: t.correct_team_name || t.team_name,
      Country: t.team_country || 'N/A',
      'Market Value': t.team_trfm_value?.toLocaleString() || 'N/A',
      'Rating': t.team_rating?.toFixed(2) || 'N/A',
      'Elo': t.team_elo?.toFixed(2) || 'N/A',
      'Level': t.team_level || 'N/A'
    }))
  )

  console.log()
  console.log('='.repeat(60))
  console.log('✅ Verification Complete')
  console.log('='.repeat(60))

  process.exit(0)
}

main()
