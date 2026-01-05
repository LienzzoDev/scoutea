import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = await params

    // Obtener el reporte con información del scout y jugador
    const report = await prisma.reporte.findUnique({
      where: { id_report: id },
      include: {
        scout: { select: { id_scout: true, scout_name: true } },
        player: { select: { player_name: true } }
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
    }

    if (report.approval_status !== 'pending') {
      return NextResponse.json({ error: 'El reporte ya ha sido procesado' }, { status: 400 })
    }

    // Actualizar el reporte como aprobado
    const updatedReport = await prisma.reporte.update({
      where: { id_report: id },
      data: {
        approval_status: 'approved',
        approved_by_admin_id: userId,
        approval_date: new Date()
      }
    })

    // Crear notificación para el scout si existe
    if (report.scout?.id_scout) {
      await prisma.scoutNotification.create({
        data: {
          scout_id: report.scout.id_scout,
          type: 'report_approved',
          title: 'Reporte Aprobado',
          message: `Tu reporte sobre ${report.player?.player_name || 'el jugador'} ha sido aprobado.`,
          report_id: id,
          player_id: report.id_player
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Reporte aprobado exitosamente',
      report: updatedReport
    })
  } catch (error) {
    console.error('Error approving report:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
