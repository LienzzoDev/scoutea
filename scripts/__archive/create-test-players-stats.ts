import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const testPlayers = [
  { wyscout_id: '509175', name: 'Test Player 1 - Delantero', position: 'ST', nationality: 'España' },
  { wyscout_id: '60883', name: 'Test Player 2 - Centrocampista', position: 'CM', nationality: 'Brasil' },
  { wyscout_id: '423623', name: 'Test Player 3 - Defensa', position: 'CB', nationality: 'Francia' },
  { wyscout_id: '393793', name: 'Test Player 4 - Lateral', position: 'RB', nationality: 'Argentina' },
  { wyscout_id: '95877', name: 'Test Player 5 - Portero', position: 'GK', nationality: 'Italia' },
  { wyscout_id: '335229', name: 'Test Player 6 - Extremo', position: 'RW', nationality: 'Portugal' },
  { wyscout_id: '-209416', name: 'Test Player 7 - Mediapunta', position: 'AM', nationality: 'Alemania' },
  { wyscout_id: '-357451', name: 'Test Player 8 - Pivote', position: 'DM', nationality: 'Inglaterra' },
  { wyscout_id: '439042', name: 'Test Player 9 - Lateral Izquierdo', position: 'LB', nationality: 'Holanda' },
  { wyscout_id: '-355416', name: 'Test Player 10 - Delantero Centro', position: 'CF', nationality: 'Bélgica' }
]

async function main() {
  console.log('🔄 Creando jugadores de prueba para importación de estadísticas...')

  for (const player of testPlayers) {
    try {
      // Verificar si ya existe
      const existing = await prisma.jugador.findFirst({
        where: {
          OR: [
            { wyscout_id_1: player.wyscout_id },
            { wyscout_id_2: player.wyscout_id }
          ]
        }
      })

      if (existing) {
        console.log(`⏭️  Jugador con Wyscout ID ${player.wyscout_id} ya existe: ${existing.player_name}`)
        continue
      }

      // Crear jugador
      const created = await prisma.jugador.create({
        data: {
          id_player: `test_stats_${player.wyscout_id.replace('-', 'neg')}`,
          player_name: player.name,
          wyscout_id_1: player.wyscout_id,
          date_of_birth: new Date('1998-01-15'),
          age: 26,
          height: 180,
          nationality_1: player.nationality,
          position_player: player.position,
          team_name: 'Test FC',
          team_country: 'España',
          team_competition: 'Test League',
          foot: 'Right',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      console.log(`✅ Creado: ${created.player_name} (Wyscout ID: ${player.wyscout_id})`)
    } catch (error) {
      console.error(`❌ Error creando jugador ${player.wyscout_id}:`, error)
    }
  }

  console.log('\n✅ Proceso completado!')
  console.log('📊 Ahora puedes probar la importación de estadísticas XLS con estos Wyscout IDs')
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
