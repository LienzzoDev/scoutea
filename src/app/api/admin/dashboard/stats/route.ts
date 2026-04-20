import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    
    // Authorization check
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    // Helper for date formatting
    const formatDate = (date: Date | null) => date ? date.toISOString() : null

    // Run queries in parallel
    const [
      // PLAYERS Stats
      totalPlayers,
      lastUpdatedPlayer,
      badUrlPlayers,
      missingUrlPlayers,
      brokenInstagramUrls,

      // TEAMS Stats
      totalTeams,
      lastUpdatedTeam,
      badUrlTeams,
      missingUrlTeams,

      // USERS Evolution (last 12 months)
      usersByMonth,

      // PLAYERS Evolution (last 12 months)
      playersByMonth,

      // JOBS Evolution (last 12 months)
      jobsByMonth
    ] = await Promise.all([
      // Players
      prisma.jugador.count(),
      prisma.jugador.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      prisma.jugador.count({ where: { url_trfm_advisor: { not: null } } }),
      prisma.jugador.count({ where: { OR: [{ url_trfm: null }, { url_trfm: '' }] } }),
      prisma.jugador.count({ where: { url_instagram_broken: true } }),

      // Teams
      prisma.equipo.count(),
      prisma.equipo.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      prisma.equipo.count({ where: { url_trfm_advisor: { not: null } } }),
      prisma.equipo.count({ where: { OR: [{ url_trfm: null }, { url_trfm: '' }] } }),

      // Reports (Aggregation done in memory or strict manual grouping if needed, 
      // but Prisma groupBy is cleaner. We get all counts by month)
      prisma.$queryRaw<{ month: string, count: bigint }[]>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
        FROM usuarios
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `,

      // Players by month
      prisma.$queryRaw<{ month: string, count: bigint }[]>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
        FROM jugadores
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `,

      // Jobs by month
      prisma.$queryRaw<{ month: string, count: bigint }[]>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
        FROM job_offers
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `
    ])

    // Format evolution data for frontend
    const formatEvolution = (data: { month: string, count: bigint }[]) => {
      return data.map(item => ({
        month: item.month, // YYYY-MM
        count: Number(item.count)
      }))
    }

    return NextResponse.json({
      players: {
        total: totalPlayers,
        lastScraping: formatDate(lastUpdatedPlayer?.updatedAt || null),
        erroneousUrls: badUrlPlayers,
        missingTrfmUrls: missingUrlPlayers,
        brokenInstagramUrls: brokenInstagramUrls,
      },
      teams: {
        total: totalTeams,
        lastScraping: formatDate(lastUpdatedTeam?.updatedAt || null),
        erroneousUrls: badUrlTeams,
        missingTrfmUrls: missingUrlTeams
      },
      evolution: {
        users: formatEvolution(usersByMonth),
        players: formatEvolution(playersByMonth),
        jobs: formatEvolution(jobsByMonth),
      }
    })

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
