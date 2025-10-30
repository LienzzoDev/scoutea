/**
 * ▶️ ENDPOINT PARA REANUDAR JOB DE SCRAPING
 *
 * ✅ PROPÓSITO: Reanudar un trabajo pausado y reiniciar el auto-procesamiento
 * ✅ BENEFICIO: Continuar el scraping desde donde se dejó
 * ✅ RUTA: POST /api/admin/scraping/resume
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

/**
 * POST /api/admin/scraping/resume - Reanudar el job pausado
 */
export async function POST() {
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
        { error: 'Acceso denegado. Solo los administradores pueden reanudar scraping.' },
        { status: 403 }
      )
    }

    // 🔍 BUSCAR JOB PAUSADO
    const job = await prisma.scrapingJob.findFirst({
      where: {
        status: 'paused'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'No hay ningún trabajo de scraping pausado para reanudar.' },
        { status: 404 }
      )
    }

    // ▶️ MARCAR COMO RUNNING
    const updatedJob = await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        status: 'running'
      }
    })

    console.log(`▶️ Job de scraping reanudado: ${job.id}`)

    return NextResponse.json({
      success: true,
      message: 'Scraping reanudado exitosamente',
      job: {
        id: updatedJob.id,
        status: updatedJob.status,
        processedCount: updatedJob.processedCount,
        totalPlayers: updatedJob.totalPlayers
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error resuming scraping:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al reanudar el scraping.' },
      { status: 500 }
    )
  }
}
