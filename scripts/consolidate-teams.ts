/**
 * Script para consolidar las tablas teams y equipos
 *
 * Este script:
 * 1. Desvincula jugadores de la tabla teams (pone team_id en null)
 * 2. Agrega las nuevas columnas a la tabla equipos
 * 3. Elimina la tabla teams
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Iniciando consolidación de tablas teams y equipos...')

  try {
    // 1. Contar jugadores vinculados a teams
    const playersWithTeams = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM jugadores WHERE team_id IS NOT NULL
    `
    console.log(`📊 Jugadores con team_id: ${playersWithTeams[0].count}`)

    // 2. Desvincular jugadores de teams (poner team_id en null)
    console.log('🔄 Desvinculando jugadores de la tabla teams...')
    const result = await prisma.$executeRaw`
      UPDATE jugadores SET team_id = NULL WHERE team_id IS NOT NULL
    `
    console.log(`✅ ${result} jugadores desvinculados`)

    // 3. Agregar las nuevas columnas a la tabla equipos si no existen
    console.log('🔨 Agregando nuevas columnas a la tabla equipos...')

    await prisma.$executeRaw`
      ALTER TABLE equipos
      ADD COLUMN IF NOT EXISTS short_name TEXT,
      ADD COLUMN IF NOT EXISTS founded_year INTEGER,
      ADD COLUMN IF NOT EXISTS stadium TEXT,
      ADD COLUMN IF NOT EXISTS website_url TEXT,
      ADD COLUMN IF NOT EXISTS logo_url TEXT
    `
    console.log('✅ Columnas agregadas')

    // 4. Eliminar la tabla teams
    console.log('🗑️  Eliminando tabla teams...')
    await prisma.$executeRaw`DROP TABLE IF EXISTS teams CASCADE`
    console.log('✅ Tabla teams eliminada')

    console.log('🎉 Consolidación completada exitosamente!')
    console.log('')
    console.log('⚠️  IMPORTANTE: Ahora ejecuta:')
    console.log('   npx prisma db push')
    console.log('   para sincronizar el schema de Prisma')

  } catch (error) {
    console.error('❌ Error durante la consolidación:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
