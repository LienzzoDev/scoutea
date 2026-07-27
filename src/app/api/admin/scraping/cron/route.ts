/**
 * ⏰ WATCHDOG DEL SCRAPING (VERCEL CRON)
 *
 * ✅ PROPÓSITO: Vigilar el job de scraping y reanudarlo si la cadena rápida
 *    (process-auto → process → process-auto…) se murió o se estancó.
 * ✅ COMPORTAMIENTO: si la cadena está viva (running + progreso reciente) no hace
 *    nada; si está muerta/estancada (paused/failed o running sin progreso) revive
 *    el job y relanza process-auto. El trabajo real lo hace process-auto/process.
 * ✅ RUTA: GET /api/admin/scraping/cron (Vercel Cron diario)
 */

import { NextResponse } from 'next/server'

import { triggerInternalPost } from '@/lib/auth/api-auth'
import { prisma } from '@/lib/db'

// ⏱️ Configuración: 5 minutos máximo (Vercel límite). El watchdog es instantáneo.
export const maxDuration = 300

/**
 * GET /api/admin/scraping/cron - Watchdog que reanuda la cadena de scraping
 */
export async function GET(request: Request) {

  try {
    // 🔐 VERIFICAR AUTENTICACIÓN DE CRON
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (process.env.NODE_ENV === 'production') {
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        console.error('❌ Unauthorized cron request')
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    console.log('\n⏰ CRON JOB EJECUTÁNDOSE:', new Date().toISOString())

    // 🔍 OBTENER JOB ACTIVO O RECUPERABLE
    // Incluye 'paused'/'failed' para actuar como watchdog: si la cadena rápida
    // (process-auto) murió, este cron la revive.
    const job = await prisma.scrapingJob.findFirst({
      where: {
        status: {
          in: ['pending', 'running', 'paused', 'failed']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!job) {
      console.log('ℹ️ No hay jobs activos. Cron terminando...')
      return NextResponse.json({
        success: true,
        message: 'No hay jobs activos para procesar'
      })
    }

    console.log(`📋 Job encontrado: ${job.id} (status=${job.status})`)

    // ✅ VERIFICAR SI YA SE COMPLETÓ (antes del watchdog)
    if (job.processedCount >= job.totalPlayers) {
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: { status: 'completed', completedAt: new Date() }
      })
      return NextResponse.json({ success: true, completed: true, message: 'Scraping completado' })
    }

    // 🐕 WATCHDOG: si la cadena rápida sigue viva (running + progreso reciente),
    // no hacer nada para no duplicar el procesamiento. Si está muerta/estancada
    // (paused/failed, o running sin progreso), revivirla y relanzar process-auto.
    const STALE_MS = 10 * 60 * 1000
    const stale = job.lastProcessedAt
      ? Date.now() - new Date(job.lastProcessedAt).getTime()
      : Number.POSITIVE_INFINITY
    const chainAlive = job.status === 'running' && stale < STALE_MS

    if (chainAlive) {
      console.log('🐕 [CRON] Cadena activa; watchdog inactivo.')
      return NextResponse.json({
        success: true,
        message: 'Cadena de scraping activa; watchdog inactivo',
        progress: `${job.processedCount}/${job.totalPlayers}`
      })
    }

    console.log(`🐕 [CRON] Cadena muerta/estancada (status=${job.status}, sin progreso ${Number.isFinite(stale) ? Math.round(stale / 60000) + 'min' : 'nunca'}). Revivo y relanzo process-auto.`)
    await prisma.scrapingJob.update({
      where: { id: job.id },
      data: { status: 'running', lastError: null }
    })
    const revivalBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await triggerInternalPost(`${revivalBaseUrl}/api/admin/scraping/process-auto`)

    return NextResponse.json({
      success: true,
      message: 'Watchdog: cadena reanudada vía process-auto',
      from: job.status,
      progress: `${job.processedCount}/${job.totalPlayers}`
    })

  } catch (error) {
    console.error('❌ Error in cron scraping process:', error)

    try {
      const failedJob = await prisma.scrapingJob.findFirst({
        where: {
          status: {
            in: ['pending', 'running']
          }
        }
      })

      if (failedJob) {
        await prisma.scrapingJob.update({
          where: { id: failedJob.id },
          data: {
            status: 'failed',
            lastError: error instanceof Error ? error.message : 'Error desconocido'
          }
        })
      }
    } catch (updateError) {
      console.error('Error updating job status:', updateError)
    }

    return NextResponse.json(
      { error: 'Error interno del servidor durante el scraping.' },
      { status: 500 }
    )
  }
}
