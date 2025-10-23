import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const authResult = await auth()

    return NextResponse.json({
      success: true,
      userId: authResult.userId,
      hasAuth: !!authResult.userId,
      sessionClaims: authResult.sessionClaims,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
