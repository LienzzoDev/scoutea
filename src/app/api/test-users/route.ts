import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🧪 Getting users from database...')
    
    const users = await prisma.usuario.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        clerkId: true
      }
    })

    const totalUsers = await prisma.usuario.count()

    console.log('✅ Found users:', users.length, 'of', totalUsers)

    return NextResponse.json({
      success: true,
      totalUsers,
      sampleUsers: users
    })
  } catch (error) {
    console.error('❌ Error getting users:', error)
    return NextResponse.json(
      { 
        error: 'Error getting users',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}