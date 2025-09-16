import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { UserService } from '@/lib/services/user-service'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar si el perfil está completado en la base de datos
    const isProfileCompleted = await UserService.isProfileCompleted(userId)
    
    return NextResponse.json({ 
      profileCompleted: isProfileCompleted,
      userId: userId
    })
  } catch (error) {
    console.error('Error checking profile status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
