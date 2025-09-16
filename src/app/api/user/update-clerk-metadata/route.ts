import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role, profile, phone, company, position, subscription } = body

    // Validar datos
    if (!role || !profile) {
      return NextResponse.json(
        { error: 'Missing required fields: role and profile' },
        { status: 400 }
      )
    }

    // Obtener metadatos existentes para preservarlos
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    const existingMetadata = user.publicMetadata || {}

    // Actualizar metadatos de Clerk usando funciones integradas (más eficiente)
    const metadata = {
      ...existingMetadata, // Preservar metadatos existentes
      role,
      profile,
      ...(phone && { phone }),
      ...(company && { company }),
      ...(position && { position }),
      ...(subscription && { subscription })
    }


    await clerk.users.updateUser(userId, {
      publicMetadata: metadata
    })


    return NextResponse.json({ 
      success: true,
      message: 'Clerk metadata updated successfully',
      userId,
      metadata
    })
  } catch (error) {
    console.error('❌ Error updating Clerk metadata:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
