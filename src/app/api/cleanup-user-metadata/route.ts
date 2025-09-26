import { auth } from '@clerk/nextjs/server'
import { createClerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.error('No userId found in auth')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Cleaning up user metadata for userId:', userId)

    // Obtener metadatos actuales del usuario
    const user = await clerkClient.users.getUser(userId)
    const currentMetadata = user.publicMetadata || {}

    console.log('Current metadata:', JSON.stringify(currentMetadata, null, 2))

    // Limpiar metadatos - remover rol y onboardingStep si no hay suscripción activa
    const cleanedMetadata = {
      ...currentMetadata,
      onboardingStep: 'payment', // Mantener en paso de pago
      // Remover rol hasta que el pago sea exitoso
      role: undefined
    }

    // Limpiar propiedades undefined
    Object.keys(cleanedMetadata).forEach(key => {
      if (cleanedMetadata[key] === undefined) {
        delete cleanedMetadata[key]
      }
    })

    console.log('Cleaned metadata:', JSON.stringify(cleanedMetadata, null, 2))
    
    // Actualizar metadatos públicos del usuario
    await clerkClient.users.updateUser(userId, {
      publicMetadata: cleanedMetadata
    })

    console.log('User metadata cleaned successfully')
    return NextResponse.json({ success: true, cleanedMetadata })
  } catch (error) {
    console.error('Error cleaning user metadata:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}