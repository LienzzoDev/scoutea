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

    console.log('Activating subscription for userId:', userId)

    // Obtener metadatos actuales del usuario
    const user = await clerkClient.users.getUser(userId)
    const currentMetadata = user.publicMetadata || {}

    console.log('Current metadata:', JSON.stringify(currentMetadata, null, 2))

    // Simular suscripción activa
    const updatedMetadata = {
      ...currentMetadata,
      subscription: {
        stripeCustomerId: 'cus_test_123',
        stripeSubscriptionId: 'sub_test_123',
        plan: currentMetadata.selectedPlan || 'scout',
        status: 'active',
        billing: 'monthly',
        startDate: new Date().toISOString(),
        nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      onboardingCompleted: true,
      onboardingStep: 'completed'
    }

    console.log('Updated metadata:', JSON.stringify(updatedMetadata, null, 2))
    
    // Actualizar metadatos públicos del usuario
    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata
    })

    console.log('Subscription activated successfully')
    return NextResponse.json({ success: true, updatedMetadata })
  } catch (error) {
    console.error('Error activating subscription:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}