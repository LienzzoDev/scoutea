import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const reportId = id

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

    if (!report) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
    }

    // Verificar permisos: dueño del reporte o ADMIN
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    const isOwner = report.scout?.clerkId === userId
    const isAdmin = userRole === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar este reporte' }, { status: 403 })
    }

    // Eliminar el reporte
    await prisma.reporte.delete({
      where: { id_report: reportId }
    })

    // Actualizar estadísticas del scout
    if (report.scout_id) {
      await prisma.scout.update({
        where: { id_scout: report.scout_id },
        data: {
          total_reports: { decrement: 1 },
          ...(report.report_type === 'original' && {
            original_reports: { decrement: 1 }
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Reporte eliminado correctamente'
    })

  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al eliminar el reporte',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
