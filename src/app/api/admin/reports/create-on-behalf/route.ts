import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { getUserRole } from '@/lib/auth/user-role'
import { prisma } from '@/lib/db'
import { AdminReportForScoutSchema } from '@/lib/validation/api-schemas'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario es admin
    const user = await prisma.usuario.findUnique({
      where: { clerkId: userId }
    })

    const userRole = getUserRole(user as any)
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado. Solo administradores pueden crear reportes en nombre de scouts.' }, { status: 403 })
    }

    const body = await request.json()

    // Validar con Zod
    const validation = AdminReportForScoutSchema.safeParse(body);

    if (!validation.success) {
      console.error('Validation errors:', validation.error.issues)
      return NextResponse.json({
        error: 'Datos inválidos',
        details: validation.error.issues
      }, { status: 400 });
    }

    const validatedData = validation.data;

    // Verificar que el scout existe
    const scout = await prisma.scout.findUnique({
      where: { id_scout: validatedData.scoutId },
      select: { id_scout: true, scout_name: true }
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

    // Crear el reporte en nombre del scout
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
        approval_status: 'approved', // Los reportes creados por admin se aprueban automáticamente
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
        scout: {
          id_scout: scout.id_scout,
          scout_name: scout.scout_name
        },
        player: {
          id_player: player.id_player,
          player_name: player.player_name
        }
      }
    })

  } catch (error) {
    console.error('Error creating report on behalf of scout:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
