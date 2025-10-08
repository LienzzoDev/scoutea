import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ScoutReportForExistingSchema } from '@/lib/validation/api-schemas'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar con Zod
    let validatedData;
    try {
      validatedData = ScoutReportForExistingSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Datos inválidos',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 });
      }
      throw error;
    }

    // Obtener el scout del usuario actual
    const scout = await prisma.scout.findUnique({
      where: { clerkId: userId },
      select: { id_scout: true }
    })

    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    // Verificar que el jugador existe
    const player = await prisma.jugador.findUnique({
      where: { id_player: validatedData.playerId }
    })

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    // Crear el reporte
    const report = await prisma.reporte.create({
      data: {
        scout_id: scout.id_scout,
        id_player: player.id_player,
        player_name: player.player_name,
        report_date: new Date(),
        report_type: 'follow-up',
        form_url_report: validatedData.urlReport || null,
        form_url_video: validatedData.urlVideo || null,
        form_text_report: validatedData.reportText || null,
        url_secondary: validatedData.imageUrl || null,
        form_potential: validatedData.potential.toString(),
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
        total_reports: { increment: 1 }
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
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
