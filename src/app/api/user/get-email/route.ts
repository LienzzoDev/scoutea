import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener el email del usuario desde los metadatos de la sesión
    const { sessionClaims } = await auth()
    const email = (sessionClaims as any)?.email || ''

    return NextResponse.json({ 
      email: email,
      userId: userId
    })
  } catch (error) {
    console.error('Error getting user email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
