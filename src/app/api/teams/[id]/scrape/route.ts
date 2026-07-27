import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { scrapeTeamData } from '@/lib/scraping/scraper'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Obtener el equipo directamente de la base de datos (antes se hacía un
    // fetch interno a /api/teams/[id] sin cookies de sesión, que fallaba)
    const team = await prisma.equipo.findUnique({
      where: { id_team: id },
      select: {
        id_team: true,
        team_name: true,
        url_trfm_advisor: true
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (!team.url_trfm_advisor) {
      return NextResponse.json({ error: 'No Transfermarkt URL available' }, { status: 400 })
    }

    // Realizar scraping con el parser compartido
    const scrapedData = await scrapeTeamData(team.url_trfm_advisor)

    if (!scrapedData || Object.keys(scrapedData).length === 0) {
      return NextResponse.json({ error: 'Failed to scrape team data' }, { status: 500 })
    }

    // El formulario de edición usa correct_team_name como nombre "oficial"
    const responseData: Record<string, unknown> = {
      url_trfm_advisor: team.url_trfm_advisor,
      ...scrapedData,
      ...(scrapedData.team_name !== undefined && { correct_team_name: scrapedData.team_name })
    }

    const filteredData = Object.fromEntries(
      Object.entries(responseData).filter(([_key, value]) => value !== null && value !== undefined)
    )

    return NextResponse.json({
      success: true,
      message: 'Datos extraídos correctamente',
      data: filteredData
    })

  } catch (error) {
    console.error('Error in team scraping:', error)
    const errorMsg = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
