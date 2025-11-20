import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// PATCH: Actualizar corrección de equipo
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
    const { original_name, corrected_name } = body

    if (!original_name || !corrected_name) {
      return NextResponse.json(
        { __error: 'Nombre original y corregido son requeridos' },
        { status: 400 }
      )
    }

    const correction = await prisma.teamNameCorrection.update({
      where: { id },
      data: {
        original_name: original_name.trim(),
        corrected_name: corrected_name.trim()
      }
    })

    return NextResponse.json({ correction })
  } catch (error: any) {
    console.error('Error updating team correction:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { __error: 'Corrección no encontrada' },
        { status: 404 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { __error: 'Ya existe una corrección para este nombre de equipo' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { __error: 'Error al actualizar la corrección' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar corrección de equipo
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

    await prisma.teamNameCorrection.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting team correction:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { __error: 'Corrección no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { __error: 'Error al eliminar la corrección' },
      { status: 500 }
    )
  }
}
