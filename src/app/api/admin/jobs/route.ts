import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { JobOfferService } from '@/lib/services/job-offer-service'
import { createJobOfferSchema, jobOfferFiltersSchema } from '@/lib/validation/job-offer-schemas'

/**
 * GET /api/admin/jobs
 * Obtiene todas las ofertas de trabajo con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'No autenticado' }, { status: 401 })
    }

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams
    const filters = {
      status: searchParams.get('status') || undefined,
      position_type: searchParams.get('position_type') || undefined,
      contract_type: searchParams.get('contract_type') || undefined,
      experience_level: searchParams.get('experience_level') || undefined,
      team_id: searchParams.get('team_id') || undefined,
      remote_allowed: searchParams.get('remote_allowed') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as 'createdAt' | 'title' | 'expires_at' | 'salary_min') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    }

    // Validar filtros
    const validatedFilters = jobOfferFiltersSchema.parse(filters)

    // Obtener ofertas de trabajo
    const result = await JobOfferService.getJobOffers(validatedFilters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching job offers:', error)
    return NextResponse.json(
      { __error: 'Error al obtener las ofertas de trabajo' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/jobs
 * Crea una nueva oferta de trabajo
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'No autenticado' }, { status: 401 })
    }

    // Obtener datos del cuerpo de la petición
    const body = await request.json()

    // Validar datos
    const validatedData = createJobOfferSchema.parse(body)

    // Crear oferta de trabajo
    const jobOffer = await JobOfferService.createJobOffer(validatedData, userId)

    return NextResponse.json(jobOffer, { status: 201 })
  } catch (error) {
    console.error('Error creating job offer:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { __error: 'Datos inválidos', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { __error: 'Error al crear la oferta de trabajo' },
      { status: 500 }
    )
  }
}
