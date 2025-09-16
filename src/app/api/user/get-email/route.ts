import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { handleAPIError, extractErrorContext, requireAuth } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const context = extractErrorContext(request)
    const { userId } = await auth()
    
    // Usar nueva función de validación de auth
    requireAuth(userId, context)

    // Obtener el email del usuario desde los metadatos de la sesión
    const { sessionClaims } = await auth()
    const email = (sessionClaims as any)?.email || ''

    return NextResponse.json({ 
      email: email,
      userId: userId
    })
  } catch (error) {
    return handleAPIError(error, extractErrorContext(request))
  }
}
