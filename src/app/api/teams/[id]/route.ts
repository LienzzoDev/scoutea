import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// Forzar renderizado dinámico para evitar caché de Next.js
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/teams/[id] - Obtener un equipo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // Get params
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de equipo requerido' },
        { status: 400 }
      )
    }

    const team = await prisma.equipo.findUnique({
      where: { id_team: id }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 }
      )
    }

    // Crear respuesta con headers de no-cache
    const response = NextResponse.json(team)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error) {
    console.error('Error getting team:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/teams/[id] - Actualizar un equipo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // Get params
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de equipo requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Helper function to handle string fields - trim if string, pass null explicitly
    const trimOrNull = (value: unknown): string | null => {
      if (value === null || value === undefined || value === '') return null
      if (typeof value === 'string') return value.trim()
      return null
    }

    // Helper function to handle number fields
    const parseNumberOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') return null
      const parsed = typeof value === 'number' ? value : parseFloat(String(value))
      return isNaN(parsed) ? null : parsed
    }

    const team = await prisma.equipo.update({
      where: { id_team: id },
      data: {
        team_name: body.team_name?.trim() || undefined, // team_name is required, don't set to null
        correct_team_name: trimOrNull(body.correct_team_name),
        team_country: trimOrNull(body.team_country),
        url_trfm_advisor: trimOrNull(body.url_trfm_advisor),
        url_trfm: trimOrNull(body.url_trfm),
        owner_club: trimOrNull(body.owner_club),
        owner_club_country: trimOrNull(body.owner_club_country),
        pre_competition: trimOrNull(body.pre_competition),
        competition: trimOrNull(body.competition),
        correct_competition: trimOrNull(body.correct_competition),
        competition_country: trimOrNull(body.competition_country),
        team_trfm_value: parseNumberOrNull(body.team_trfm_value),
        team_trfm_value_norm: parseNumberOrNull(body.team_trfm_value_norm),
        team_rating: parseNumberOrNull(body.team_rating),
        team_rating_norm: parseNumberOrNull(body.team_rating_norm),
        team_elo: parseNumberOrNull(body.team_elo),
        team_level: trimOrNull(body.team_level),
        updatedAt: new Date()
      }
    })

    console.log('✅ Equipo actualizado exitosamente:', team.team_name)
    return NextResponse.json(team)

  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/teams/[id] - Actualización parcial de equipo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // Get params
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de equipo requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Fields that should be parsed as numbers
    const numberFields = new Set([
      'team_trfm_value', 'team_trfm_value_norm',
      'team_rating', 'team_rating_norm',
      'team_elo', 'founded_year'
    ])

    // Construir objeto de actualización dinámicamente
    const updateData: Record<string, unknown> = {}
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined) {
        // Handle null values explicitly
        if (value === null || value === '') {
          updateData[key] = null
        } else if (numberFields.has(key)) {
          // Parse numbers
          const parsed = typeof value === 'number' ? value : parseFloat(String(value))
          updateData[key] = isNaN(parsed) ? null : parsed
        } else if (typeof value === 'string') {
          // Trim strings
          updateData[key] = value.trim()
        } else {
          updateData[key] = value
        }
      }
    })

    // Siempre actualizar timestamp
    updateData.updatedAt = new Date()

    const team = await prisma.equipo.update({
      where: { id_team: id },
      data: updateData
    })

    console.log('✅ Campo de equipo actualizado:', id, Object.keys(body))
    return NextResponse.json(team)

  } catch (error) {
    console.error('Error patching team:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[id] - Eliminar un equipo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // Get params
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de equipo requerido' },
        { status: 400 }
      )
    }

    await prisma.equipo.delete({
      where: { id_team: id }
    })

    console.log('✅ Equipo eliminado exitosamente:', id)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
