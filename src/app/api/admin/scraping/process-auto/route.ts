/**
 * 🔄 ENDPOINT DE AUTO-PROCESAMIENTO DE SCRAPING
 *
 * ✅ PROPÓSITO: Procesar batches automáticamente hasta completar todo el job
 * ✅ BENEFICIO: El scraping continúa aunque se cierre la página del frontend
 * ✅ RUTA: POST /api/admin/scraping/process-auto
 */

import { NextResponse } from 'next/server'

import { requireAdminOrInternal, internalApiHeaders } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/db'

// ⏱️ Configuración: 5 minutos máximo (Vercel límite)
export const maxDuration = 300

// Tras respuestas no-OK de /process (5xx transitorios: 504 timeout, blip DB/red)
// se reintenta el batch. Si el job pasa este tiempo SIN ningún progreso pese a los
// reintentos, se pausa (estado recuperable por el watchdog del cron) en lugar de
// marcarlo 'failed' (terminal e irreversible, que mataba todo el barrido).
const STALL_LIMIT_MS = 20 * 60 * 1000 // 20 min

/**
 * POST /api/admin/scraping/process-auto - Procesar batches automáticamente
 *
 * Este endpoint:
 * 1. Llama al endpoint /process para procesar un batch
 * 2. Si el job NO está completado, se auto-llama recursivamente
 * 3. Continúa hasta que el job se complete o se pause/cancele
 */
export async function POST(request: Request) {
  try {
    const authResult = await requireAdminOrInternal(request)
    if (!authResult.ok) {
      return authResult.response
    }
    console.log('🔄 [AUTO-PROCESS] Iniciando auto-procesamiento...')

    // 🔍 VERIFICAR SI HAY UN JOB ACTIVO (incluyendo pausado para verificar estado)
    const job = await prisma.scrapingJob.findFirst({
      where: {
        status: {
          in: ['pending', 'running', 'paused', 'cancelled']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!job) {
      console.log('🔍 [AUTO-PROCESS] No hay job activo, deteniendo auto-procesamiento')
      return NextResponse.json({
        success: true,
        message: 'No hay job activo',
        stopped: true
      })
    }

    // ⏸️ VERIFICAR SI EL JOB FUE PAUSADO O CANCELADO
    if (job.status === 'paused' || job.status === 'cancelled') {
      console.log(`⏸️ [AUTO-PROCESS] Job ${job.status}, deteniendo auto-procesamiento`)
      return NextResponse.json({
        success: true,
        message: `Job ${job.status}`,
        stopped: true
      })
    }

    // ✅ VERIFICAR SI YA SE COMPLETÓ
    if (job.processedCount >= job.totalPlayers) {
      console.log('🎉 [AUTO-PROCESS] Job completado, deteniendo auto-procesamiento')
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })
      return NextResponse.json({
        success: true,
        message: 'Job completado',
        completed: true
      })
    }

    console.log(`📦 [AUTO-PROCESS] Job ${job.id}: ${job.processedCount}/${job.totalPlayers} jugadores procesados`)

    // 🔄 LLAMAR AL ENDPOINT DE PROCESO PARA PROCESAR UN BATCH
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const processUrl = `${baseUrl}/api/admin/scraping/process`

    console.log(`🔄 [AUTO-PROCESS] Llamando a: ${processUrl}`)

    try {
      console.log(`🔄 [AUTO-PROCESS] Haciendo fetch a /process con timeout de 290s...`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 290000) // 290 segundos (un poco menos de maxDuration)

      const processResponse = await fetch(processUrl, {
        method: 'POST',
        headers: internalApiHeaders(),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      console.log(`📡 [AUTO-PROCESS] Respuesta de /process: ${processResponse.status}`)

      if (!processResponse.ok) {
        const errorData = await processResponse.json().catch(() => ({ error: `HTTP ${processResponse.status} (respuesta sin JSON)` }))
        console.error('⚠️ [AUTO-PROCESS] /process respondió no-OK (probable 5xx transitorio):', errorData)

        // ⚠️ NO matar el job por un 5xx transitorio (504 timeout de función, blip de
        // red/DB). Reintentar el mismo batch, salvo que llevemos demasiado tiempo sin
        // progreso: en ese caso pausar (recuperable) en vez de fallar (terminal).
        const fresh = await prisma.scrapingJob.findUnique({
          where: { id: job.id },
          select: { status: true, lastProcessedAt: true }
        })
        if (!fresh || fresh.status !== 'running') {
          return NextResponse.json({ success: true, message: `Job ${fresh?.status ?? 'ausente'}`, stopped: true })
        }
        const stale = fresh.lastProcessedAt
          ? Date.now() - new Date(fresh.lastProcessedAt).getTime()
          : Number.POSITIVE_INFINITY
        if (stale > STALL_LIMIT_MS) {
          await prisma.scrapingJob.update({
            where: { id: job.id },
            data: {
              status: 'paused',
              lastError: `Auto-pausado: sin progreso durante ${Math.round(stale / 60000)} min tras respuestas no-OK de /process (${errorData.error ?? processResponse.status})`
            }
          })
          console.error('🛑 [AUTO-PROCESS] Sin progreso prolongado: job pausado (el cron lo reanudará).')
          return NextResponse.json({ success: false, paused: true, stopped: true })
        }

        // 🔁 Reintentar el batch: esperar y re-encadenar (no bloqueante)
        console.log('🔁 [AUTO-PROCESS] Reintentando batch tras respuesta no-OK...')
        await new Promise(resolve => setTimeout(resolve, 15000))
        fetch(`${baseUrl}/api/admin/scraping/process-auto`, {
          method: 'POST',
          headers: internalApiHeaders(),
        }).catch(err => console.error('❌ [AUTO-PROCESS] Error re-encadenando tras no-OK:', err))
        return NextResponse.json({ success: true, retrying: true })
      }

      const processData = await processResponse.json()

      // ✅ SI EL JOB SE COMPLETÓ, DETENER
      if (processData.completed) {
        console.log('🎉 [AUTO-PROCESS] Job completado tras este batch')
        return NextResponse.json({
          success: true,
          message: 'Job completado',
          completed: true
        })
      }

      // 🔄 SI NO ESTÁ COMPLETADO, CONTINUAR PROCESANDO
      // Hacer una llamada recursiva asíncrona (sin esperar respuesta)
      console.log('🔄 [AUTO-PROCESS] Continuando con siguiente batch...')

      // Pequeña pausa de 2 segundos entre batches
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Auto-llamada recursiva (no bloqueante) autenticada con CRON_SECRET
      fetch(`${baseUrl}/api/admin/scraping/process-auto`, {
        method: 'POST',
        headers: internalApiHeaders(),
      }).catch((err) => {
        // NO matar el job: si la auto-llamada falla, el job queda 'running' y el
        // watchdog (cron) lo reanudará al detectar que lleva rato sin progresar.
        console.error('❌ [AUTO-PROCESS] Error en llamada recursiva (el watchdog reanudará):', err)
      })

      return NextResponse.json({
        success: true,
        message: 'Batch procesado, continuando...',
        continuing: true
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en auto-procesamiento'
      console.error('❌ [AUTO-PROCESS] Error llamando a /process:', error)
      console.error('❌ [AUTO-PROCESS] Error stack:', error instanceof Error ? error.stack : 'N/A')

      // NO marcar 'failed' (terminal e irreversible): pausar es recuperable por el
      // watchdog (cron) y conserva el progreso ya guardado.
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'paused',
          lastError: `Auto-pausado tras error llamando a /process: ${errorMessage}`
        }
      }).catch(() => {})

      return NextResponse.json({
        success: false,
        error: `Error en auto-procesamiento: ${errorMessage}`,
        stopped: true
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [AUTO-PROCESS] Error general:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor en auto-procesamiento' },
      { status: 500 }
    )
  }
}
