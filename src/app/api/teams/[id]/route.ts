import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { 
  handleAPIError, 
  extractErrorContext, 
  requireAuth, 
  requireParam,
  ErrorResponses 
} from '@/lib/errors'

// GET /api/teams/[id] - Obtener un equipo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = extractErrorContext(request)
    const { userId } = await auth()

    // Get params
    const { id } = await params

    // Validaciones usando nuevas funciones
    requireAuth(userId, context)
    requireParam(id, 'id', context)

    const team = await prisma.equipo.findUnique({
      where: { id_team: id }
    })

    if (!team) {
      throw ErrorResponses.TEAM_NOT_FOUND
    }

    return NextResponse.json(team)

  } catch (_error) {
    return handleAPIError(error, extractErrorContext(request))
  }
}

// PUT /api/teams/[id] - Actualizar un equipo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = extractErrorContext(request)
    const { userId } = await auth()

    // Get params
    const { id } = await params

    // Validaciones usando nuevas funciones
    requireAuth(userId, context)
    requireParam(id, 'id', context)

    const body = await request.json()

    const team = await prisma.equipo.update({
      where: { id_team: id },
      data: {
        team_name: body.team_name?.trim(),
        correct_team_name: body.correct_team_name?.trim(),
        team_country: body.team_country?.trim(),
        url_trfm_advisor: body.url_trfm_advisor?.trim(),
        url_trfm: body.url_trfm?.trim(),
        owner_club: body.owner_club?.trim(),
        owner_club_country: body.owner_club_country?.trim(),
        pre_competition: body.pre_competition?.trim(),
        competition: body.competition?.trim(),
        correct_competition: body.correct_competition?.trim(),
        competition_country: body.competition_country?.trim(),
        team_trfm_value: body.team_trfm_value ? parseFloat(body.team_trfm_value) : undefined,
        team_trfm_value_norm: body.team_trfm_value_norm ? parseFloat(body.team_trfm_value_norm) : undefined,
        team_rating: body.team_rating ? parseFloat(body.team_rating) : undefined,
        team_rating_norm: body.team_rating_norm ? parseFloat(body.team_rating_norm) : undefined,
        team_elo: body.team_elo ? parseFloat(body.team_elo) : undefined,
        team_level: body.team_level?.trim(),
        updatedAt: new Date()
      }
    })

    console.log('✅ Equipo actualizado exitosamente:', team.team_name)
    return NextResponse.json(team)

  } catch (_error) {
    return handleAPIError(error, extractErrorContext(request))
  }
}

// PATCH /api/teams/[id] - Actualización parcial de equipo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = extractErrorContext(request)
    const { userId } = await auth()

    // Get params
    const { id } = await params

    // Validaciones
    requireAuth(userId, context)
    requireParam(id, 'id', context)

    const body = await request.json()

    // Construir objeto de actualización dinámicamente
    const updateData: any = {}
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value
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

  } catch (_error) {
    return handleAPIError(error, extractErrorContext(request))
  }
}

// DELETE /api/teams/[id] - Eliminar un equipo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = extractErrorContext(request)
    const { userId } = await auth()

    // Get params
    const { id } = await params

    // Validaciones usando nuevas funciones
    requireAuth(userId, context)
    requireParam(id, 'id', context)

    await prisma.equipo.delete({
      where: { id_team: id }
    })

    console.log('✅ Equipo eliminado exitosamente:', id)
    return NextResponse.json({ success: true })

  } catch (_error) {
    return handleAPIError(error, extractErrorContext(request))
  }
}