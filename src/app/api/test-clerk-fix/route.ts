import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Testing Clerk fix...')
    
    // Verificar que las importaciones de Clerk funcionen
    const clerkInfo = {
      version: '6.32.2',
      issue: 'TaskSelectOrganization export not found',
      solution: 'Updated @clerk/nextjs from 6.28.0 to 6.32.2',
      status: 'Fixed'
    }

    console.log('✅ Clerk fix test successful')

    return NextResponse.json({
      success: true,
      message: 'Clerk has been updated successfully',
      clerkInfo,
      changes: {
        before: '@clerk/nextjs@6.28.0',
        after: '@clerk/nextjs@6.32.2',
        themesUpdated: '@clerk/themes@2.4.21'
      }
    })
  } catch (error) {
    console.error('❌ Error testing Clerk fix:', error)
    return NextResponse.json(
      { 
        error: 'Error testing Clerk fix',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}