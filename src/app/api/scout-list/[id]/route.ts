import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// DELETE /api/scout-list/[id] - Remover scout de la lista
export async function DELETE(
  __request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { __error: 'No autorizado' },
        { status: 401 }
      )
    }

    const scoutId = params.id

    if (!scoutId) {
      return NextResponse.json(
        { __error: 'ID de scout requerido' },
        { status: 400 }
      )
    }

    // Buscar usuario en la base de datos
    const user = await prisma.usuario.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json(
        { __error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Buscar y eliminar la entrada de la lista
    const deletedEntry = await prisma.scoutList.deleteMany({
      where: {
        userId: user.id,
        scoutId: scoutId
      }
    })

    if (deletedEntry.count === 0) {
      return NextResponse.json(
        { __error: 'Scout no encontrado en tu lista' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      message: 'Scout removido de la lista exitosamente' 
    })
  } catch (_error) {
    console.error('Error removing scout from list:', error)
    return NextResponse.json(
      { __error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}