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

    const body = await request.json()
    const { metadata } = body

    console.log('Updating user metadata for userId:', userId)
    console.log('Metadata to update:', JSON.stringify(metadata, null, 2))
    
    // Actualizar metadatos públicos del usuario
    await clerkClient.users.updateUser(userId, {
      publicMetadata: metadata
    })

    console.log('User metadata updated successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user metadata:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}