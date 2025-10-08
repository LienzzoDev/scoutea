import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 Scout Profile API - Starting...')
    
    const { userId } = await auth()
    console.log('🔍 User ID:', userId)
    
    if (!userId) {
      console.log('❌ No userId found')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await currentUser()
    console.log('🔍 User data:', {
      id: user?.id,
      email: user?.emailAddresses[0]?.emailAddress,
      firstName: user?.firstName,
      lastName: user?.lastName,
    })

    if (!user) {
      console.log('❌ No user found')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Usar directamente Prisma en lugar del servicio
    console.log('🔍 Checking for existing scout...')
    const existingScout = await prisma.scout.findUnique({
      where: { clerkId: userId },
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        surname: true,
        email: true,
        nationality: true,
        country: true,
        favourite_club: true,
        open_to_work: true,
        professional_experience: true,
        total_reports: true,
        roi: true,
        net_profits: true,
        scout_level: true,
        scout_ranking: true,
        createdAt: true,
      },
    })

    console.log('🔍 Existing scout found:', !!existingScout)

    if (existingScout) {
      console.log('✅ Returning existing scout')
      return NextResponse.json({
        success: true,
        scout: existingScout,
      })
    }

    // Si no existe, crear uno nuevo directamente
    console.log('🔍 Creating new scout...')
    const scoutData = {
      clerkId: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: user.firstName || '',
      surname: user.lastName || '',
      scout_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Scout',
      join_date: new Date(),
      total_reports: 0,
      original_reports: 0,
      roi: 0,
      net_profits: 0,
    }

    console.log('🔍 Scout data to create:', scoutData)

    const newScout = await prisma.scout.create({
      data: scoutData,
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        surname: true,
        email: true,
        nationality: true,
        country: true,
        favourite_club: true,
        open_to_work: true,
        professional_experience: true,
        total_reports: true,
        roi: true,
        net_profits: true,
        scout_level: true,
        scout_ranking: true,
        createdAt: true,
      },
    })

    console.log('✅ New scout created:', newScout)

    return NextResponse.json({
      success: true,
      scout: newScout,
    })

  } catch (error) {
    console.error('❌ Scout Profile API Error:', error)
    
    // Log detallado del error
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}