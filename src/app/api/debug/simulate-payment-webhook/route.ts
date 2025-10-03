import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Simulating Stripe webhook for payment completion...')
    
    // Get current user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user'
      }, { status: 401 })
    }
    
    const body = await request.json()
    const { plan = 'member', billing = 'monthly' } = body
    
    console.log('Simulating payment for:', { userId, plan, billing })
    
    // Get current metadata
    const user = await clerkClient.users.getUser(userId)
    const currentMetadata = user.publicMetadata || {}
    
    console.log('Current metadata before simulation:', JSON.stringify(currentMetadata, null, 2))
    
    // Simulate the same logic as the webhook
    const selectedPlan = plan || currentMetadata.selectedPlan || 'member'
    
    // Mapear planes a roles correctos (same logic as webhook)
    const getRoleFromPlan = (planName: string): string => {
      const planLower = planName.toLowerCase()
      
      // Mapeo específico de planes a roles
      if (planLower === 'scout' || planLower.includes('scout')) {
        return 'scout'
      } else if (planLower === 'member' || planLower.includes('member') || planLower === 'basic' || planLower === 'premium') {
        return 'member'
      }
      
      // Por defecto, asignar rol de member
      console.log(`⚠️ Unknown plan "${planName}", defaulting to member role`)
      return 'member'
    }
    
    const userRole = getRoleFromPlan(selectedPlan)
    
    // Simulate Stripe session data
    const mockStripeData = {
      customer: `cus_mock_${Date.now()}`,
      subscription: `sub_mock_${Date.now()}`,
      sessionId: `cs_mock_${Date.now()}`
    }
    
    // Update user metadata (same as webhook)
    const updatedMetadata = {
      ...currentMetadata,
      role: userRole, // Asignar el rol correcto basándose en el plan
      profile: 'completed', // Marcar perfil como completado
      subscription: {
        stripeCustomerId: mockStripeData.customer,
        stripeSubscriptionId: mockStripeData.subscription,
        stripeSessionId: mockStripeData.sessionId,
        plan: selectedPlan,
        status: 'active',
        billing: billing || 'monthly',
        startDate: new Date().toISOString(),
        nextBilling: new Date(Date.now() + (billing === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
      },
      onboardingCompleted: true,
      // Limpiar metadatos innecesarios
      onboardingStep: undefined,
      profileSkippedAt: undefined
    }

    console.log('💳 Simulating webhook metadata update:', {
      userId,
      selectedPlan,
      assignedRole: userRole,
      currentMetadata,
      updatedMetadata
    })

    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata
    })

    console.log(`✅ Webhook simulation completed for userId: ${userId} with role: ${userRole}`)
    
    return NextResponse.json({
      success: true,
      message: `Webhook simulated successfully - Role "${userRole}" assigned`,
      userId,
      assignedRole: userRole,
      plan: selectedPlan,
      billing,
      mockStripeData,
      previousMetadata: currentMetadata,
      newMetadata: updatedMetadata,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error simulating webhook:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}