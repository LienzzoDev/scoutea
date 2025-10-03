import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🔧 Debug: Assigning member role...')
    
    // Get current user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No authenticated user'
      }, { status: 401 })
    }
    
    // Get current metadata
    const user = await clerkClient.users.getUser(userId)
    const currentMetadata = user.publicMetadata || {}
    
    console.log('Current metadata:', JSON.stringify(currentMetadata, null, 2))
    
    // Update user metadata to assign member role
    const updatedMetadata = {
      ...currentMetadata,
      role: 'member',
      profile: 'completed',
      subscription: {
        status: 'active',
        plan: 'basic',
        ...currentMetadata.subscription
      }
    }
    
    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedMetadata
    })
    
    console.log('✅ Member role assigned successfully')
    console.log('Updated metadata:', JSON.stringify(updatedMetadata, null, 2))
    
    return NextResponse.json({
      success: true,
      message: 'Member role assigned successfully',
      userId,
      previousMetadata: currentMetadata,
      newMetadata: updatedMetadata,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error assigning member role:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}