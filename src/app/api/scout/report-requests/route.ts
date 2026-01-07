import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// GET - Obtener solicitudes del scout autenticado
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el scout asociado al usuario
    const scout = await prisma.scout.findUnique({
      where: { clerkId: userId },
      select: { id_scout: true }
    })

    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, rejected, all

    // Obtener solicitudes del scout
    const requests = await prisma.reportRequest.findMany({
      where: {
        scout_id: scout.id_scout,
        ...(status && status !== 'all' ? { status } : {})
      },
      include: {
        report: {
          select: {
            id_report: true,
            form_text_report: true,
            form_url_video: true,
            player: {
              select: {
                player_name: true,
                position_player: true,
                team_name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching report requests:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva solicitud de edición/eliminación
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el scout asociado al usuario
    const scout = await prisma.scout.findUnique({
      where: { clerkId: userId },
      select: { id_scout: true }
    })

    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { reportId, requestType, reason } = body as {
      reportId: string
      requestType: 'edit' | 'delete'
      reason: string
    }

    // Validar datos
    if (!reportId || !requestType || !reason) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    if (!['edit', 'delete'].includes(requestType)) {
      return NextResponse.json(
        { error: 'Tipo de solicitud inválido' },
        { status: 400 }
      )
    }

    if (reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'La razón debe tener al menos 10 caracteres' },
        { status: 400 }
      )
    }

    // Verificar que el reporte existe y pertenece al scout
    const report = await prisma.reporte.findUnique({
      where: { id_report: reportId },
      select: { id_report: true, scout_id: true }
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      )
    }

    if (report.scout_id !== scout.id_scout) {
      return NextResponse.json(
        { error: 'No tienes permiso para solicitar cambios en este reporte' },
        { status: 403 }
      )
    }

    // Verificar si ya existe una solicitud pendiente para este reporte
    const existingRequest = await prisma.reportRequest.findFirst({
      where: {
        report_id: reportId,
        scout_id: scout.id_scout,
        status: 'pending'
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud pendiente para este reporte' },
        { status: 409 }
      )
    }

    // Crear la solicitud
    const newRequest = await prisma.reportRequest.create({
      data: {
        scout_id: scout.id_scout,
        report_id: reportId,
        request_type: requestType,
        reason: reason.trim(),
        status: 'pending'
      },
      include: {
        report: {
          select: {
            player: {
              select: {
                player_name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      request: newRequest
    })
  } catch (error) {
    console.error('Error creating report request:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
