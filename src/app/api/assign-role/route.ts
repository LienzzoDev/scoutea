import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await request.json()
    
    // Validar rol
    if (!role || !['member', 'scout', 'admin'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be member, scout, or admin' 
      }, { status: 400 })
    }

    // Asignar rol simple
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        role: role
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Role ${role} assigned successfully`,
      userId,
      role
    })

  } catch (error) {
    console.error('Error assigning role:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}