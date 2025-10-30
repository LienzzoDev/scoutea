/**
 * Script to verify age-based calculations
 *
 * This script samples players and verifies the calculated values:
 * - age_value: Expected market value based on age cohort average
 * - age_value_%: Percentage deviation from age-based expected value
 * - age_coeff: Age coefficient for weighting calculations
 *
 * Usage:
 * npx tsx scripts/verify-age-values.ts
 */

import { prisma } from '@/lib/db'

async function main() {
  console.log('='.repeat(60))
  console.log('Verifying Age Values Calculation')
  console.log('='.repeat(60))
  console.log()

  // Get summary statistics
  const totalPlayers = await prisma.jugador.count({
    where: { player_name: { not: '' } }
  })

  const playersWithAgeValue = await prisma.jugador.count({
    where: {
      player_name: { not: '' },
      age_value: { not: null }
    }
  })

  const playersWithAgeValuePercent = await prisma.jugador.count({
    where: {
      player_name: { not: '' },
      age_value_percent: { not: null }
    }
  })

  const playersWithAgeCoeff = await prisma.jugador.count({
    where: {
      player_name: { not: '' },
      age_coeff: { not: null }
    }
  })

  console.log('Summary Statistics:')
  console.log('-'.repeat(60))
  console.log(`Total players: ${totalPlayers}`)
  console.log(`Players with age_value: ${playersWithAgeValue} (${Math.round((playersWithAgeValue / totalPlayers) * 100)}%)`)
  console.log(`Players with age_value_percent: ${playersWithAgeValuePercent} (${Math.round((playersWithAgeValuePercent / totalPlayers) * 100)}%)`)
  console.log(`Players with age_coeff: ${playersWithAgeCoeff} (${Math.round((playersWithAgeCoeff / totalPlayers) * 100)}%)`)
  console.log()

  // Sample 10 players with calculated values
  console.log('Sample Data (10 random players):')
  console.log('-'.repeat(60))

  const samplePlayers = await prisma.jugador.findMany({
    where: {
      player_name: { not: '' },
      age: { not: null },
      player_trfm_value: { not: null },
      age_value: { not: null }
    },
    select: {
      player_name: true,
      age: true,
      player_trfm_value: true,
      age_value: true,
      age_value_percent: true,
      age_coeff: true
    },
    take: 10
  })

  console.table(
    samplePlayers.map(p => ({
      Name: p.player_name,
      Age: p.age,
      'Market Value': p.player_trfm_value?.toLocaleString() ?? 'N/A',
      'Age Value': p.age_value?.toFixed(0) ?? 'N/A',
      'Age Value %': p.age_value_percent ? `${p.age_value_percent.toFixed(2)}%` : 'N/A',
      'Age Coeff': p.age_coeff ?? 'N/A'
    }))
  )

  console.log()

  // Check age coefficient distribution
  const ageCoeffDistribution = await prisma.jugador.groupBy({
    by: ['age_coeff'],
    where: {
      player_name: { not: '' },
      age_coeff: { not: null }
    },
    _count: true
  })

  console.log('Age Coefficient Distribution:')
  console.log('-'.repeat(60))
  console.table(
    ageCoeffDistribution.map(item => ({
      'Age Coefficient': item.age_coeff,
      'Count': item._count
    }))
  )

  console.log()

  // Find players with extreme age_value_percent
  console.log('Players with Highest age_value_percent (Top 5):')
  console.log('-'.repeat(60))

  const topPlayers = await prisma.jugador.findMany({
    where: {
      player_name: { not: '' },
      age_value_percent: { not: null }
    },
    select: {
      player_name: true,
      age: true,
      player_trfm_value: true,
      age_value: true,
      age_value_percent: true
    },
    orderBy: {
      age_value_percent: 'desc'
    },
    take: 5
  })

  console.table(
    topPlayers.map(p => ({
      Name: p.player_name,
      Age: p.age,
      'Market Value': p.player_trfm_value?.toLocaleString() ?? 'N/A',
      'Age Value': p.age_value?.toFixed(0) ?? 'N/A',
      'Age Value %': p.age_value_percent ? `${p.age_value_percent.toFixed(2)}%` : 'N/A'
    }))
  )

  console.log()
  console.log('Players with Lowest age_value_percent (Bottom 5):')
  console.log('-'.repeat(60))

  const bottomPlayers = await prisma.jugador.findMany({
    where: {
      player_name: { not: '' },
      age_value_percent: { not: null }
    },
    select: {
      player_name: true,
      age: true,
      player_trfm_value: true,
      age_value: true,
      age_value_percent: true
    },
    orderBy: {
      age_value_percent: 'asc'
    },
    take: 5
  })

  console.table(
    bottomPlayers.map(p => ({
      Name: p.player_name,
      Age: p.age,
      'Market Value': p.player_trfm_value?.toLocaleString() ?? 'N/A',
      'Age Value': p.age_value?.toFixed(0) ?? 'N/A',
      'Age Value %': p.age_value_percent ? `${p.age_value_percent.toFixed(2)}%` : 'N/A'
    }))
  )

  console.log()
  console.log('='.repeat(60))
  console.log('✅ Verification Complete')
  console.log('='.repeat(60))

  process.exit(0)
}

main()
