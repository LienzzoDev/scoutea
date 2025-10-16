import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Try to count players
    const playerCount = await prisma.jugador.count()
    
    // Try to get first player
    const firstPlayer = await prisma.jugador.findFirst({
      select: {
        id_player: true,
        player_name: true,
        team_name: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      data: {
        playerCount,
        firstPlayer,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Database connection error:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}