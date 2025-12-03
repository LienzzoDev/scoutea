import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// PATCH: Actualizar corrección de nacionalidad
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const correction = await prisma.nationalityCorrection.update({
      where: { id },
      data: body
    })

    return NextResponse.json({ correction })
  } catch (error) {
    console.error('Error updating nationality correction:', error)
    return NextResponse.json(
      { __error: 'Error al actualizar la corrección' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar corrección de nacionalidad
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.nationalityCorrection.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting nationality correction:', error)
    return NextResponse.json(
      { __error: 'Error al eliminar la corrección' },
      { status: 500 }
    )
  }
}
