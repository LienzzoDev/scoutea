import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { JobOfferService } from '@/lib/services/job-offer-service'
import { createJobOfferSchema } from '@/lib/validation/job-offer-schemas'

/**
 * GET /api/admin/jobs/[id]
 * Obtiene una oferta de trabajo por ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    const jobOffer = await JobOfferService.getJobOfferById(id)

    if (!jobOffer) {
      return NextResponse.json({ __error: 'Oferta de trabajo no encontrada' }, { status: 404 })
    }

    return NextResponse.json(jobOffer)
  } catch (error) {
    console.error('Error fetching job offer:', error)
    return NextResponse.json(
      { __error: 'Error al obtener la oferta de trabajo' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/jobs/[id]
 * Actualiza una oferta de trabajo
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la oferta existe
    const existingOffer = await JobOfferService.getJobOfferById(id)
    if (!existingOffer) {
      return NextResponse.json({ __error: 'Oferta de trabajo no encontrada' }, { status: 404 })
    }

    // Obtener y validar datos
    const body = await request.json()
    const validatedData = createJobOfferSchema.partial().parse(body)

    // Actualizar oferta de trabajo
    const jobOffer = await JobOfferService.updateJobOffer(id, validatedData)

    return NextResponse.json(jobOffer)
  } catch (error) {
    console.error('Error updating job offer:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { __error: 'Datos inválidos', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { __error: 'Error al actualizar la oferta de trabajo' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/jobs/[id]
 * Elimina una oferta de trabajo
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la oferta existe
    const existingOffer = await JobOfferService.getJobOfferById(id)
    if (!existingOffer) {
      return NextResponse.json({ __error: 'Oferta de trabajo no encontrada' }, { status: 404 })
    }

    // Eliminar oferta de trabajo
    await JobOfferService.deleteJobOffer(id)

    return NextResponse.json({ success: true, message: 'Oferta de trabajo eliminada' })
  } catch (error) {
    console.error('Error deleting job offer:', error)
    return NextResponse.json(
      { __error: 'Error al eliminar la oferta de trabajo' },
      { status: 500 }
    )
  }
}
