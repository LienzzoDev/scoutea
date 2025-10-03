import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Debug: Checking payment status...')
    
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
    
    return NextResponse.json({
      success: true,
      userId,
      user: {
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        role: publicMetadata?.role,
        subscription: publicMetadata?.subscription,
        onboardingCompleted: publicMetadata?.onboardingCompleted,
        onboardingStep: publicMetadata?.onboardingStep,
        fullMetadata: publicMetadata
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error checking payment status:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}