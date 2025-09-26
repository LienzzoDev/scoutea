import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Checking if scout is in list:', id)
    
    // Por ahora, usar el usuario real de la base de datos
    // En una implementación real, obtendrías esto del token de autenticación
    const userId = 'cmfqgblx80000zwrxa4tjzu1b'
    
    // Verificar si el scout está en la lista del usuario
    const scoutInList = await prisma.scoutList.findFirst({
      where: {
        userId: userId,
        scoutId: id
      }
    })

    const isInList = !!scoutInList

    console.log('✅ Scout in list check result:', { scoutId: id, isInList })

    return NextResponse.json({
      success: true,
      isInList,
      scoutId: id
    })
  } catch (error) {
    console.error('❌ Error checking scout in list:', error)
    return NextResponse.json(
      { 
        error: 'Error checking scout in list',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}