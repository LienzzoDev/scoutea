import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Basic connection test:', connectionTest)
    
    // Get database info
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as version
    `
    console.log('📊 Database info:', dbInfo)
    
    // Count tables
    const tableCountResult = await prisma.$queryRaw`
      SELECT COUNT(*)::text as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    ` as any[]
    const tableCount = tableCountResult[0]?.table_count
    console.log('📋 Table count:', tableCount)
    
    // List tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    ` as any[]
    console.log('📋 Tables:', tables)
    
    // Check if jugador table exists and count records
    const jugadorExistsResult = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'jugador'
      ) as exists
    ` as any[]
    const jugadorExists = jugadorExistsResult[0]?.exists
    console.log('⚽ Jugador table exists:', jugadorExists)
    
    let jugadorCount = null
    try {
      const countResult = await prisma.$queryRaw`SELECT COUNT(*)::text as count FROM jugador` as any[]
      jugadorCount = countResult[0]?.count
      console.log('⚽ Jugador count:', jugadorCount)
    } catch (error) {
      console.log('❌ Error counting jugador records:', error)
    }
    
    return NextResponse.json({
      success: true,
      connectionTest,
      dbInfo,
      tableCount,
      tables: tables.map(t => t.table_name),
      jugadorExists,
      jugadorCount,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}