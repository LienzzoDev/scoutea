/**
 * 🔢 ENDPOINT DE RECÁLCULO POST-IMPORTACIÓN CON LIVE STREAMING
 *
 * ✅ PROPÓSITO: Recalcular los campos derivados reales (age_value, nationality_value
 *    y normalizaciones) tras una importación de jugadores.
 * ✅ RUTA: POST /api/admin/recalculate
 * ✅ El botón de importación lo llama automáticamente al terminar el import, de modo
 *    que el admin no necesita ejecutar scripts a mano.
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

import { PostImportCalculationService, type RecalcEvent } from '@/lib/services/post-import-calculation-service'

export const maxDuration = 300 // 5 minutos (máximo en Vercel Hobby plan)
export const dynamic = 'force-dynamic'

function sendSSE(controller: ReadableStreamDefaultController, data: Record<string, unknown>) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`))
}

export async function POST(_request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autorizado. Debes iniciar sesión.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado. Solo los administradores pueden recalcular datos.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          sendSSE(controller, {
            type: 'start',
            message: '🔢 Iniciando recálculo de campos derivados (edad, nacionalidad, normalizaciones)...',
          })

          const onEvent = (e: RecalcEvent) => {
            if (e.type === 'phase') {
              sendSSE(controller, { type: 'info', message: e.message })
            } else if (e.type === 'progress') {
              sendSSE(controller, {
                type: 'recalc_progress',
                phase: e.phase,
                current: e.current,
                total: e.total,
                percentage: e.percentage,
              })
            } else if (e.type === 'phase_done') {
              sendSSE(controller, {
                type: 'success',
                message: `✅ Fase "${e.phase}" completada: ${e.updated}/${e.total} jugadores`,
              })
            }
          }

          const summary = await PostImportCalculationService.recalculateAll(onEvent)

          const c = summary.categories.counts
          const tl = summary.teamLinking
          const tp = summary.transferPoints
          sendSSE(controller, {
            type: 'recalc_complete',
            message: `✅ Recálculo completado: team-link (team_id ${tl.teamIdLinked} / status ${tl.teamStatusCopied} / level ${tl.teamLevelCopied}), edad ${summary.ageValues.updated}, nacionalidad ${summary.nationalityValues.updated}, normalizaciones ${summary.normalizations.updated}, categorías (Big Five ${c.big_five} / Top Leagues ${c.top_leagues} / Professional ${c.professional} / Emerging ${c.emerging} / Youth ${c.youth} / sin categoría ${c.none}), transfer-pts (equipo ${tp.teamPtsUpdated} / comp ${tp.competitionPtsUpdated}), derivados FMI ${summary.fmiDerivatives.updated}`,
            summary,
          })

          console.log('✅ Post-import recalculation completed:', {
            ...summary,
            triggeredBy: userId,
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error('❌ Error in recalculation:', error)
          sendSSE(controller, {
            type: 'error',
            message: `❌ Error en el recálculo: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('❌ Error in recalculation setup:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor durante el recálculo.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
