/**
 * ❌ ENDPOINT PARA CANCELAR JOB DE SCRAPING
 *
 * ✅ PROPÓSITO: Cancelar permanentemente el trabajo activo
 * ✅ BENEFICIO: Permite terminar un job y empezar uno nuevo
 * ✅ RUTA: POST /api/admin/scraping/cancel
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

/**
 * POST /api/admin/scraping/cancel - Cancelar el job activo
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
        { error: 'Acceso denegado. Solo los administradores pueden cancelar scraping.' },
        { status: 403 }
      )
    }

    // 🔍 BUSCAR JOB ACTIVO O PAUSADO
    const job = await prisma.scrapingJob.findFirst({
      where: {
        status: {
          in: ['pending', 'running', 'paused']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'No hay ningún trabajo de scraping activo para cancelar.' },
        { status: 404 }
      )
    }

    // ❌ MARCAR COMO CANCELADO (FAILED)
    const updatedJob = await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        lastError: 'Cancelado por el usuario'
      }
    })

    console.log(`❌ Job de scraping cancelado: ${job.id}`)

    return NextResponse.json({
      success: true,
      message: 'Scraping cancelado exitosamente',
      job: {
        id: updatedJob.id,
        status: updatedJob.status,
        processedCount: updatedJob.processedCount,
        totalPlayers: updatedJob.totalPlayers
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error canceling scraping:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al cancelar el scraping.' },
      { status: 500 }
    )
  }
}
