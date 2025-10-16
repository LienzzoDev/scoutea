/**
 * 📊 ENDPOINT PARA OBTENER ESTADO DEL JOB DE SCRAPING
 *
 * ✅ PROPÓSITO: Consultar el progreso del trabajo actual
 * ✅ BENEFICIO: Mostrar progreso en tiempo real al usuario
 * ✅ RUTA: GET /api/admin/scraping/status
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

/**
 * GET /api/admin/scraping/status - Obtener estado del job activo
 */
export async function GET() {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN
    const userRole = sessionClaims?.public_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden ver el estado.' },
        { status: 403 }
      )
    }

    // 🔍 BUSCAR JOB MÁS RECIENTE
    const job = await prisma.scrapingJob.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!job) {
      return NextResponse.json({
        exists: false,
        message: 'No hay ningún trabajo de scraping registrado'
      }, { status: 200 })
    }

    const progress = job.totalPlayers > 0
      ? Math.round((job.processedCount / job.totalPlayers) * 100)
      : 0

    return NextResponse.json({
      exists: true,
      job: {
        id: job.id,
        status: job.status,
        totalPlayers: job.totalPlayers,
        processedCount: job.processedCount,
        successCount: job.successCount,
        errorCount: job.errorCount,
        currentBatch: job.currentBatch,
        batchSize: job.batchSize,
        progress,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        lastProcessedAt: job.lastProcessedAt,
        lastError: job.lastError,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error getting scraping status:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener el estado.' },
      { status: 500 }
    )
  }
}
