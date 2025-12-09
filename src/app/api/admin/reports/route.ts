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
    
    // Parámetros de búsqueda
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

    // Filtros
    const filters: any = {}
    
    // Filtros de estado y tipo
    if (searchParams.get('report_status')) filters.report_status = searchParams.get('report_status')
    if (searchParams.get('report_validation')) filters.report_validation = searchParams.get('report_validation')
    if (searchParams.get('report_author')) filters.report_author = searchParams.get('report_author')
    if (searchParams.get('report_type')) filters.report_type = searchParams.get('report_type')
    
    // Filtros de jugador/equipo
    if (searchParams.get('player_name')) filters.player_name = searchParams.get('player_name')
    if (searchParams.get('team_name')) filters.team_name = searchParams.get('team_name')
    if (searchParams.get('nationality_1')) filters.nationality_1 = searchParams.get('nationality_1')
    
    // Filtro de scout
    if (searchParams.get('scout_name')) {
      // Nota: ReportService necesita actualización para filtrar por nombre de scout si no lo soporta nativamente
      // Pero por ahora pasamos lo que tenemos
    }

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

    return NextResponse.json(result)
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
