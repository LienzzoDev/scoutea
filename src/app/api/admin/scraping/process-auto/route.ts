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
        const errorData = await processResponse.json().catch(() => ({ error: 'No se pudo parsear respuesta' }))
        console.error('❌ [AUTO-PROCESS] Error en /process:', errorData)

        // Si hay error, marcar el job como failed
        await prisma.scrapingJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            lastError: errorData.error || 'Error en auto-procesamiento'
          }
        })

        return NextResponse.json({
          success: false,
          error: 'Error procesando batch',
          stopped: true
        }, { status: 500 })
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
      }).catch(async (err) => {
        console.error('❌ [AUTO-PROCESS] Error en llamada recursiva:', err)
        // Marcar el job como failed
        try {
          await prisma.scrapingJob.update({
            where: { id: job.id },
            data: {
              status: 'failed',
              lastError: `Error en llamada recursiva: ${err.message}`
            }
          })
        } catch (updateError) {
          console.error('❌ [AUTO-PROCESS] Error actualizando job tras error recursivo:', updateError)
        }
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

      // Marcar job como failed
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          lastError: errorMessage
        }
      })

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
