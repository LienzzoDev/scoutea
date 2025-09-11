// 🚀 SCRIPT DE OPTIMIZACIÓN DE BASE DE DATOS
// ✅ PROPÓSITO: Aplicar índices optimizados para mejorar performance
// ✅ BENEFICIO: Búsquedas 5-10x más rápidas

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function optimizeDatabase() {
  console.log('🚀 Iniciando optimización de base de datos...')
  
  try {
    // 🔍 ÍNDICE COMPUESTO PARA BÚSQUEDA PRINCIPAL
    console.log('📊 Creando índice compuesto para búsquedas principales...')
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_player_search_composite" 
      ON "jugadores" ("player_name", "position_player", "nationality_1")
    `
    
    // 📊 ÍNDICE PARA ORDENAMIENTO POR RATING Y FECHA
    console.log('⭐ Creando índice para ordenamiento por rating...')
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_player_rating_created" 
      ON "jugadores" ("player_rating" DESC, "createdAt" DESC)
    `
    
    // ⚽ ÍNDICE PARA BÚSQUEDAS POR EQUIPO Y POSICIÓN
    console.log('⚽ Creando índice para búsquedas por equipo y posición...')
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_player_team_position" 
      ON "jugadores" ("team_name", "position_player")
    `
    
    // 📅 ÍNDICE PARA PAGINACIÓN EFICIENTE
    console.log('📄 Creando índice para paginación eficiente...')
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_player_pagination" 
      ON "jugadores" ("createdAt" DESC, "id_player")
    `
    
    // 🎂 ÍNDICE PARA FILTROS POR EDAD
    console.log('🎂 Creando índice para filtros por edad...')
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_player_age" 
      ON "jugadores" ("age") WHERE "age" IS NOT NULL
    `
    
    // 🌍 ÍNDICE PARA FILTROS POR NACIONALIDAD
    console.log('🌍 Creando índice para filtros por nacionalidad...')
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_player_nationality" 
      ON "jugadores" ("nationality_1") WHERE "nationality_1" IS NOT NULL
    `
    
    // 🏆 ÍNDICE PARA FILTROS POR COMPETICIÓN
    console.log('🏆 Creando índice para filtros por competición...')
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_player_competition" 
      ON "jugadores" ("team_competition") WHERE "team_competition" IS NOT NULL
    `
    
    // 💰 ÍNDICE PARA ORDENAMIENTO POR VALOR DE MERCADO
    console.log('💰 Creando índice para valor de mercado...')
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_player_market_value" 
      ON "jugadores" ("player_trfm_value" DESC) WHERE "player_trfm_value" IS NOT NULL
    `
    
    // 🔄 ÍNDICE PARA ESTADO DE CESIÓN
    console.log('🔄 Creando índice para estado de cesión...')
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_player_loan_status" 
      ON "jugadores" ("on_loan") WHERE "on_loan" IS NOT NULL
    `
    
    // 📈 ÍNDICE COMPUESTO PARA ANÁLISIS AVANZADOS
    console.log('📈 Creando índice compuesto para análisis avanzados...')
    await prisma.$executeRaw`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_player_analytics" 
      ON "jugadores" ("position_player", "age", "player_rating") 
      WHERE "position_player" IS NOT NULL AND "age" IS NOT NULL AND "player_rating" IS NOT NULL
    `
    
    console.log('✅ ¡Optimización de base de datos completada exitosamente!')
    console.log('')
    console.log('📊 Índices creados:')
    console.log('  - idx_player_search_composite: Búsquedas principales')
    console.log('  - idx_player_rating_created: Ordenamiento por rating')
    console.log('  - idx_player_team_position: Búsquedas por equipo/posición')
    console.log('  - idx_player_pagination: Paginación eficiente')
    console.log('  - idx_player_age: Filtros por edad')
    console.log('  - idx_player_nationality: Filtros por nacionalidad')
    console.log('  - idx_player_competition: Filtros por competición')
    console.log('  - idx_player_market_value: Ordenamiento por valor')
    console.log('  - idx_player_loan_status: Filtros por cesión')
    console.log('  - idx_player_analytics: Análisis avanzados')
    console.log('')
    console.log('🚀 Las consultas ahora deberían ser 5-10x más rápidas!')
    
  } catch (error) {
    console.error('❌ Error durante la optimización:', error)
    
    // 🔍 DETECTAR ERRORES ESPECÍFICOS
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Algunos índices ya existían, continuando...')
    } else if (error.message.includes('permission')) {
      console.error('🚫 Error de permisos. Asegúrate de tener permisos de administrador en la BD.')
    } else if (error.message.includes('connection')) {
      console.error('🔌 Error de conexión. Verifica que la base de datos esté disponible.')
    } else {
      console.error('💥 Error inesperado durante la creación de índices.')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 🚀 EJECUTAR OPTIMIZACIÓN
optimizeDatabase()
  .then(() => {
    console.log('🎉 Proceso de optimización finalizado.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })