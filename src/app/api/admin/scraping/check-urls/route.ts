import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

/**
 * POST /api/admin/scraping/check-urls
 * Verifica URLs de Instagram y Transfermarkt para detectar enlaces rotos.
 * Procesa en batches para no sobrecargar.
 *
 * Body: { type: 'instagram' | 'transfermarkt' | 'all', batchSize?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const type = body.type || 'all'
    const batchSize = Math.min(body.batchSize || 50, 100)

    const results = {
      instagram: { checked: 0, broken: 0, fixed: 0, errors: [] as string[] },
      transfermarkt: { checked: 0, broken: 0, fixed: 0, errors: [] as string[] },
    }

    // Check Instagram URLs
    if (type === 'instagram' || type === 'all') {
      const players = await prisma.jugador.findMany({
        where: {
          url_instagram: { not: null, not: '' },
        },
        select: {
          id_player: true,
          player_name: true,
          url_instagram: true,
          url_instagram_broken: true,
        },
        take: batchSize,
        orderBy: { updatedAt: 'asc' }, // Process oldest first
      })

      for (const player of players) {
        try {
          const isBroken = await checkUrlBroken(player.url_instagram!)
          results.instagram.checked++

          if (isBroken && !player.url_instagram_broken) {
            await prisma.jugador.update({
              where: { id_player: player.id_player },
              data: { url_instagram_broken: true },
            })
            results.instagram.broken++
          } else if (!isBroken && player.url_instagram_broken) {
            // URL was broken but now works again
            await prisma.jugador.update({
              where: { id_player: player.id_player },
              data: { url_instagram_broken: false },
            })
            results.instagram.fixed++
          }
        } catch (error) {
          results.instagram.errors.push(
            `${player.player_name} (${player.id_player}): ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }

        // Rate limiting: wait between requests
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
    }

    // Check Transfermarkt URLs
    if (type === 'transfermarkt' || type === 'all') {
      const players = await prisma.jugador.findMany({
        where: {
          url_trfm: { not: null, not: '' },
        },
        select: {
          id_player: true,
          player_name: true,
          url_trfm: true,
          url_trfm_broken: true,
        },
        take: batchSize,
        orderBy: { updatedAt: 'asc' },
      })

      for (const player of players) {
        try {
          const isBroken = await checkUrlBroken(player.url_trfm!)
          results.transfermarkt.checked++

          if (isBroken && !player.url_trfm_broken) {
            await prisma.jugador.update({
              where: { id_player: player.id_player },
              data: { url_trfm_broken: true },
            })
            results.transfermarkt.broken++
          } else if (!isBroken && player.url_trfm_broken) {
            await prisma.jugador.update({
              where: { id_player: player.id_player },
              data: { url_trfm_broken: false },
            })
            results.transfermarkt.fixed++
          }
        } catch (error) {
          results.transfermarkt.errors.push(
            `${player.player_name} (${player.id_player}): ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }

        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalChecked: results.instagram.checked + results.transfermarkt.checked,
        totalBroken: results.instagram.broken + results.transfermarkt.broken,
        totalFixed: results.instagram.fixed + results.transfermarkt.fixed,
        totalErrors: results.instagram.errors.length + results.transfermarkt.errors.length,
      },
    })
  } catch (error) {
    console.error('Error checking URLs:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

/**
 * Check if a URL is broken by making a HEAD request (fallback to GET).
 * For Instagram: checks for "login" redirect or non-200 status.
 * Returns true if broken.
 */
async function checkUrlBroken(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    clearTimeout(timeout)

    // 404, 410 = definitely broken
    if (response.status === 404 || response.status === 410) {
      return true
    }

    // Instagram redirects to login page for non-existent profiles
    const finalUrl = response.url
    if (finalUrl.includes('/accounts/login') || finalUrl.includes('/challenge/')) {
      return true
    }

    // Any non-2xx status (except redirects which are followed)
    if (!response.ok && response.status !== 429) {
      return true
    }

    return false
  } catch (error) {
    // Network error or timeout = treat as potentially broken
    if (error instanceof Error && error.name === 'AbortError') {
      return true // Timeout
    }
    // Other network errors - don't mark as broken, could be temporary
    return false
  }
}
