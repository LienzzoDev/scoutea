import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Force assigning role...')
    
    // Get current user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user'
      }, { status: 401 })
    }
    
    const body = await request.json()
    const { role = 'member' } = body
    
    // Validate role
    if (!['member', 'scout', 'admin'].includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role. Must be member, scout, or admin'
      }, { status: 400 })
    }
    
    console.log(`Forcing role assignment: ${role} for user: ${userId}`)
    
    // Get current metadata
    const user = await clerkClient.users.getUser(userId)
    const currentMetadata = user.publicMetadata || {}
    
    console.log('Current metadata before force assignment:', JSON.stringify(currentMetadata, null, 2))
    
    // Force assign the role with minimal required metadata
    const updatedMetadata = {
      ...currentMetadata,
      role: role,
      profile: 'completed',
      subscription: {
        status: 'active',
        plan: role === 'scout' ? 'scout' : 'member',
        billing: 'monthly',
        startDate: new Date().toISOString(),
        nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        forceAssigned: true,
        assignedAt: new Date().toISOString()
      },
      onboardingCompleted: true,
      selectedPlan: role === 'scout' ? 'scout' : 'member',
      // Clean up any problematic metadata
      onboardingStep: undefined,
      profileSkippedAt: undefined
    }
    
    console.log('Force assigning metadata:', JSON.stringify(updatedMetadata, null, 2))
    
    // Update user metadata
    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata
    })
    
    // Verify the update worked
    const updatedUser = await clerkClient.users.getUser(userId)
    const finalMetadata = updatedUser.publicMetadata
    
    console.log('✅ Role force assigned successfully')
    console.log('Final metadata:', JSON.stringify(finalMetadata, null, 2))
    
    return NextResponse.json({
      success: true,
      message: `Role "${role}" force assigned successfully`,
      userId,
      assignedRole: role,
      previousMetadata: currentMetadata,
      newMetadata: updatedMetadata,
      finalMetadata: finalMetadata,
      verification: {
        roleAssigned: finalMetadata.role === role,
        subscriptionActive: finalMetadata.subscription?.status === 'active',
        profileCompleted: finalMetadata.profile === 'completed'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error force assigning role:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}