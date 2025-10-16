/**
 * ⏸️ ENDPOINT PARA PAUSAR/CANCELAR JOB DE SCRAPING
 *
 * ✅ PROPÓSITO: Detener temporalmente o cancelar el trabajo
 * ✅ BENEFICIO: Control total sobre el proceso de scraping
 * ✅ RUTA: POST /api/admin/scraping/pause
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

/**
 * POST /api/admin/scraping/pause - Pausar el job activo
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
        { error: 'Acceso denegado. Solo los administradores pueden pausar scraping.' },
        { status: 403 }
      )
    }

    // 🔍 BUSCAR JOB ACTIVO
    const job = await prisma.scrapingJob.findFirst({
      where: {
        status: {
          in: ['pending', 'running']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'No hay ningún trabajo de scraping activo para pausar.' },
        { status: 404 }
      )
    }

    // ⏸️ MARCAR COMO PAUSADO
    const updatedJob = await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        status: 'paused'
      }
    })

    console.log(`⏸️ Job de scraping pausado: ${job.id}`)

    return NextResponse.json({
      success: true,
      message: 'Scraping pausado exitosamente',
      job: {
        id: updatedJob.id,
        status: updatedJob.status,
        processedCount: updatedJob.processedCount,
        totalPlayers: updatedJob.totalPlayers
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error pausing scraping:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al pausar el scraping.' },
      { status: 500 }
    )
  }
}
