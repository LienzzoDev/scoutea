import { prisma } from '../src/lib/db'

async function checkColumns() {
  try {
    console.log('🔍 Checking columns in related tables...\n')

    const tables = [
      'radar_metrics',
      'data_population_log',
      'beeswarm_data',
      'lollipop_data',
      'player_lists',
      'atributos',
      'player_corrections',
      'player_metrics',
      'player_roles',
      'player_attributes'
    ]

    for (const table of tables) {
      console.log(`📋 Table: ${table}`)
      try {
        const columns = await prisma.$queryRaw<Array<{ column_name: string, data_type: string }>>`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = ${table}
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `

        columns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`)
        })
        console.log('')
      } catch (err) {
        console.log(`  ❌ Error checking table: ${err}\n`)
      }
    }

    console.log('✅ Done')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkColumns()
