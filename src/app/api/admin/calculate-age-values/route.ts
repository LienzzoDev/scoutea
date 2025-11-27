/**
 * Admin API endpoint to recalculate age-based values for all players
 *
 * POST /api/admin/calculate-age-values
 *
 * Calculates:
 * - age_value: Expected market value based on age cohort average
 * - age_value_%: Percentage deviation from age-based expected value
 * - age_coeff: Age coefficient for weighting calculations
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { getUserRoleInfo } from '@/lib/auth/role-utils'
import { AgeCalculationService } from '@/lib/services/age-calculation-service'

export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { __error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user info from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const roleInfo = getUserRoleInfo(user)

    // Only admins can recalculate age values
    if (roleInfo.role !== 'admin') {
      return NextResponse.json(
        { __error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    console.log('[Age Calculation] Starting calculation for all players...')

    const result = await AgeCalculationService.updateAllPlayersAgeValuesOptimized(
      500, // batch size
      (current, total) => {
        const percentage = Math.round((current / total) * 100)
        console.log(`[Age Calculation] Progress: ${percentage}% (${current}/${total})`)
      }
    )

    console.log('[Age Calculation] Calculation complete:', result)

    return NextResponse.json({
      success: true,
      message: 'Age values calculated successfully',
      data: {
        total: result.total,
        updated: result.updated,
        errors: result.errors
      }
    })
  } catch (error) {
    console.error('[Age Calculation] Error:', error)
    return NextResponse.json(
      {
        __error: 'Failed to calculate age values',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get calculation status/info
 * GET /api/admin/calculate-age-values
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { __error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user info from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const roleInfo = getUserRoleInfo(user)

    // Only admins can view calculation info
    if (roleInfo.role !== 'admin') {
      return NextResponse.json(
        { __error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get count of players with calculated values
    const { prisma } = await import('@/lib/db')

    const totalPlayers = await prisma.jugador.count({
      where: {
        player_name: { not: '' }
      }
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

    return NextResponse.json({
      total_players: totalPlayers,
      players_with_age_value: playersWithAgeValue,
      players_with_age_value_percent: playersWithAgeValuePercent,
      players_with_age_coeff: playersWithAgeCoeff,
      coverage_percentage: {
        age_value: Math.round((playersWithAgeValue / totalPlayers) * 100),
        age_value_percent: Math.round((playersWithAgeValuePercent / totalPlayers) * 100),
        age_coeff: Math.round((playersWithAgeCoeff / totalPlayers) * 100)
      }
    })
  } catch (error) {
    console.error('[Age Calculation] Error getting info:', error)
    return NextResponse.json(
      {
        __error: 'Failed to get calculation info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}