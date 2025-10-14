import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ScoutReportCreateSchema } from '@/lib/validation/api-schemas'
import { generateReportId, generatePlayerId } from '@/lib/utils/id-generator'

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
      validatedData = ScoutReportCreateSchema.parse(body);
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

    // Buscar si el jugador ya existe en la base de datos
    let player = await prisma.jugador.findFirst({
      where: {
        player_name: {
          equals: validatedData.playerName,
          mode: 'insensitive'
        }
      }
    })

    // Si no existe, crear el jugador
    if (!player) {
      const playerId = await generatePlayerId(); // Generar ID secuencial: PLY-00020

      player = await prisma.jugador.create({
        data: {
          id_player: playerId, // ✅ Nuevo ID secuencial
          player_name: validatedData.playerName,
          date_of_birth: new Date(validatedData.dateOfBirth),
          position_player: validatedData.position || null,
          height: validatedData.height || null,
          foot: validatedData.foot || null,
          team_name: validatedData.team,
          team_country: validatedData.teamCountry || null,
          nationality_1: validatedData.nationality1,
          nationality_2: validatedData.nationality2 || null,
          national_tier: validatedData.nationalTier || null,
          agency: validatedData.agency || null,
        }
      })
    }

    // Generar ID secuencial para el reporte
    const reportId = await generateReportId();

    // Crear el reporte
    const report = await prisma.reporte.create({
      data: {
        id_report: reportId, // ✅ Nuevo ID secuencial: REP-YYYY-NNNNN
        scout_id: scout.id_scout,
        id_player: player.id_player,
        report_date: new Date(),
        report_type: 'original',
        report_status: 'completed',

        // URLs y contenido del reporte
        form_url_reference: validatedData.urlReference,
        form_url_report: validatedData.urlReport || null,
        form_url_video: validatedData.urlVideo || null,
        form_text_report: validatedData.reportText || null,
        url_secondary: validatedData.imageUrl || null,

        // Análisis del scout
        form_potential: validatedData.potential.toString(),
        potential: validatedData.potential,

        // Snapshot histórico (estado inicial del jugador al momento del reporte)
        initial_age: player.age,
        initial_player_trfm_value: player.player_trfm_value,
        initial_team: player.team_name,

        // Datos del formulario original
        form_player_name: validatedData.playerName,
        form_date_of_birth: validatedData.dateOfBirth,
        form_team_name: validatedData.team,
        form_position_player: validatedData.position || null,
        form_foot: validatedData.foot || null,
        form_height: validatedData.height?.toString() || null,
        form_nationality_1: validatedData.nationality1,
        form_nationality_2: validatedData.nationality2 || null,
        form_national_tier: validatedData.nationalTier || null,
        form_agency: validatedData.agency || null,
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
          id_report: report.id_report, // REP-2025-00056 formato
          report_date: report.report_date,
          report_type: report.report_type,
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