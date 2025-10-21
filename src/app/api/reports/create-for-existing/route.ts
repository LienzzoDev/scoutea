import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

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
    const validation = ScoutReportForExistingSchema.safeParse(body);

    if (!validation.success) {
      console.error('Validation errors:', validation.error.issues)
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validation.error.issues
      }, { status: 400 });
    }

    const validatedData = validation.data;

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
        scout: {
          connect: { id_scout: scout.id_scout }
        },
        player: {
          connect: { id_player: player.id_player }
        },
        report_date: new Date(),
        report_type: 'follow-up',
        report_status: 'active',
        form_url_report: validatedData.urlReport || null,
        form_url_video: validatedData.urlVideo || null,
        form_text_report: validatedData.reportText || null,
        form_potential: validatedData.potential.toString(),
        approval_status: 'approved', // Los reportes de jugadores existentes se aprueban automáticamente
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
          report_date: report.report_date,
          report_status: report.report_status
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
  }
}
