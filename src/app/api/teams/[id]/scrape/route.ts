import { auth } from '@clerk/nextjs/server'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  __request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ __error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener datos del equipo desde la base de datos
    const teamResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/teams/${params.id}`)
    if (!teamResponse.ok) {
      return NextResponse.json({ __error: 'Team not found' }, { status: 404 })
    }
    
    const team = await teamResponse.json()
    
    if (!team.url_trfm_advisor) {
      return NextResponse.json({ __error: 'No Transfermarkt URL available' }, { status: 400 })
    }

    // Realizar scraping
    const scrapedData = await scrapeTeamData(team.url_trfm_advisor)
    
    if (!scrapedData) {
      return NextResponse.json({ __error: 'Failed to scrape team data' }, { status: 500 })
    }

    // Filtrar datos nulos
    const filteredData = Object.fromEntries(
      Object.entries(scrapedData).filter(([_key, value]) => value !== null)
    )

    return NextResponse.json({
      success: true,
      message: 'Datos extraídos correctamente',
      data: filteredData
    })

  } catch (_error) {
    console.error('Error in team scraping:', error)
    return NextResponse.json(
      { __error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function scrapeTeamData(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    const $ = cheerio.load(response.data)

    const teamData = {
      url_trfm_advisor: url,
      team_name: extractTeamName($),
      correct_team_name: extractCorrectTeamName($),
      team_country: extractTeamCountry($),
      competition: extractCompetition($),
      competition_country: extractCompetitionCountry($),
      competition_tier: extractCompetitionTier($),
      competition_confederation: extractCompetitionConfederation($),
      team_trfm_value: extractTeamValue($),
      team_rating: extractTeamRating($),
      team_elo: extractTeamElo($),
      team_level: extractTeamLevel($),
      owner_club: extractOwnerClub($),
      owner_club_country: extractOwnerClubCountry($)
    }

    return teamData
  } catch (_error) {
    console.error('Error scraping team data:', error)
    return null
  }
}

function extractTeamName($: cheerio.CheerioAPI): string | null {
  try {
    const name = $('h1').first().text().trim()
    return name || null
  } catch (_error) {
    console.error('Error extracting team name:', error)
    return null
  }
}

function extractCorrectTeamName($: cheerio.CheerioAPI): string | null {
  try {
    const correctName = $('.data-header__club-name').text().trim()
    return correctName || null
  } catch (_error) {
    console.error('Error extracting correct team name:', error)
    return null
  }
}

function extractTeamCountry($: cheerio.CheerioAPI): string | null {
  try {
    const country = $('.data-header__club-country').text().trim()
    return country || null
  } catch (_error) {
    console.error('Error extracting team country:', error)
    return null
  }
}

function extractCompetition($: cheerio.CheerioAPI): string | null {
  try {
    const competition = $('.data-header__club-competition').text().trim()
    return competition || null
  } catch (_error) {
    console.error('Error extracting competition:', error)
    return null
  }
}

function extractCompetitionCountry($: cheerio.CheerioAPI): string | null {
  try {
    const country = $('.data-header__club-competition-country').text().trim()
    return country || null
  } catch (_error) {
    console.error('Error extracting competition country:', error)
    return null
  }
}

function extractCompetitionTier($: cheerio.CheerioAPI): string | null {
  try {
    const tier = $('.data-header__club-tier').text().trim()
    return tier || null
  } catch (_error) {
    console.error('Error extracting competition tier:', error)
    return null
  }
}

function extractCompetitionConfederation($: cheerio.CheerioAPI): string | null {
  try {
    const confederation = $('.data-header__club-confederation').text().trim()
    return confederation || null
  } catch (_error) {
    console.error('Error extracting competition confederation:', error)
    return null
  }
}

function extractTeamValue($: cheerio.CheerioAPI): number | null {
  try {
    const valueText = $('.data-header__club-value').text().trim()
    if (valueText) {
      const value = parseFloat(valueText.replace(/[^\d.]/g, ''))
      return isNaN(value) ? null : value
    }
    return null
  } catch (_error) {
    console.error('Error extracting team value:', error)
    return null
  }
}

function extractTeamRating($: cheerio.CheerioAPI): number | null {
  try {
    const ratingText = $('.data-header__club-rating').text().trim()
    if (ratingText) {
      const rating = parseFloat(ratingText)
      return isNaN(rating) ? null : rating
    }
    return null
  } catch (_error) {
    console.error('Error extracting team rating:', error)
    return null
  }
}

function extractTeamElo($: cheerio.CheerioAPI): number | null {
  try {
    const eloText = $('.data-header__club-elo').text().trim()
    if (eloText) {
      const elo = parseFloat(eloText)
      return isNaN(elo) ? null : elo
    }
    return null
  } catch (_error) {
    console.error('Error extracting team elo:', error)
    return null
  }
}

function extractTeamLevel($: cheerio.CheerioAPI): string | null {
  try {
    const level = $('.data-header__club-level').text().trim()
    return level || null
  } catch (_error) {
    console.error('Error extracting team level:', error)
    return null
  }
}

function extractOwnerClub($: cheerio.CheerioAPI): string | null {
  try {
    const owner = $('.data-header__club-owner').text().trim()
    return owner || null
  } catch (_error) {
    console.error('Error extracting owner club:', error)
    return null
  }
}

function extractOwnerClubCountry($: cheerio.CheerioAPI): string | null {
  try {
    const ownerCountry = $('.data-header__club-owner-country').text().trim()
    return ownerCountry || null
  } catch (_error) {
    console.error('Error extracting owner club country:', error)
    return null
  }
}
