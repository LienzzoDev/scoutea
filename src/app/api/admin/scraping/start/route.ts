/**
 * 🚀 ENDPOINT PARA INICIAR UN NUEVO JOB DE SCRAPING
 *
 * ✅ PROPÓSITO: Crear un nuevo trabajo de scraping en segundo plano
 * ✅ BENEFICIO: Permite procesar miles de jugadores sin timeouts
 * ✅ RUTA: POST /api/admin/scraping/start
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

/**
 * POST /api/admin/scraping/start - Iniciar nuevo job de scraping
 */
export async function POST() {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
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
        { error: 'Acceso denegado. Solo los administradores pueden ejecutar scraping.' },
        { status: 403 }
      )
    }

    // 🔍 VERIFICAR SI YA HAY UN JOB CORRIENDO
    const existingJob = await prisma.scrapingJob.findFirst({
      where: {
        status: {
          in: ['pending', 'running']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (existingJob) {
      return NextResponse.json(
        {
          error: 'Ya existe un trabajo de scraping en curso. Por favor, espera a que termine o detenlo primero.',
          jobId: existingJob.id
        },
        { status: 409 }
      )
    }

    // 📊 CONTAR JUGADORES CON URL DE TRANSFERMARKT
    const totalPlayers = await prisma.jugador.count({
      where: {
        url_trfm: {
          not: null,
          not: ''
        }
      }
    })

    if (totalPlayers === 0) {
      return NextResponse.json({
        success: false,
        message: 'No hay jugadores con URL de Transfermarkt para procesar'
      }, { status: 200 })
    }

    // 💾 CREAR NUEVO JOB (configuración conservadora anti-DDoS)
    const job = await prisma.scrapingJob.create({
      data: {
        status: 'pending',
        totalPlayers,
        processedCount: 0,
        successCount: 0,
        errorCount: 0,
        currentBatch: 0,
        batchSize: 5, // 5 jugadores por batch (conservador para evitar rate limits)
        rateLimitCount: 0,
        retryCount: 0,
        slowModeActive: false,
        speedMultiplier: 1.0,
        startedAt: new Date(),
        createdBy: userId
      }
    })

    console.log(`✅ Job de scraping creado: ${job.id} (${totalPlayers} jugadores)`)

    return NextResponse.json({
      success: true,
      message: `Job de scraping creado exitosamente`,
      job: {
        id: job.id,
        status: job.status,
        totalPlayers: job.totalPlayers,
        batchSize: job.batchSize
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating scraping job:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al crear el job.' },
      { status: 500 }
    )
  }
}
