import { prisma } from '../src/lib/db'

async function checkTables() {
  try {
    console.log('🔍 Checking existing tables in database...\n')

    // Query to get all table names
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `

    console.log('📋 Found tables:')
    tables.forEach(t => console.log(`  - ${t.tablename}`))

    console.log(`\n✅ Total: ${tables.length} tables`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()
