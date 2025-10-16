import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 Checking jugadores table...')
    
    // Count records in jugadores table
    const jugadoresCountResult = await prisma.$queryRaw`SELECT COUNT(*)::text as count FROM jugadores` as any[]
    const jugadoresCount = jugadoresCountResult[0]?.count
    console.log('⚽ Jugadores count:', jugadoresCount)
    
    // Get table structure first
    const tableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'jugadores' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    ` as any[]
    console.log('🏗️ Table structure:', tableStructure)
    
    // Get sample records using actual column names
    const sampleJugadores = await prisma.$queryRaw`
      SELECT * 
      FROM jugadores 
      LIMIT 5
    ` as any[]
    console.log('📋 Sample jugadores:', sampleJugadores)
    

    
    return NextResponse.json({
      success: true,
      jugadoresCount,
      sampleJugadores,
      tableStructure,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error checking jugadores table:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error checking jugadores table',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}