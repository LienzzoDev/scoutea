import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { createSampleScouts } from '@/scripts/create-sample-scouts'

export async function POST(__request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { __error: 'No autorizado' }, 
        { status: 401 }
      )
    }

    const userRole = sessionClaims?.public_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { __error: 'Acceso denegado. Solo administradores.' },
        { status: 403 }
      )
    }

    // Ejecutar el script de creación de scouts
    await createSampleScouts()

    return NextResponse.json({ 
      success: true, 
      message: 'Sample scouts created successfully' 
    })

  } catch (_error) {
    console.error('Error creating sample scouts:', error)
    return NextResponse.json(
      { __error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}