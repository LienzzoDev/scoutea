import { prisma } from '../src/lib/db'

async function checkSchema() {
  try {
    console.log('🔍 Verificando esquema de la tabla jugadores...\n')

    // Query para obtener información de las columnas
    const columns = await prisma.$queryRaw<Array<{
      column_name: string
      data_type: string
      is_nullable: string
      column_default: string | null
    }>>`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'jugadores'
      AND table_schema = 'public'
      ORDER BY ordinal_position
      LIMIT 20;
    `

    console.log('📋 Primeras 20 columnas de la tabla "jugadores":\n')
    console.log('┌─────────────────────────────┬──────────────┬──────────┬─────────────────────────┐')
    console.log('│ Columna                     │ Tipo         │ Nullable │ Default                 │')
    console.log('├─────────────────────────────┼──────────────┼──────────┼─────────────────────────┤')

    columns.forEach(col => {
      const colName = col.column_name.padEnd(27)
      const dataType = col.data_type.padEnd(12)
      const nullable = col.is_nullable.padEnd(8)
      const defaultVal = (col.column_default || 'NULL').substring(0, 23).padEnd(23)
      console.log(`│ ${colName} │ ${dataType} │ ${nullable} │ ${defaultVal} │`)
    })

    console.log('└─────────────────────────────┴──────────────┴──────────┴─────────────────────────┘')

    // Verificar específicamente id_player
    const idPlayerCol = columns.find(c => c.column_name === 'id_player')

    if (idPlayerCol) {
      console.log('\n✅ Columna id_player encontrada:')
      console.log(`   Tipo: ${idPlayerCol.data_type}`)
      console.log(`   Nullable: ${idPlayerCol.is_nullable}`)
      console.log(`   Default: ${idPlayerCol.column_default || 'NULL'}`)

      if (idPlayerCol.data_type === 'integer') {
        console.log('\n🎉 ¡La migración fue exitosa! id_player ahora es INTEGER con auto-incremento.')
      } else {
        console.log('\n⚠️  Advertencia: id_player no es de tipo integer')
      }
    } else {
      console.log('\n❌ Columna id_player NO encontrada en la tabla')
    }

    // Mostrar algunos jugadores de ejemplo
    console.log('\n📊 Primeros 5 jugadores con sus IDs:')
    const players = await prisma.$queryRaw<Array<{ id_player: number, player_name: string }>>`
      SELECT id_player, player_name
      FROM jugadores
      ORDER BY id_player
      LIMIT 5
    `

    players.forEach(p => {
      console.log(`   ID ${p.id_player}: ${p.player_name}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchema()
