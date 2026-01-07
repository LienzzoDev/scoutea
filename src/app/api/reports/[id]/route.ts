import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const reportId = id

    // Obtener el reporte con información del jugador
    const report = await prisma.reporte.findUnique({
      where: { id_report: reportId },
      include: {
        player: {
          select: {
            id_player: true,
            player_name: true,
            position_player: true,
            nationality_1: true,
            team_name: true,
            date_of_birth: true
          }
        },
        scout: {
          select: {
            clerkId: true
          }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
    }

    // Verificar que el reporte pertenece al usuario autenticado
    if (report.scout?.clerkId !== userId) {
      return NextResponse.json({ error: 'No tienes permiso para ver este reporte' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: report
    })

  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const reportId = id
    const body = await request.json()

    console.log('PUT /api/reports/[id] - reportId:', reportId)
    console.log('PUT /api/reports/[id] - body:', body)
    console.log('PUT /api/reports/[id] - userId:', userId)

    // Verificar que el reporte existe y pertenece al scout
    const report = await prisma.reporte.findUnique({
      where: { id_report: reportId },
      include: {
        scout: {
          select: {
            clerkId: true,
            id_scout: true
          }
        }
      }
    })

    console.log('PUT /api/reports/[id] - report found:', !!report)
    console.log('PUT /api/reports/[id] - report.scout:', report?.scout)

    if (!report) {
      return NextResponse.json({ 
        success: false,
        error: 'Reporte no encontrado' 
      }, { status: 404 })
    }

    if (report.scout?.clerkId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes permiso para editar este reporte'
      }, { status: 403 })
    }

    // Check if the report has been approved for editing (approval_status === 'pending')
    // If not approved and not already approved status, deny edit
    if (report.approval_status !== 'pending' && report.approval_status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'Este reporte no está aprobado para edición. Solicita permiso al administrador.'
      }, { status: 403 })
    }

    // Actualizar el reporte
    console.log('PUT /api/reports/[id] - Updating report...')
    const updatedReport = await prisma.reporte.update({
      where: { id_report: reportId },
      data: {
        form_text_report: body.reportText || null,
        form_url_report: body.urlReport || null,
        form_url_video: body.urlVideo || null,
        // Nota: imageUrl no se guarda en Reporte - el modelo solo soporta text, url_report y url_video
        form_potential: body.potential ? body.potential.toString() : null,
        // Reset approval_status back to 'approved' after editing is complete
        approval_status: 'approved',
        updatedAt: new Date()
      }
    })

    console.log('PUT /api/reports/[id] - Report updated successfully')

    return NextResponse.json({
      success: true,
      data: updatedReport
    })

  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar el reporte',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
