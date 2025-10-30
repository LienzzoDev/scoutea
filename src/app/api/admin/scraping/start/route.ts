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
import { addJobLog } from '@/app/api/admin/scraping/logs/route'

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
    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
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
        AND: [
          { url_trfm: { not: null } },
          { url_trfm: { not: '' } }
        ]
      }
    })

    if (totalPlayers === 0) {
      return NextResponse.json({
        success: false,
        message: 'No hay jugadores con URL de Transfermarkt para procesar'
      }, { status: 200 })
    }

    // 📊 CONTAR EQUIPOS CON URL DE TRANSFERMARKT
    const totalTeams = await prisma.equipo.count({
      where: {
        AND: [
          { url_trfm_advisor: { not: null } },
          { url_trfm_advisor: { not: '' } }
        ]
      }
    })

    // 💾 CREAR JOB DE JUGADORES (configuración optimizada para Vercel)
    const playersJob = await prisma.scrapingJob.create({
      data: {
        status: 'running', // Iniciar directamente en 'running'
        totalPlayers,
        processedCount: 0,
        successCount: 0,
        errorCount: 0,
        currentBatch: 0,
        batchSize: 30, // 30 jugadores para asegurar que cabe en 5 min de Vercel
        rateLimitCount: 0,
        retryCount: 0,
        slowModeActive: false,
        speedMultiplier: 1.0,
        startedAt: new Date(),
        createdBy: userId
      }
    })

    console.log(`✅ Job de scraping de jugadores creado: ${playersJob.id} (${totalPlayers} jugadores)`)

    // 📝 AGREGAR LOGS INICIALES
    addJobLog(playersJob.id, '🚀 Job de scraping creado exitosamente')
    addJobLog(playersJob.id, `📊 Total de jugadores a procesar: ${totalPlayers}`)
    addJobLog(playersJob.id, `📦 Tamaño de batch: ${playersJob.batchSize}`)
    addJobLog(playersJob.id, '')
    addJobLog(playersJob.id, '🔄 Iniciando procesamiento automático en segundo plano...')

    // ℹ️ El procesamiento se manejará desde el frontend mediante polling
    // Esto evita problemas con fetch interno en Next.js
    addJobLog(playersJob.id, '📡 Esperando que el frontend inicie el procesamiento...')
    console.log(`📡 Job creado, esperando inicio de procesamiento desde frontend`)

    // 🚀 INICIAR SCRAPING DE EQUIPOS EN BACKGROUND (si hay equipos)
    if (totalTeams > 0) {
      try {
        console.log(`🚀 Iniciando scraping de ${totalTeams} equipos en background...`)
        // Hacer una llamada asíncrona al endpoint de equipos
        // No esperamos la respuesta para no bloquear
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        fetch(`${baseUrl}/api/admin/scraping/teams/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Pasar info de autorización en header custom
            'x-admin-user-id': userId
          }
        }).catch(err => {
          console.error('⚠️ Error al iniciar scraping de equipos:', err)
        })
      } catch (error) {
        console.error('⚠️ Error al ejecutar scraping de equipos:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Jobs de scraping creados exitosamente`,
      playersJob: {
        id: playersJob.id,
        status: playersJob.status,
        totalPlayers: playersJob.totalPlayers,
        batchSize: playersJob.batchSize
      },
      totalTeams
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating scraping job:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al crear el job.' },
      { status: 500 }
    )
  }
}
