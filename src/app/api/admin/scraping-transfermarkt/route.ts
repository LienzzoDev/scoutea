/**
 * 📥 ENDPOINT DE SCRAPING DE TRANSFERMARKT (DEPRECADO)
 *
 * ⛔ Esta ruta procesaba TODOS los jugadores en una sola request, sin
 * rate limiting ni control de batches: superaba siempre el maxDuration
 * de Vercel y podía provocar bloqueos por parte de Transfermarkt.
 *
 * ✅ Usar en su lugar el pipeline por batches:
 *    POST /api/admin/scraping/start
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json(
      { error: 'No autorizado. Debes iniciar sesión.' },
      { status: 401 }
    )
  }

  return NextResponse.json(
    {
      error: 'Endpoint deprecado. Usa POST /api/admin/scraping/start, que procesa por batches con rate limiting y fallback a PlaymakerStats.',
      replacement: '/api/admin/scraping/start'
    },
    { status: 410 }
  )
}
