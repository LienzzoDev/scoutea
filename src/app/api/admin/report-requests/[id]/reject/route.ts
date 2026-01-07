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

// POST - Rechazar solicitud
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
                id_player: true,
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

    // Actualizar la solicitud como rechazada
    await prisma.reportRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        admin_response: adminResponse || 'Solicitud rechazada',
        resolved_at: new Date()
      }
    })

    // Notificar al scout
    const requestTypeLabel = reportRequest.request_type === 'edit' ? 'edición' : 'eliminación'
    await prisma.scoutNotification.create({
      data: {
        scout_id: reportRequest.scout.id_scout,
        type: 'request_rejected',
        title: `Solicitud de ${requestTypeLabel.charAt(0).toUpperCase() + requestTypeLabel.slice(1)} Rechazada`,
        message: `Tu solicitud de ${requestTypeLabel} para el reporte del jugador "${reportRequest.report.player?.player_name || 'N/A'}" ha sido rechazada.${adminResponse ? `\n\nMotivo: ${adminResponse}` : ''}`,
        report_id: reportRequest.report_id,
        player_id: reportRequest.report.player?.id_player
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error rejecting report request:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
