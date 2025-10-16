import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('➖ Removing scout from list:', id)
    
    // Por ahora, usar el usuario real de la base de datos
    // En una implementación real, obtendrías esto del token de autenticación
    const userId = 'cmfqgblx80000zwrxa4tjzu1b'
    
    // Buscar y eliminar el scout de la lista
    const deletedEntry = await prisma.scoutList.deleteMany({
      where: {
        userId: userId,
        scoutId: id
      }
    })

    if (deletedEntry.count === 0) {
      return NextResponse.json(
        { error: 'Scout not found in list' },
        { status: 404 }
      )
    }

    console.log('✅ Scout removed from list:', { scoutId: id, deletedCount: deletedEntry.count })

    return NextResponse.json({
      success: true,
      message: 'Scout removed from list successfully',
      deletedCount: deletedEntry.count
    })
  } catch (error) {
    console.error('❌ Error removing scout from list:', error)
    return NextResponse.json(
      { 
        error: 'Error removing scout from list',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}