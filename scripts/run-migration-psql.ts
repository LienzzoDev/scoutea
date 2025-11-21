import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'

const execAsync = promisify(exec)

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Convert id_player to auto-increment INT...')

    // Get DATABASE_URL from environment
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment variables')
    }

    // Path to SQL file
    const sqlPath = path.join(__dirname, 'migrate-id-player-to-int.sql')

    console.log('📄 Executing SQL migration script...')
    console.log(`Using database: ${databaseUrl.split('@')[1]?.split('?')[0] || 'hidden'}`)

    // Execute the SQL file using psql
    const { stdout, stderr } = await execAsync(`psql "${databaseUrl}" -f "${sqlPath}"`)

    if (stdout) {
      console.log('\n📋 Output:')
      console.log(stdout)
    }

    if (stderr) {
      console.log('\n⚠️  Warnings:')
      console.log(stderr)
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('📊 Players now have auto-incrementing integer IDs')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

runMigration()
