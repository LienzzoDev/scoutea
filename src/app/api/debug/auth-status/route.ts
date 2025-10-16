import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Checking authentication status...')
    
    const authResult = await auth()
    
    console.log('✅ Auth result:', {
      userId: authResult.userId,
      sessionId: authResult.sessionId,
      hasSessionClaims: !!authResult.sessionClaims,
      sessionClaimsKeys: authResult.sessionClaims ? Object.keys(authResult.sessionClaims) : []
    })
    
    return NextResponse.json({
      success: true,
      authenticated: !!authResult.userId,
      userId: authResult.userId,
      sessionId: authResult.sessionId,
      hasSessionClaims: !!authResult.sessionClaims,
      userRole: authResult.sessionClaims?.public_metadata?.role || 'no-role',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error checking auth status:', error)
    return NextResponse.json(
      { 
        success: false,
        authenticated: false,
        error: 'Error checking authentication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}