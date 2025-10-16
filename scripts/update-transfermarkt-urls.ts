/**
 * 🔗 Script para actualizar URLs de Transfermarkt de jugadores específicos
 *
 * Este script actualiza el campo url_trfm de jugadores existentes en la BD
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapeo de jugadores con sus URLs de Transfermarkt
const playerUrls = [
  {
    name: 'Alejandro Martínez',
    alternativeNames: ['Alex Martínez', 'Alejandro Martínez Sánchez'],
    team: 'Real Betis',
    position: 'LB',
    url: 'https://www.transfermarkt.es/alex-martinez/profil/spieler/186891',
    note: 'Lateral Izquierdo en Real Betis'
  },
  {
    name: 'Antoine Dubois',
    alternativeNames: ['Léo Dubois', 'Leo Dubois'],
    team: 'Olympique Lyon',
    position: 'RB',
    url: 'https://www.transfermarkt.es/leo-dubois/profil/spieler/236400',
    note: 'Perfil similar, Léo Dubois del Lyon'
  },
  {
    name: 'Diego Hernández',
    alternativeNames: ['Diego Hernandez'],
    team: 'Club América',
    position: 'LW',
    url: 'https://www.transfermarkt.es/diego-hernandez/profil/spieler/370859',
    note: 'Extremo Izquierdo mexicano'
  },
  {
    name: 'Eduardo Camavinga',
    alternativeNames: ['Camavinga', 'E. Camavinga'],
    team: 'Real Madrid',
    position: 'CM',
    url: 'https://www.transfermarkt.es/eduardo-camavinga/profil/spieler/640428',
    note: 'Coincidencia exacta'
  },
  {
    name: 'Gavi',
    alternativeNames: ['Pablo Gavi', 'P. Gavi'],
    team: 'FC Barcelona',
    position: 'CM',
    url: 'https://www.transfermarkt.es/gavi/profil/spieler/646740',
    note: 'Coincidencia exacta'
  },
  {
    name: 'Jamal Musiala',
    alternativeNames: ['J. Musiala', 'Musiala'],
    team: 'Bayern Munich',
    position: 'AM',
    url: 'https://www.transfermarkt.es/jamal-musiala/profil/spieler/580195',
    note: 'Coincidencia exacta'
  },
  {
    name: 'João Pedro',
    alternativeNames: ['Joao Pedro', 'J. Pedro'],
    team: null, // No especificado, solo posición LW
    position: 'LW',
    url: 'https://www.transfermarkt.es/joao-pedro/profil/spieler/1264076',
    note: 'Extremo Izquierdo brasileño, 17 años'
  }
]

async function updatePlayerUrls() {
  console.log('🔗 Iniciando actualización de URLs de Transfermarkt...\n')

  let updated = 0
  let notFound = 0
  let errors = 0

  for (const playerData of playerUrls) {
    try {
      console.log(`\n📋 Buscando: ${playerData.name}`)
      console.log(`   Alternativas: ${playerData.alternativeNames.join(', ')}`)
      console.log(`   Equipo: ${playerData.team || 'No especificado'}`)
      console.log(`   Posición: ${playerData.position}`)

      // Buscar jugador por nombre o nombres alternativos
      const searchNames = [playerData.name, ...playerData.alternativeNames]

      let player = null
      for (const searchName of searchNames) {
        player = await prisma.jugador.findFirst({
          where: {
            OR: [
              { player_name: { contains: searchName, mode: 'insensitive' } },
              { complete_player_name: { contains: searchName, mode: 'insensitive' } },
              { wyscout_name_1: { contains: searchName, mode: 'insensitive' } },
              { wyscout_name_2: { contains: searchName, mode: 'insensitive' } }
            ]
          }
        })

        if (player) {
          console.log(`   ✅ Encontrado: ${player.player_name || player.complete_player_name} (${player.id_player})`)
          break
        }
      }

      if (!player) {
        console.log(`   ❌ No encontrado en BD`)
        notFound++
        continue
      }

      // Actualizar URL de Transfermarkt
      await prisma.jugador.update({
        where: { id_player: player.id_player },
        data: {
          url_trfm: playerData.url
        }
      })

      console.log(`   🔗 URL actualizada: ${playerData.url}`)
      console.log(`   📝 Nota: ${playerData.note}`)
      updated++

    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      errors++
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMEN DE ACTUALIZACIÓN')
  console.log('='.repeat(70))
  console.log(`✅ URLs actualizadas: ${updated}`)
  console.log(`❌ Jugadores no encontrados: ${notFound}`)
  console.log(`⚠️  Errores: ${errors}`)
  console.log(`📊 Total procesados: ${playerUrls.length}`)
  console.log('='.repeat(70) + '\n')

  if (notFound > 0) {
    console.log('💡 SUGERENCIA: Los jugadores no encontrados pueden no existir en la BD.')
    console.log('   Verifica los nombres o créalos manualmente antes de actualizar URLs.\n')
  }
}

// Ejecutar script
updatePlayerUrls()
  .then(() => {
    console.log('✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
