import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// PATCH: Actualizar corrección de liga
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
    const { national_tier, rename_national_tier, country } = body

    if (!national_tier || !rename_national_tier || !country) {
      return NextResponse.json(
        { __error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const correction = await prisma.leagueCorrection.update({
      where: { id },
      data: {
        national_tier: national_tier.trim(),
        rename_national_tier: rename_national_tier.trim(),
        country: country.trim()
      }
    })

    return NextResponse.json({ correction })
  } catch (error: any) {
    console.error('Error updating league correction:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { __error: 'Corrección no encontrada' },
        { status: 404 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { __error: 'Ya existe una corrección para esta liga' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { __error: 'Error al actualizar la corrección' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar corrección de liga
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

    await prisma.leagueCorrection.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting league correction:', error)

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
