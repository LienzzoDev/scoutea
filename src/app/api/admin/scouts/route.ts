/**
 * 📥 ENDPOINT DE SCOUTS CON PAGINACIÓN (INFINITE SCROLL)
 *
 * ✅ PROPÓSITO: Obtener scouts con paginación cursor-based para administración
 * ✅ BENEFICIO: Soporta carga infinita de miles de scouts
 * ✅ RUTA: GET /api/admin/scouts
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/scouts - Obtener scouts con paginación
 *
 * Query params:
 * - cursor: ID del último scout cargado (para paginación)
 * - limit: Número de scouts por página (default: 50, max: 100)
 * - search: Término de búsqueda
 * - nationality: Filtro por nacionalidad
 * - country: Filtro por país
 */
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

    // 📝 OBTENER PARÁMETROS DE QUERY
    const searchParams = request.nextUrl.searchParams
    const cursor = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const searchTerm = searchParams.get('search')
    const nationality = searchParams.get('nationality')
    const country = searchParams.get('country')

    // Validar y parsear limit
    const limit = Math.min(
      parseInt(limitParam || '50', 10),
      100 // Máximo 100 por página
    )

    // 🔍 CONSTRUIR FILTROS
    const where: any = {}

    // Filtro de búsqueda (busca en nombre, email, etc.)
    if (searchTerm && searchTerm.trim()) {
      where.OR = [
        { scout_name: { contains: searchTerm, mode: 'insensitive' } },
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { surname: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    // Filtros específicos
    if (nationality) {
      where.nationality = nationality
    }
    if (country) {
      where.country = country
    }
    
    // Filtro open to work
    const openToWork = searchParams.get('openToWork')
    if (openToWork === 'true') {
      where.open_to_work = true
    }

    // 📋 SELECT OPTIMIZADO PARA LISTA (campos esenciales para mostrar)
    const listSelect = {
      id_scout: true,
      clerkId: true,
      scout_name: true,
      name: true,
      surname: true,
      date_of_birth: true,
      age: true,
      nationality: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      country: true,
      favourite_club: true,
      open_to_work: true,
      professional_experience: true,
      twitter_profile: true,
      instagram_profile: true,
      linkedin_profile: true,
      url_profile: true,

      // Métricas de rendimiento
      total_reports: true,
      total_reports_norm: true,
      total_reports_rank: true,
      original_reports: true,
      original_reports_norm: true,
      original_reports_rank: true,

      // Expertise
      nationality_expertise: true,
      competition_expertise: true,

      // Edad promedio
      avg_potential: true,
      avg_initial_age: true,
      avg_initial_age_norm: true,

      // ROI y profits
      roi: true,
      roi_norm: true,
      roi_rank: true,
      roi_orig: true,
      roi_orig_rank: true,
      net_profits: true,
      net_profits_rank: true,
      net_profits_orig: true,
      net_profits_orig_rank: true,

      // Inversión
      total_investment: true,
      total_investment_rank: true,
      total_investment_orig: true,
      total_investment_orig_rank: true,

      // Valores iniciales promedio
      avg_initial_trfm_value: true,
      avg_initial_trfm_value_rank: true,

      // Profit reports
      max_profit_report: true,
      max_profit_report_rank: true,
      min_profit_report: true,
      min_profit_report_rank: true,
      avg_profit_report: true,
      avg_profit_report_norm: true,
      avg_profit_report_rank: true,

      // Transfer points
      transfer_team_pts: true,
      transfer_team_pts_norm: true,
      transfer_team_pts_rank: true,
      transfer_competition_pts: true,
      transfer_competition_pts_norm: true,
      transfer_competition_pts_rank: true,

      // Team/Competition averages
      avg_initial_team_elo: true,
      avg_initial_team_level: true,
      avg_initial_competition_elo: true,
      avg_initial_competition_level: true,

      // ELO y ranking
      scout_elo: true,
      scout_ranking: true,
      scout_level: true,

      // Timestamps
      join_date: true,
      createdAt: true,
      updatedAt: true
    }

    // 📊 EJECUTAR QUERY CON CURSOR-BASED PAGINATION
    const queryConfig: any = {
      where,
      take: limit + 1, // Tomar uno extra para saber si hay más
      ...(cursor ? {
        cursor: {
          id_scout: cursor
        },
        skip: 1 // Saltar el cursor actual
      } : {}),
      orderBy: {
        createdAt: 'desc' // Ordenar por fecha de creación
      },
      select: listSelect
    }

    const scouts = await prisma.scout.findMany(queryConfig)

    // 🔄 DETERMINAR SI HAY MÁS PÁGINAS
    const hasMore = scouts.length > limit
    const returnScouts = hasMore ? scouts.slice(0, limit) : scouts
    const nextCursor = hasMore ? returnScouts[returnScouts.length - 1]?.id_scout : null

    // 📊 OBTENER CONTEO TOTAL (solo en la primera página para performance)
    let totalCount = null
    if (!cursor) {
      totalCount = await prisma.scout.count({ where })
    }

    // 📊 LOG DE AUDITORÍA
    console.log('✅ Scouts fetch completed:', {
      returned: returnScouts.length,
      hasMore,
      cursor,
      totalCount,
      userId,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      scouts: returnScouts,
      nextCursor,
      hasMore,
      totalCount
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error fetching scouts:', error)

    // Log más detallado del error
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    // Devolver error más descriptivo en desarrollo
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = isDevelopment && error instanceof Error
      ? error.message
      : 'Error interno del servidor al obtener scouts.'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/scouts - Actualizar un campo de un scout
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { scoutId, fieldName, value } = body

    if (!scoutId || !fieldName) {
      return NextResponse.json(
        { error: 'scoutId y fieldName son requeridos' },
        { status: 400 }
      )
    }

    // Actualizar el campo
    const updateData: any = {}
    updateData[fieldName] = value

    const scout = await prisma.scout.update({
      where: { id_scout: scoutId },
      data: updateData
    })

    return NextResponse.json({ success: true, scout })
  } catch (error) {
    console.error('❌ Error updating scout:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el scout' },
      { status: 500 }
    )
  }
}
