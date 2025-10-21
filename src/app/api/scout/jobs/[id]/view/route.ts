import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { JobOfferService } from '@/lib/services/job-offer-service'

/**
 * POST /api/scout/jobs/[id]/view
 * Incrementa el contador de vistas de una oferta
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ __error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    await JobOfferService.incrementViews(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error incrementing views:', error)
    return NextResponse.json(
      { __error: 'Error al incrementar vistas' },
      { status: 500 }
    )
  }
}
