import { prisma } from '../src/lib/db'
import * as fs from 'fs'
import * as path from 'path'

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Convert id_player to auto-increment INT...')

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'migrate-id-player-to-int.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT')

    console.log(`📄 Executing ${statements.length} SQL statements...`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i]
      if (stmt && stmt.length > 10) {
        console.log(`  [${i + 1}/${statements.length}] ${stmt.substring(0, 60)}...`)
        await prisma.$executeRawUnsafe(stmt)
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('📊 Players now have auto-incrementing integer IDs')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()
