/**
 * Script para crear un jugador de prueba con Wyscout ID
 * Para probar la importación de JSON FMI
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestPlayer() {
  try {
    console.log('🔄 Creando jugador de prueba...')

    // Datos del jugador basados en el JSON proporcionado
    const player = await prisma.jugador.create({
      data: {
        // IDs
        id_player: 'test_player_2000188850',
        player_name: 'Test Player - Jugador Marroquí',

        // Wyscout IDs
        wyscout_id_1: '2000188850',
        wyscout_name_1: 'Test Player',

        // Datos personales del JSON
        date_of_birth: new Date('2003-07-08'),
        correct_date_of_birth: new Date('2003-07-08'),
        age: 21,
        height: 177,
        correct_height: 177,

        // Nacionalidad
        nationality_1: 'Marruecos',
        correct_nationality_1: 'Marruecos',

        // Posición (basado en las posiciones del JSON - DefenderLeft y WingBackLeft tienen valor 20)
        position_player: 'LB',
        correct_position_player: 'Lateral Izquierdo',

        // Equipo (placeholder)
        team_name: 'Test Team FC',
        correct_team_name: 'Test Team FC',
        team_country: 'España',
        team_level: 'Elite',

        // Competición (placeholder)
        team_competition: 'Test League',
        competition_country: 'España',
        competition_tier: '1',

        // Rating inicial (será actualizado con la importación FMI)
        player_rating: 75.0,

        // Pie (basado en el JSON - LeftFoot: 20, RightFoot: 6)
        foot: 'Izquierda',
        correct_foot: 'Izquierda',

        // URLs placeholder
        url_trfm: 'https://www.transfermarkt.com/test-player',

        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    console.log('✅ Jugador de prueba creado exitosamente:')
    console.log('   ID Player:', player.id_player)
    console.log('   Nombre:', player.player_name)
    console.log('   Wyscout ID:', player.wyscout_id_1)
    console.log('   Fecha nacimiento:', player.date_of_birth)
    console.log('   Posición:', player.position_player)
    console.log('   Nacionalidad:', player.nationality_1)
    console.log('')
    console.log('🎯 Ahora puedes importar el JSON FMI con ID:', player.wyscout_id_1)

  } catch (error) {
    console.error('❌ Error creando jugador de prueba:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script
createTestPlayer()
  .then(() => {
    console.log('✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en script:', error)
    process.exit(1)
  })
