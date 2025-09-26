import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    console.log('➕ Adding scout to list:', id, body)
    
    // Por ahora, usar el usuario real de la base de datos
    // En una implementación real, obtendrías esto del token de autenticación
    const userId = 'cmfqgblx80000zwrxa4tjzu1b'
    
    // Verificar si el scout ya está en la lista
    const existingEntry = await prisma.scoutList.findFirst({
      where: {
        userId: userId,
        scoutId: id
      }
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Scout already in list' },
        { status: 400 }
      )
    }

    // Añadir el scout a la lista
    const newEntry = await prisma.scoutList.create({
      data: {
        userId: userId,
        scoutId: id
      }
    })

    console.log('✅ Scout added to list:', newEntry)

    return NextResponse.json({
      success: true,
      message: 'Scout added to list successfully',
      entry: newEntry
    })
  } catch (error) {
    console.error('❌ Error adding scout to list:', error)
    return NextResponse.json(
      { 
        error: 'Error adding scout to list',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}