import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { JobOfferService } from '@/lib/services/job-offer-service'
import { jobOfferFiltersSchema } from '@/lib/validation/job-offer-schemas'

/**
 * GET /api/scout/jobs
 * Obtiene ofertas de trabajo publicadas (para scouts)
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
    const validatedFilters = jobOfferFiltersSchema.omit({ status: true }).parse(filters)

    // Obtener ofertas de trabajo publicadas
    const result = await JobOfferService.getPublishedJobOffers(validatedFilters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching published job offers:', error)
    return NextResponse.json(
      { __error: 'Error al obtener las ofertas de trabajo' },
      { status: 500 }
    )
  }
}
