import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { populatePlayerData } from '@/scripts/populate-player-data'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' }, 
        { status: 401 }
      )
    }

    const userRole = sessionClaims?.public_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores.' },
        { status: 403 }
      )
    }

    // Ejecutar el script de población de datos
    await populatePlayerData()

    return NextResponse.json({ 
      success: true, 
      message: 'Datos poblados exitosamente' 
    })

  } catch (error) {
    console.error('Error populating data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}