/**
 * Debug endpoint para investigar problemas con jugadores específicos
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const playerId = params.id;
    
    console.log('🔍 Debug: Searching for player with ID:', playerId);
    
    // Verificar conexión a la base de datos
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      }, { status: 500 });
    }

    // Buscar el jugador directamente
    let player;
    try {
      player = await prisma.jugador.findUnique({
        where: { id_player: playerId }
      });
      console.log('📊 Direct query result:', !!player);
    } catch (queryError) {
      console.error('❌ Query failed:', queryError);
      return NextResponse.json({
        error: 'Query failed',
        details: queryError instanceof Error ? queryError.message : 'Unknown query error'
      }, { status: 500 });
    }

    // Buscar jugadores similares (para verificar si el ID existe con variaciones)
    let similarPlayers;
    try {
      similarPlayers = await prisma.jugador.findMany({
        where: {
          id_player: {
            contains: playerId.substring(0, 10) // Primeros 10 caracteres
          }
        },
        take: 5,
        select: {
          id_player: true,
          player_name: true
        }
      });
      console.log('🔍 Similar players found:', similarPlayers.length);
    } catch (similarError) {
      console.error('❌ Similar search failed:', similarError);
      similarPlayers = [];
    }

    // Verificar el esquema de la tabla
    let tableInfo;
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'jugador' 
        AND column_name = 'id_player'
      `;
      tableInfo = result;
      console.log('📋 Table schema info:', tableInfo);
    } catch (schemaError) {
      console.error('❌ Schema check failed:', schemaError);
      tableInfo = null;
    }

    // Contar total de jugadores
    let totalPlayers;
    try {
      totalPlayers = await prisma.jugador.count();
      console.log('📊 Total players in database:', totalPlayers);
    } catch (countError) {
      console.error('❌ Count failed:', countError);
      totalPlayers = 0;
    }

    return NextResponse.json({
      debug: {
        searchedId: playerId,
        playerFound: !!player,
        playerData: player ? {
          id: player.id_player,
          name: player.player_name,
          position: player.position_player
        } : null,
        similarPlayers,
        tableInfo,
        totalPlayers,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}