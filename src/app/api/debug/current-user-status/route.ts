import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { getUserRole } from '@/lib/auth/user-role'

export async function GET() {
  try {
    console.log('🔍 Checking current user status...')
    
    // Get current user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user'
      }, { status: 401 })
    }
    
    // Get user details
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }
    
    const publicMetadata = user.publicMetadata as any
    const userRole = getUserRole(user)
    
    // Check what the layout guards would see
    const profileStatus = publicMetadata?.profile as string
    const profileCompleted = profileStatus === 'completed'
    const profileIncomplete = profileStatus === 'incomplete'
    const hasProfileStatus = profileCompleted || profileIncomplete
    const subscriptionData = publicMetadata?.subscription as Record<string, unknown>
    const hasSubscription = subscriptionData?.status === 'active'
    
    return NextResponse.json({
      success: true,
      userId,
      user: {
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName
      },
      metadata: {
        raw: publicMetadata,
        role: publicMetadata?.role,
        userRoleFromFunction: userRole,
        profile: profileStatus,
        profileCompleted,
        profileIncomplete,
        hasProfileStatus,
        subscription: subscriptionData,
        hasSubscription,
        selectedPlan: publicMetadata?.selectedPlan,
        onboardingCompleted: publicMetadata?.onboardingCompleted,
        onboardingStep: publicMetadata?.onboardingStep
      },
      accessAnalysis: {
        memberAreaAccess: {
          hasRole: userRole === 'member' || userRole === 'admin',
          isAdmin: userRole === 'admin',
          isScout: userRole === 'scout',
          wouldRedirectToScout: userRole === 'scout',
          wouldRedirectToHome: userRole !== 'member' && userRole !== 'admin' && userRole !== 'scout'
        },
        scoutAreaAccess: {
          hasRole: userRole === 'scout' || userRole === 'admin',
          hasSubscription: hasSubscription,
          wouldRedirectToMember: userRole === 'member',
          wouldRedirectToPlans: userRole === 'scout' && !hasSubscription,
          wouldRedirectToHome: userRole !== 'scout' && userRole !== 'admin'
        }
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error checking user status:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}