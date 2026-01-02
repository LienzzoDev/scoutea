import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { generateReportId } from '@/lib/utils/id-generator'
import { ScoutReportCreateSchema } from '@/lib/validation/api-schemas'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Received body:', JSON.stringify(body, null, 2))

    // Validar con Zod
    let validatedData;
    try {
      validatedData = ScoutReportCreateSchema.parse(body);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2))
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error)
        return NextResponse.json({
          error: 'Datos inválidos',
          details: (error.errors || []).map((err: any) => ({
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

    // Si no existe, crear el jugador con estado pending (requiere aprobación admin)
    if (!player) {
      // Preparar datos con conversión de tipos
      const heightValue = validatedData.height ? Number(validatedData.height) : null

      player = await prisma.jugador.create({
        data: {
          player_name: validatedData.playerName,
          date_of_birth: new Date(validatedData.dateOfBirth),
          position_player: validatedData.position || null,
          height: heightValue,
          foot: validatedData.foot || null,
          team_name: validatedData.team,
          team_country: validatedData.teamCountry || null,
          nationality_1: validatedData.nationality1,
          nationality_2: validatedData.nationality2 || null,
          national_tier: validatedData.nationalTier || null,
          agency: validatedData.agency || null,
          url_trfm: validatedData.urlReference || null,
        }
      })
    }

    // Generar ID secuencial para el reporte
    const reportId = await generateReportId();

    // Crear el reporte usando las relaciones de Prisma
    const report = await prisma.reporte.create({
      data: {
        id_report: reportId, // ✅ Nuevo ID secuencial: REP-YYYY-NNNNN
        report_date: new Date(),
        report_type: 'original',
        report_status: 'completed',
        approval_status: 'pending', // ✅ Reporte requiere aprobación

        // URLs y contenido del reporte
        form_url_report: validatedData.urlReport || null,
        form_url_video: validatedData.urlVideo || null,
        form_text_report: validatedData.reportText || null,

        // Análisis del scout
        form_potential: validatedData.potential.toString(),

        // Snapshot histórico (estado inicial del jugador al momento del reporte)
        initial_age: player.age,
        initial_player_trfm_value: player.player_trfm_value,
        initial_team: player.team_name,

        // Relaciones usando connect
        scout: {
          connect: { id_scout: scout.id_scout }
        },
        player: {
          connect: { id_player: player.id_player }
        }
      }
    })

    console.log('✅ Report created successfully:', {
      id_report: report.id_report,
      id_player: player.id_player,
      player_name: player.player_name,
      approval_status: report.approval_status
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}