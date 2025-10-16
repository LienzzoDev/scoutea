import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse} from 'next/server'

import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el scout
    const scout = await prisma.scout.findUnique({
      where: { clerkId: userId },
    })

    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    // Obtener todos los reportes del scout con id_player
    const reports = await prisma.reporte.findMany({
      where: {
        scout_id: scout.id_scout,
        id_player: { not: null },
      },
    })

    console.log(`Found ${reports.length} reports for scout ${scout.id_scout}`)

    let created = 0
    let skipped = 0
    let errors = 0

    for (const report of reports) {
      if (!report.id_player) continue

      try {
        // Verificar si ya existe la relación
        const existing = await prisma.scoutPlayerReport.findFirst({
          where: {
            scoutId: scout.id_scout,
            playerId: report.id_player,
            reportId: report.id_report,
          },
        })

        if (existing) {
          skipped++
          continue
        }

        // Crear la relación
        await prisma.scoutPlayerReport.create({
          data: {
            scoutId: scout.id_scout,
            playerId: report.id_player,
            reportId: report.id_report,
          },
        })

        created++
      } catch (error) {
        console.error(`Error creating relation for report ${report.id_report}:`, error)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronización completada',
      stats: {
        totalReports: reports.length,
        created,
        skipped,
        errors,
      },
    })
  } catch (error) {
    console.error('Error in sync endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
