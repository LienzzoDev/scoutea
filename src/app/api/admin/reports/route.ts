import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { ReportService } from '@/lib/services/report-service'

export async function GET(request: NextRequest) {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden acceder.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parámetros de búsqueda - soportar cursor o page
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

    // Calcular página basada en cursor (cursor es el offset)
    const page = cursor ? Math.floor(parseInt(cursor) / limit) + 1 : 1

    // Filtros
    const filters: any = {}

    // Filtros de estado y tipo
    // El filtro 'report_status' ahora usa 'approval_status' (pendiente/aprobado/rechazado)
    if (searchParams.get('report_status')) filters.approval_status = searchParams.get('report_status')
    if (searchParams.get('approval_status')) filters.approval_status = searchParams.get('approval_status')
    if (searchParams.get('report_author')) filters.report_author = searchParams.get('report_author')
    if (searchParams.get('report_type')) filters.content_type = searchParams.get('report_type')

    // Filtros de jugador/equipo
    if (searchParams.get('player_name')) filters.player_name = searchParams.get('player_name')
    if (searchParams.get('team_name')) filters.team_name = searchParams.get('team_name')
    if (searchParams.get('nationality_1')) filters.nationality_1 = searchParams.get('nationality_1')

    // Permitir ver reportes huérfanos en el panel de admin
    filters.includeOrphans = true

    const options = {
      page,
      limit,
      sortBy,
      sortOrder,
      filters
    }

    // Usar el servicio existente que ya soporta paginación
    const result = await ReportService.searchReports(options)

    // Calcular el siguiente cursor (offset)
    const currentOffset = (page - 1) * limit
    const nextOffset = currentOffset + result.reports.length
    const hasMore = nextOffset < result.total

    // Devolver en formato compatible con useInfiniteScroll
    return NextResponse.json({
      data: result.reports,
      total: result.total,
      hasMore,
      nextCursor: hasMore ? String(nextOffset) : null
    })
  } catch (error) {
    console.error('Error getting admin reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const report = await ReportService.createReport(body)

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
