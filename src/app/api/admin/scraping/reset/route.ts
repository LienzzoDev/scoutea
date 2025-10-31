/**
 * 🗑️ ENDPOINT PARA RESET/LIMPIEZA DE JOBS DE SCRAPING
 *
 * ✅ PROPÓSITO: Limpiar todos los jobs existentes (completados, fallidos, cancelados)
 * ✅ BENEFICIO: Permite reiniciar desde cero y evita acumulación de jobs antiguos
 * ✅ RUTA: POST /api/admin/scraping/reset
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { clearJobLogs } from '@/app/api/admin/scraping/logs/route'

/**
 * POST /api/admin/scraping/reset - Limpiar todos los jobs
 *
 * Este endpoint:
 * 1. Verifica que no haya jobs activos (running/pending)
 * 2. Marca todos los jobs completados/fallidos como "archived"
 * 3. Limpia los logs de todos los jobs
 * 4. Retorna el número de jobs archivados
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
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden resetear jobs.' },
        { status: 403 }
      )
    }

    // 🔍 VERIFICAR SI HAY JOBS ACTIVOS
    const activeJob = await prisma.scrapingJob.findFirst({
      where: {
        status: {
          in: ['pending', 'running', 'paused']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (activeJob) {
      return NextResponse.json(
        {
          error: 'No se puede resetear. Hay un job activo en curso. Por favor, cancélalo primero.',
          activeJobId: activeJob.id,
          activeJobStatus: activeJob.status
        },
        { status: 409 }
      )
    }

    // 📊 OBTENER TODOS LOS JOBS COMPLETADOS/FALLIDOS/CANCELADOS
    const jobsToArchive = await prisma.scrapingJob.findMany({
      where: {
        status: {
          in: ['completed', 'failed', 'cancelled']
        }
      },
      select: {
        id: true,
        status: true,
        totalPlayers: true,
        processedCount: true,
        successCount: true,
        errorCount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`🗑️ [RESET] Encontrados ${jobsToArchive.length} jobs para archivar`)

    // 🗑️ OPCIÓN 1: ELIMINAR COMPLETAMENTE (más simple)
    // Si prefieres eliminar en lugar de archivar, usa esto:
    const deleteResult = await prisma.scrapingJob.deleteMany({
      where: {
        status: {
          in: ['completed', 'failed', 'cancelled']
        }
      }
    })

    console.log(`✅ [RESET] ${deleteResult.count} jobs eliminados`)

    // 🧹 LIMPIAR LOGS DE TODOS LOS JOBS
    for (const job of jobsToArchive) {
      clearJobLogs(job.id)
    }

    console.log(`🧹 [RESET] Logs limpiados para ${jobsToArchive.length} jobs`)

    return NextResponse.json({
      success: true,
      message: `Reset completado exitosamente`,
      jobsDeleted: deleteResult.count,
      details: {
        completed: jobsToArchive.filter(j => j.status === 'completed').length,
        failed: jobsToArchive.filter(j => j.status === 'failed').length,
        cancelled: jobsToArchive.filter(j => j.status === 'cancelled').length
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error resetting scraping jobs:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al resetear jobs.' },
      { status: 500 }
    )
  }
}
