/**
 * Script to verify nationality-based calculations
 *
 * This script samples players and verifies the calculated values:
 * - nationality_value: Average market value of players with same nationality_1
 * - nationality_value_%: Percentage deviation from nationality-based expected value
 *
 * Usage:
 * npx tsx scripts/verify-nationality-values.ts
 */

import { prisma } from '@/lib/db'

async function main() {
  console.log('='.repeat(60))
  console.log('Verifying Nationality Values Calculation')
  console.log('='.repeat(60))
  console.log()

  // Get summary statistics
  const totalPlayers = await prisma.jugador.count({
    where: { player_name: { not: '' } }
  })

  const playersWithNationalityValue = await prisma.jugador.count({
    where: {
      player_name: { not: '' },
      nationality_value: { not: null }
    }
  })

  const playersWithNationalityValuePercent = await prisma.jugador.count({
    where: {
      player_name: { not: '' },
      nationality_value_percent: { not: null }
    }
  })

  console.log('Summary Statistics:')
  console.log('-'.repeat(60))
  console.log(`Total players: ${totalPlayers}`)
  console.log(`Players with nationality_value: ${playersWithNationalityValue} (${Math.round((playersWithNationalityValue / totalPlayers) * 100)}%)`)
  console.log(`Players with nationality_value_percent: ${playersWithNationalityValuePercent} (${Math.round((playersWithNationalityValuePercent / totalPlayers) * 100)}%)`)
  console.log()

  // Count unique nationalities
  const uniqueNationalities = await prisma.jugador.groupBy({
    by: ['correct_nationality_1'],
    where: {
      correct_nationality_1: { not: null }
    },
    _count: true
  })

  console.log(`Total unique nationalities: ${uniqueNationalities.length}`)
  console.log()

  // Sample 10 players with calculated values
  console.log('Sample Data (10 random players):')
  console.log('-'.repeat(60))

  const samplePlayers = await prisma.jugador.findMany({
    where: {
      player_name: { not: '' },
      correct_nationality_1: { not: null },
      player_trfm_value: { not: null },
      nationality_value: { not: null }
    },
    select: {
      player_name: true,
      correct_nationality_1: true,
      player_trfm_value: true,
      nationality_value: true,
      nationality_value_percent: true
    },
    take: 10
  })

  console.table(
    samplePlayers.map(p => ({
      Name: p.player_name,
      Nationality: p.correct_nationality_1,
      'Market Value': p.player_trfm_value?.toLocaleString() ?? 'N/A',
      'Nat. Value': p.nationality_value?.toFixed(0) ?? 'N/A',
      'Nat. Value %': p.nationality_value_percent ? `${p.nationality_value_percent.toFixed(2)}%` : 'N/A'
    }))
  )

  console.log()

  // Top 5 nationalities by average market value
  console.log('Top 5 Nationalities by Average Market Value:')
  console.log('-'.repeat(60))

  const topNationalities = await prisma.jugador.groupBy({
    by: ['correct_nationality_1'],
    where: {
      correct_nationality_1: { not: null },
      player_trfm_value: { not: null }
    },
    _avg: {
      player_trfm_value: true
    },
    _count: true,
    orderBy: {
      _avg: {
        player_trfm_value: 'desc'
      }
    },
    take: 5
  })

  console.table(
    topNationalities.map(item => ({
      Nationality: item.correct_nationality_1,
      'Avg Market Value': item._avg.player_trfm_value?.toFixed(0) ?? 'N/A',
      'Player Count': item._count
    }))
  )

  console.log()

  // Players with highest nationality_value_percent
  console.log('Players with Highest nationality_value_percent (Top 5):')
  console.log('-'.repeat(60))

  const topPlayers = await prisma.jugador.findMany({
    where: {
      player_name: { not: '' },
      nationality_value_percent: { not: null }
    },
    select: {
      player_name: true,
      correct_nationality_1: true,
      player_trfm_value: true,
      nationality_value: true,
      nationality_value_percent: true
    },
    orderBy: {
      nationality_value_percent: 'desc'
    },
    take: 5
  })

  console.table(
    topPlayers.map(p => ({
      Name: p.player_name,
      Nationality: p.correct_nationality_1,
      'Market Value': p.player_trfm_value?.toLocaleString() ?? 'N/A',
      'Nat. Value': p.nationality_value?.toFixed(0) ?? 'N/A',
      'Nat. Value %': p.nationality_value_percent ? `${p.nationality_value_percent.toFixed(2)}%` : 'N/A'
    }))
  )

  console.log()
  console.log('Players with Lowest nationality_value_percent (Bottom 5):')
  console.log('-'.repeat(60))

  const bottomPlayers = await prisma.jugador.findMany({
    where: {
      player_name: { not: '' },
      nationality_value_percent: { not: null }
    },
    select: {
      player_name: true,
      correct_nationality_1: true,
      player_trfm_value: true,
      nationality_value: true,
      nationality_value_percent: true
    },
    orderBy: {
      nationality_value_percent: 'asc'
    },
    take: 5
  })

  console.table(
    bottomPlayers.map(p => ({
      Name: p.player_name,
      Nationality: p.correct_nationality_1,
      'Market Value': p.player_trfm_value?.toLocaleString() ?? 'N/A',
      'Nat. Value': p.nationality_value?.toFixed(0) ?? 'N/A',
      'Nat. Value %': p.nationality_value_percent ? `${p.nationality_value_percent.toFixed(2)}%` : 'N/A'
    }))
  )

  console.log()
  console.log('='.repeat(60))
  console.log('✅ Verification Complete')
  console.log('='.repeat(60))

  process.exit(0)
}

main()
