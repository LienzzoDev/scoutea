import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validar campos requeridos
    const requiredFields = ['playerName', 'dateOfBirth', 'team', 'nationality1', 'urlReference', 'potential']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Campo requerido: ${field}` }, { status: 400 })
      }
    }

    // Obtener el scout del usuario actual
    const scout = await prisma.scout.findUnique({
      where: { clerkId: userId },
      select: { id_scout: true }
    })

    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    // Buscar si el jugador ya existe en la base de datos
    let player = await prisma.jugador.findFirst({
      where: {
        player_name: {
          equals: body.playerName,
          mode: 'insensitive'
        }
      }
    })

    // Si no existe, crear el jugador
    if (!player) {
      player = await prisma.jugador.create({
        data: {
          player_name: body.playerName,
          date_of_birth: new Date(body.dateOfBirth),
          position_player: body.position || null,
          height: body.height ? parseFloat(body.height) : null,
          foot: body.foot || null,
          team_name: body.team,
          team_country: body.teamCountry || null,
          nationality_1: body.nationality1,
          nationality_2: body.nationality2 || null,
          national_tier: body.nationalTier || null,
          agency: body.agency || null,
        }
      })
    }

    // Crear el reporte
    const report = await prisma.reporte.create({
      data: {
        scout_id: scout.id_scout,
        id_player: player.id_player,
        player_name: body.playerName,
        report_date: new Date(),
        report_type: 'original',
        form_url_reference: body.urlReference,
        form_url_report: body.urlReport || null,
        form_url_video: body.urlVideo || null,
        form_text_report: body.reportText || null,
        form_potential: body.potential.toString(),
        form_player_name: body.playerName,
        form_date_of_birth: body.dateOfBirth,
        form_team_name: body.team,
        form_position_player: body.position || null,
        form_foot: body.foot || null,
        form_height: body.height || null,
        form_nationality_1: body.nationality1,
        form_nationality_2: body.nationality2 || null,
        form_national_tier: body.nationalTier || null,
        form_agency: body.agency || null,
        // Copiar datos del jugador al reporte
        date_of_birth: player.date_of_birth,
        position_player: player.position_player,
        height: player.height,
        foot: player.foot,
        team_name: player.team_name,
        team_country: player.team_country,
        nationality_1: player.nationality_1,
        nationality_2: player.nationality_2,
        national_tier: player.national_tier,
        agency: player.agency,
      }
    })

    // Actualizar estadísticas del scout
    await prisma.scout.update({
      where: { id_scout: scout.id_scout },
      data: {
        total_reports: { increment: 1 },
        original_reports: { increment: 1 }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        report: {
          id_report: report.id_report,
          player_name: report.player_name,
          report_date: report.report_date
        },
        player: {
          id_player: player.id_player,
          player_name: player.player_name
        }
      }
    })

  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}