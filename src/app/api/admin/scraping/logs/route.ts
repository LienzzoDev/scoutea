/**
 * 📡 ENDPOINT DE LOGS EN TIEMPO REAL (Server-Sent Events)
 *
 * ✅ PROPÓSITO: Transmitir logs de scraping en tiempo real al cliente
 * ✅ BENEFICIO: Permite ver el progreso detallado del scraping mientras ocurre
 * ✅ RUTA: GET /api/admin/scraping/logs?jobId=xxx
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

import { prisma } from '@/lib/db'
import { getLogsStore, initializeJobLogs, updateLastAccessed, clearJobLogs } from '@/lib/scraping/logs'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutos máximo

/**
 * GET /api/admin/scraping/logs - Stream de logs en tiempo real
 */
export async function GET(request: NextRequest) {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return new Response('Forbidden', { status: 403 })
    }

    // Obtener jobId o testId de los query params
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')
    const testId = searchParams.get('testId')

    const logId = jobId || testId

    if (!logId) {
      return new Response('Missing jobId or testId parameter', { status: 400 })
    }

    // Si es un jobId real, verificar que el job existe
    if (jobId) {
      const job = await prisma.scrapingJob.findUnique({
        where: { id: jobId }
      })

      if (!job) {
        return new Response('Job not found', { status: 404 })
      }
    }

    // Inicializar el store si no existe
    const entry = initializeJobLogs(logId)
    updateLastAccessed(logId)

    // Crear un stream de Server-Sent Events
    const encoder = new TextEncoder()
    let lastLogIndex = 0

    const stream = new ReadableStream({
      async start(controller) {
        // Enviar logs existentes
        const existingLogs = entry.logs
        for (const log of existingLogs) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log })}\n\n`))
        }
        lastLogIndex = existingLogs.length

        // Polling para nuevos logs cada 500ms
        const intervalId = setInterval(async () => {
          try {
            const logsStore = getLogsStore()
            const currentEntry = logsStore.get(logId)
            if (!currentEntry) {
              // El entry fue eliminado (probablemente por TTL), cerrar stream
              clearInterval(intervalId)
              controller.close()
              return
            }

            // Actualizar lastAccessedAt en cada poll
            updateLastAccessed(logId)

            const currentLogs = currentEntry.logs

            // Enviar solo nuevos logs
            if (currentLogs.length > lastLogIndex) {
              const newLogs = currentLogs.slice(lastLogIndex)
              for (const log of newLogs) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log })}\n\n`))
              }
              lastLogIndex = currentLogs.length
            }

            // Verificar si el job terminó (solo para jobs reales, no tests)
            if (jobId) {
              const updatedJob = await prisma.scrapingJob.findUnique({
                where: { id: jobId },
                select: { status: true }
              })

              if (updatedJob && (updatedJob.status === 'completed' || updatedJob.status === 'failed' || updatedJob.status === 'cancelled')) {
                clearInterval(intervalId)
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
                controller.close()

                // Limpiar logs después de 30 segundos
                setTimeout(() => clearJobLogs(logId), 30000)
              }
            }
            // Para tests, el endpoint de test enviará manualmente la señal de "done"
          } catch (error) {
            console.error('Error in SSE stream:', error)
            clearInterval(intervalId)
            controller.close()
          }
        }, 500)

        // Cleanup si el cliente cierra la conexión
        request.signal.addEventListener('abort', () => {
          clearInterval(intervalId)
          controller.close()
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error) {
    console.error('Error in logs endpoint:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
