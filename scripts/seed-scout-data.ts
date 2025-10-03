import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedScoutData() {
  try {
    console.log('🌱 Iniciando población de datos de scouts...')

    // Crear algunos scouts de ejemplo
    const scouts = await Promise.all([
      prisma.scout.create({
        data: {
          scout_name: 'Carlos Rodríguez',
          name: 'Carlos',
          surname: 'Rodríguez',
          email: 'carlos.rodriguez@example.com',
          nationality: 'España',
          country: 'España',
          favourite_club: 'Real Madrid',
          open_to_work: true,
          professional_experience: 'Ex-jugador profesional con 15 años de experiencia en scouting',
          total_reports: 25,
          original_reports: 20,
          roi: 15.5,
          net_profits: 2500000,
          scout_level: 'Senior',
          scout_ranking: 15,
          join_date: new Date('2022-01-15'),
        },
      }),
      prisma.scout.create({
        data: {
          scout_name: 'María González',
          name: 'María',
          surname: 'González',
          email: 'maria.gonzalez@example.com',
          nationality: 'Argentina',
          country: 'Argentina',
          favourite_club: 'Boca Juniors',
          open_to_work: false,
          professional_experience: 'Especialista en talentos juveniles sudamericanos',
          total_reports: 18,
          original_reports: 15,
          roi: 22.3,
          net_profits: 1800000,
          scout_level: 'Expert',
          scout_ranking: 8,
          join_date: new Date('2021-08-20'),
        },
      }),
    ])

    console.log('✅ Scouts creados:', scouts.length)

    // Crear algunos jugadores de ejemplo
    const players = await Promise.all([
      prisma.jugador.create({
        data: {
          player_name: 'Alejandro Martínez',
          age: 19,
          position_player: 'CAM',
          nationality_1: 'España',
          team_name: 'Real Madrid Castilla',
          player_rating: 78.5,
          player_trfm_value: 5000000,
        },
      }),
      prisma.jugador.create({
        data: {
          player_name: 'Lucas Silva',
          age: 21,
          position_player: 'ST',
          nationality_1: 'Brasil',
          team_name: 'Santos FC',
          player_rating: 82.1,
          player_trfm_value: 12000000,
        },
      }),
      prisma.jugador.create({
        data: {
          player_name: 'Diego Fernández',
          age: 18,
          position_player: 'CB',
          nationality_1: 'Argentina',
          team_name: 'River Plate',
          player_rating: 75.8,
          player_trfm_value: 3500000,
        },
      }),
      prisma.jugador.create({
        data: {
          player_name: 'Marco Rossi',
          age: 20,
          position_player: 'CM',
          nationality_1: 'Italia',
          team_name: 'AC Milan Primavera',
          player_rating: 79.2,
          player_trfm_value: 8000000,
        },
      }),
      prisma.jugador.create({
        data: {
          player_name: 'João Pedro',
          age: 17,
          position_player: 'LW',
          nationality_1: 'Brasil',
          team_name: 'Flamengo Sub-20',
          player_rating: 76.9,
          player_trfm_value: 4200000,
        },
      }),
    ])

    console.log('✅ Jugadores creados:', players.length)

    // Crear reportes conectando scouts con jugadores
    const reports = await Promise.all([
      // Reportes del primer scout (Carlos)
      prisma.reporte.create({
        data: {
          scout_id: scouts[0].id_scout,
          id_player: players[0].id_player,
          report_date: new Date('2024-01-15'),
          report_type: 'scouting',
          player_name: players[0].player_name,
          position_player: players[0].position_player,
          nationality_1: players[0].nationality_1,
          team_name: players[0].team_name,
          age: players[0].age,
          initial_player_trfm_value: 3000000,
          player_trfm_value: players[0].player_trfm_value,
          roi: 18.5,
          profit: 2000000,
          potential: 85,
          report_status: 'approved',
        },
      }),
      prisma.reporte.create({
        data: {
          scout_id: scouts[0].id_scout,
          id_player: players[1].id_player,
          report_date: new Date('2024-01-20'),
          report_type: 'analysis',
          player_name: players[1].player_name,
          position_player: players[1].position_player,
          nationality_1: players[1].nationality_1,
          team_name: players[1].team_name,
          age: players[1].age,
          initial_player_trfm_value: 8000000,
          player_trfm_value: players[1].player_trfm_value,
          roi: 12.8,
          profit: 4000000,
          potential: 88,
          report_status: 'approved',
        },
      }),
      prisma.reporte.create({
        data: {
          scout_id: scouts[0].id_scout,
          id_player: players[2].id_player,
          report_date: new Date('2024-02-01'),
          report_type: 'follow-up',
          player_name: players[2].player_name,
          position_player: players[2].position_player,
          nationality_1: players[2].nationality_1,
          team_name: players[2].team_name,
          age: players[2].age,
          initial_player_trfm_value: 2000000,
          player_trfm_value: players[2].player_trfm_value,
          roi: 25.2,
          profit: 1500000,
          potential: 82,
          report_status: 'approved',
        },
      }),
      // Reportes del segundo scout (María)
      prisma.reporte.create({
        data: {
          scout_id: scouts[1].id_scout,
          id_player: players[3].id_player,
          report_date: new Date('2024-01-25'),
          report_type: 'scouting',
          player_name: players[3].player_name,
          position_player: players[3].position_player,
          nationality_1: players[3].nationality_1,
          team_name: players[3].team_name,
          age: players[3].age,
          initial_player_trfm_value: 5000000,
          player_trfm_value: players[3].player_trfm_value,
          roi: 28.5,
          profit: 3000000,
          potential: 90,
          report_status: 'approved',
        },
      }),
      prisma.reporte.create({
        data: {
          scout_id: scouts[1].id_scout,
          id_player: players[4].id_player,
          report_date: new Date('2024-02-05'),
          report_type: 'recommendation',
          player_name: players[4].player_name,
          position_player: players[4].position_player,
          nationality_1: players[4].nationality_1,
          team_name: players[4].team_name,
          age: players[4].age,
          initial_player_trfm_value: 2500000,
          player_trfm_value: players[4].player_trfm_value,
          roi: 32.1,
          profit: 1700000,
          potential: 87,
          report_status: 'approved',
        },
      }),
    ])

    console.log('✅ Reportes creados:', reports.length)

    console.log('\n🎉 Población de datos completada!')
    console.log(`📊 Resumen:`)
    console.log(`   - ${scouts.length} scouts`)
    console.log(`   - ${players.length} jugadores`)
    console.log(`   - ${reports.length} reportes`)
    
    console.log('\n👥 Scouts creados:')
    scouts.forEach((scout, index) => {
      console.log(`   ${index + 1}. ${scout.scout_name} (${scout.email})`)
    })

    return {
      scouts,
      players,
      reports,
    }
  } catch (error) {
    console.error('❌ Error poblando datos:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedScoutData()
    .then(() => {
      console.log('✅ Script completado exitosamente')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error)
      process.exit(1)
    })
}

export { seedScoutData }