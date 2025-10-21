import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { generatePlayerId } from '@/lib/utils/id-generator'
import { ScoutPlayerAddSchema } from '@/lib/validation/api-schemas'

const ScoutPlayersQuerySchema = z.object({
  scoutId: z.string().min(1, 'Scout ID requerido')
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Validar parámetros
    let params;
    try {
      params = ScoutPlayersQuerySchema.parse({
        scoutId: searchParams.get('scoutId')
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Parámetros inválidos',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 });
      }
      throw error;
    }

    console.log('🔍 Fetching players for scoutId:', params.scoutId)

    // Get all players created by this scout (including pending ones)
    const players = await prisma.jugador.findMany({
      where: {
        created_by_scout_id: params.scoutId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('✅ Players found:', players.length)
    if (players.length > 0) {
      console.log('📊 Sample player:', {
        id: players[0]?.id_player,
        name: players[0]?.player_name,
        status: players[0]?.approval_status
      })
    }

    return NextResponse.json({
      success: true,
      data: players,
      total: players.length,
    })
  } catch (error) {
    console.error('Error fetching scout players:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Received body:', JSON.stringify(body, null, 2))

    // Validar con Zod
    let validatedData;
    try {
      validatedData = ScoutPlayerAddSchema.parse(body);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2))
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors)
        return NextResponse.json({
          error: 'Datos inválidos',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 });
      }
      throw error;
    }

    // Obtener el scout del usuario actual
    const scout = await prisma.scout.findUnique({
      where: { clerkId: userId },
      select: { id_scout: true }
    })

    if (!scout) {
      return NextResponse.json({ error: 'Scout no encontrado' }, { status: 404 })
    }

    // Verificar si el jugador ya existe en la base de datos
    const existingPlayer = await prisma.jugador.findFirst({
      where: {
        player_name: {
          equals: validatedData.playerName,
          mode: 'insensitive'
        }
      }
    })

    if (existingPlayer) {
      return NextResponse.json({
        error: 'Este jugador ya existe en la base de datos',
        details: 'Por favor, utiliza la función de búsqueda para encontrar al jugador existente.'
      }, { status: 409 })
    }

    // Generar ID secuencial para el jugador
    const playerId = await generatePlayerId();

    // Preparar datos con conversión de tipos
    const heightValue = validatedData.height ? Number(validatedData.height) : null

    // Crear el jugador con estado "pending" (requiere aprobación del admin)
    const player = await prisma.jugador.create({
      data: {
        id_player: playerId,
        player_name: validatedData.playerName,
        date_of_birth: new Date(validatedData.dateOfBirth),
        position_player: validatedData.position || null,
        height: heightValue,
        foot: validatedData.foot || null,
        team_name: validatedData.team,
        team_country: validatedData.teamCountry || null,
        nationality_1: validatedData.nationality1,
        nationality_2: validatedData.nationality2 || null,
        national_tier: validatedData.nationalTier || null,
        agency: validatedData.agency || null,
        url_trfm: validatedData.urlReference,

        // Campos de aprobación
        approval_status: 'pending',
        created_by_scout_id: scout.id_scout,
      }
    })

    console.log('✅ Player created with pending status:', {
      id: player.id_player,
      name: player.player_name,
      scout: scout.id_scout,
      status: player.approval_status
    })

    return NextResponse.json({
      success: true,
      data: {
        player: {
          id_player: player.id_player,
          player_name: player.player_name,
          approval_status: player.approval_status,
          created_by_scout_id: player.created_by_scout_id
        }
      },
      message: 'Jugador creado correctamente. Pendiente de aprobación del administrador.'
    })

  } catch (error) {
    console.error('Error creating player:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}