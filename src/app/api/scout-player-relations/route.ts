import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scoutId = searchParams.get('scoutId')
    const playerId = searchParams.get('playerId')
    const action = searchParams.get('action') || 'history'

    switch (action) {
      case 'scout-reports':
        if (!scoutId) {
          return NextResponse.json({ error: 'scoutId is required' }, { status: 400 })
        }
        const scoutReports = await prisma.reporte.findMany({
          where: { scout_id: scoutId },
          include: {
            player: true,
            scout: true
          },
          orderBy: {
            report_date: 'desc'
          }
        })
        return NextResponse.json(scoutReports)

      case 'player-reports':
        if (!playerId) {
          return NextResponse.json({ error: 'playerId is required' }, { status: 400 })
        }
        const playerReports = await prisma.reporte.findMany({
          where: { id_player: playerId },
          include: {
            player: true,
            scout: true
          },
          orderBy: {
            report_date: 'desc'
          }
        })
        return NextResponse.json(playerReports)

      case 'scout-stats':
        if (!scoutId) {
          return NextResponse.json({ error: 'scoutId is required' }, { status: 400 })
        }
        const [totalReports, totalPlayers] = await Promise.all([
          prisma.reporte.count({
            where: { scout_id: scoutId }
          }),
          prisma.player.count({
            where: {
              reporte: {
                some: {
                  scout_id: scoutId
                }
              }
            }
          })
        ])
        return NextResponse.json({
          totalReports,
          totalPlayers
        })

      case 'history':
      default:
        const whereClause: any = {}
        if (scoutId) whereClause.scout_id = scoutId
        if (playerId) whereClause.id_player = playerId

        const history = await prisma.reporte.findMany({
          where: whereClause,
          include: {
            player: true,
            scout: true
          },
          orderBy: {
            report_date: 'desc'
          }
        })
        return NextResponse.json(history)
    }
  } catch (error) {
    console.error('Error in scout-player-relations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scoutId, playerId, reportId, action } = body

    switch (action) {
      case 'create-relation':
        if (!scoutId || !playerId || !reportId) {
          return NextResponse.json(
            { error: 'scoutId, playerId, and reportId are required' },
            { status: 400 }
          )
        }
        // The relation is already established through the reporte table
        // Just verify the report exists
        const report = await prisma.reporte.findUnique({
          where: { id_report: reportId },
          include: {
            player: true,
            scout: true
          }
        })

        if (!report) {
          return NextResponse.json(
            { error: 'Report not found' },
            { status: 404 }
          )
        }

        return NextResponse.json(report, { status: 201 })

      case 'migrate-existing':
        // Migration is not needed as relations are already in the reporte table
        const reportCount = await prisma.reporte.count()
        return NextResponse.json({
          success: true,
          message: 'No migration needed - relations exist in reporte table',
          totalReports: reportCount
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in scout-player-relations POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}