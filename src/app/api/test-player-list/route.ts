import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { getOrCreateUser } from '@/lib/utils/user-sync'

export async function GET() {
  try {
    console.log('🧪 Test endpoint called')
    
    const { userId } = await auth()
    console.log('👤 User ID from auth:', userId)

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Test getOrCreateUser
    console.log('🔍 Testing getOrCreateUser...')
    const user = await getOrCreateUser(userId)
    console.log('✅ User result:', { id: user.id, clerkId: user.clerkId })

    // Test finding a player
    console.log('🔍 Testing player search...')
    const players = await prisma.jugador.findMany({
      take: 1,
      select: { id_player: true, player_name: true }
    })
    console.log('✅ Sample player:', players[0])

    // Test player list query
    console.log('🔍 Testing player list query...')
    const playerList = await prisma.playerList.findMany({
      where: { userId: user.id },
      take: 5
    })
    console.log('✅ Current player list count:', playerList.length)

    return NextResponse.json({
      success: true,
      user: { id: user.id, clerkId: user.clerkId },
      samplePlayer: players[0],
      playerListCount: playerList.length
    })
  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Error en test',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}