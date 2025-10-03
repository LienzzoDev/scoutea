import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getUserRoleInfo } from '@/lib/auth/role-utils'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const roleInfo = getUserRoleInfo(user)

    return NextResponse.json({
      success: true,
      ...roleInfo
    })

  } catch (error) {
    console.error('Error checking role:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}