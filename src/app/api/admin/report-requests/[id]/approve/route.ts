import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// Helper para verificar si es admin
async function isAdmin() {
  const user = await currentUser()
  if (!user) return false
  const role = user.publicMetadata?.role as string | undefined
  return role === 'admin'
}

// POST - Aprobar solicitud
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { adminResponse } = body as { adminResponse?: string }

    // Obtener la solicitud
    const reportRequest = await prisma.reportRequest.findUnique({
      where: { id },
      include: {
        report: {
          select: {
            id_report: true,
            player: {
              select: {
                player_name: true
              }
            }
          }
        },
        scout: {
          select: {
            id_scout: true
          }
        }
      }
    })

    if (!reportRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    if (reportRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta solicitud ya fue procesada' },
        { status: 400 }
      )
    }

    // Procesar según el tipo de solicitud
    if (reportRequest.request_type === 'delete') {
      // Notificar al scout PRIMERO (antes de eliminar el reporte)
      await prisma.scoutNotification.create({
        data: {
          scout_id: reportRequest.scout.id_scout,
          type: 'request_approved',
          title: 'Solicitud de Eliminación Aprobada',
          message: `Tu solicitud para eliminar el reporte del jugador "${reportRequest.report.player?.player_name || 'N/A'}" ha sido aprobada. El reporte ha sido eliminado.${adminResponse ? `\n\nMensaje del admin: ${adminResponse}` : ''}`,
          report_id: null // Ya no existirá el reporte
        }
      })

      // Eliminar el reporte (esto también elimina la solicitud por onDelete: Cascade)
      await prisma.reporte.delete({
        where: { id_report: reportRequest.report_id }
      })

      // Nota: No actualizamos ReportRequest porque ya fue eliminado por Cascade
    } else if (reportRequest.request_type === 'edit') {
      // Cambiar el estado del reporte a pendiente para que pueda ser editado
      await prisma.reporte.update({
        where: { id_report: reportRequest.report_id },
        data: {
          approval_status: 'pending'
        }
      })

      // Actualizar la solicitud
      await prisma.reportRequest.update({
        where: { id },
        data: {
          status: 'approved',
          admin_response: adminResponse || 'Solicitud de edición aprobada. El reporte está ahora en estado pendiente.',
          resolved_at: new Date()
        }
      })

      // Notificar al scout
      await prisma.scoutNotification.create({
        data: {
          scout_id: reportRequest.scout.id_scout,
          type: 'request_approved',
          title: 'Solicitud de Edición Aprobada',
          message: `Tu solicitud para editar el reporte del jugador "${reportRequest.report.player?.player_name || 'N/A'}" ha sido aprobada. Ahora puedes editar el reporte.${adminResponse ? `\n\nMensaje del admin: ${adminResponse}` : ''}`,
          report_id: reportRequest.report_id,
          player_id: reportRequest.report.player?.player_name ? undefined : undefined
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error approving report request:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
