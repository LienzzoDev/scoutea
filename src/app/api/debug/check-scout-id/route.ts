import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el scout actual
    const currentScout = await prisma.scout.findUnique({
      where: { clerkId: userId },
      select: {
        id_scout: true,
        scout_name: true,
        clerkId: true,
        email: true,
      },
    })

    if (!currentScout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    // Obtener TODOS los reportes (sin filtrar por scout)
    const allReports = await prisma.reporte.findMany({
      select: {
        id_report: true,
        scout_id: true,
        id_player: true,
        report_date: true,
        report_author: true,
      },
      include: {
        player: {
          select: {
            player_name: true,
          },
        },
      },
      orderBy: {
        report_date: 'desc',
      },
      take: 50, // Limitar a 50 para no sobrecargar
    })

    // Obtener reportes del scout actual
    const myReports = await prisma.reporte.findMany({
      where: {
        scout_id: currentScout.id_scout,
      },
      select: {
        id_report: true,
        scout_id: true,
        id_player: true,
        report_date: true,
        report_author: true,
      },
      include: {
        player: {
          select: {
            player_name: true,
          },
        },
      },
      orderBy: {
        report_date: 'desc',
      },
    })

    // Obtener todos los scouts
    const allScouts = await prisma.scout.findMany({
      select: {
        id_scout: true,
        scout_name: true,
        email: true,
        clerkId: true,
      },
    })

    // Agrupar reportes por scout_id
    const reportsByScout = allReports.reduce((acc, report) => {
      const scoutId = report.scout_id || 'null'
      if (!acc[scoutId]) {
        acc[scoutId] = []
      }
      acc[scoutId].push(report)
      return acc
    }, {} as Record<string, typeof allReports>)

    return NextResponse.json({
      success: true,
      currentScout: {
        id: currentScout.id_scout,
        name: currentScout.scout_name,
        email: currentScout.email,
        clerkId: currentScout.clerkId,
      },
      myReports: {
        count: myReports.length,
        reports: myReports.map(r => ({
          id: r.id_report,
          scoutId: r.scout_id,
          playerId: r.id_player,
          playerName: r.player?.player_name || 'Unknown',
          author: r.report_author,
          date: r.report_date,
        })),
      },
      allScouts: allScouts.map(s => ({
        id: s.id_scout,
        name: s.scout_name,
        email: s.email,
        clerkId: s.clerkId,
      })),
      reportsByScout: Object.entries(reportsByScout).map(([scoutId, reports]) => ({
        scoutId,
        count: reports.length,
        scoutInfo: allScouts.find(s => s.id_scout === scoutId),
        sampleReports: reports.slice(0, 3).map(r => ({
          id: r.id_report,
          playerName: r.player?.player_name || 'Unknown',
          author: r.report_author,
        })),
      })),
    })
  } catch (error) {
    console.error('Error in check-scout-id endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
