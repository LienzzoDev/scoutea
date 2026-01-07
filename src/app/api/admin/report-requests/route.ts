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

// GET - Obtener todas las solicitudes (solo admin)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, rejected, all
    const requestType = searchParams.get('type') // edit, delete, all

    // Obtener solicitudes
    const requests = await prisma.reportRequest.findMany({
      where: {
        ...(status && status !== 'all' ? { status } : {}),
        ...(requestType && requestType !== 'all' ? { request_type: requestType } : {})
      },
      include: {
        scout: {
          select: {
            id_scout: true,
            scout_name: true,
            name: true,
            surname: true,
            email: true
          }
        },
        report: {
          select: {
            id_report: true,
            form_text_report: true,
            form_url_report: true,
            form_url_video: true,
            form_potential: true,
            report_date: true,
            approval_status: true,
            player: {
              select: {
                id_player: true,
                player_name: true,
                position_player: true,
                team_name: true,
                nationality_1: true
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // pending primero
        { createdAt: 'desc' }
      ]
    })

    // Contar pendientes
    const pendingCount = await prisma.reportRequest.count({
      where: { status: 'pending' }
    })

    return NextResponse.json({
      requests,
      pendingCount
    })
  } catch (error) {
    console.error('Error fetching report requests:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
