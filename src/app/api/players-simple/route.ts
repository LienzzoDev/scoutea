import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PlayerService } from '@/lib/services/player-service'
import { PaginatedQuerySchema } from '@/lib/validation/api-schemas'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple players API called...')

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Validate and parse URL parameters
    const { searchParams } = new URL(request.url)

    let params;
    try {
      params = PaginatedQuerySchema.parse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        sortBy: searchParams.get('sortBy'),
        sortOrder: searchParams.get('sortOrder'),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid parameters',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const { page, limit, sortBy, sortOrder } = params;
    
    console.log('📋 Simple API params:', { page, limit, sortBy, sortOrder })
    
    // Call PlayerService
    const result = await PlayerService.searchPlayers({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {} // No filters for now
    })
    
    console.log('✅ Simple API result:', {
      playersCount: result.players.length,
      pagination: result.pagination
    })
    
    return NextResponse.json({
      players: result.players,
      pagination: result.pagination
    })
    
  } catch (error) {
    console.error('❌ Simple players API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}