/**
 * Script para actualizar los wyscout_id_1 de los jugadores existentes
 */

import { prisma } from '../src/lib/db'

const newWyscoutIds = [
  60883,
  -283273,
  509175,
  423623,
  95877,
  500177,
  116484,
  517641,
  -51519,
  -130100,
  -130160,
  187228,
  -606118,
  -393798,
  262116,
  335229,
  -225823,
  -551287,
  -510579,
  -283091,
  -336867,
  -355416,
  439042,
  -448623,
  -357451,
  485662,
  -282635,
  398062,
  -461227,
  393793,
  -386285,
  -282643,
  423633,
  -345148,
  -575724,
  -94240,
  -410370,
  461176,
  -209416,
  -528858,
  -447443,
  -598281,
  -508940,
  -575725,
  -556611,
  -154158,
  -257695,
  -504807,
  -283272,
  -707540,
  -648966,
  -540296,
  -341138,
  -356302,
  -333763,
  -387248,
  -163431,
  -685658,
  -282465,
  -322305,
  -551346,
  -549849,
  -608316,
  -617239,
  -649951,
  -398478,
  -278415,
  -283263,
  -398481,
  -163455,
  -598484,
  -551283,
  -663664,
  -590085,
  -283238,
  -311610,
  -546622,
  -582066,
  -295266,
  -563168,
  307556,
  -282458,
  207616,
  -372149,
  246975,
  -258350,
  204842,
  -282619,
  -619838,
  372947,
  -588369,
  -110111,
]

async function updateWyscoutIds() {
  console.log('🔄 Iniciando actualización de Wyscout IDs...\n')

  try {
    // Obtener los primeros N jugadores (ordenados por id_player)
    const players = await prisma.jugador.findMany({
      take: newWyscoutIds.length,
      orderBy: {
        id_player: 'asc'
      },
      select: {
        id_player: true,
        player_name: true,
        wyscout_id_1: true,
      }
    })

    console.log(`📊 Se encontraron ${players.length} jugadores`)
    console.log(`📝 Se actualizarán ${Math.min(players.length, newWyscoutIds.length)} IDs\n`)

    if (players.length < newWyscoutIds.length) {
      console.warn(`⚠️  ADVERTENCIA: Hay ${newWyscoutIds.length} IDs pero solo ${players.length} jugadores`)
      console.warn(`⚠️  Solo se actualizarán los primeros ${players.length} jugadores\n`)
    }

    let updated = 0
    let failed = 0

    // Actualizar cada jugador con su nuevo Wyscout ID
    for (let i = 0; i < Math.min(players.length, newWyscoutIds.length); i++) {
      const player = players[i]
      const newWyscoutId = String(newWyscoutIds[i])

      try {
        await prisma.jugador.update({
          where: {
            id_player: player.id_player
          },
          data: {
            wyscout_id_1: newWyscoutId
          }
        })

        console.log(`✅ ${i + 1}. ${player.player_name}`)
        console.log(`   ID anterior: ${player.wyscout_id_1 || 'NULL'}`)
        console.log(`   ID nuevo: ${newWyscoutId}\n`)

        updated++
      } catch (error) {
        console.error(`❌ Error actualizando ${player.player_name}:`, error)
        failed++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMEN DE ACTUALIZACIÓN')
    console.log('='.repeat(60))
    console.log(`✅ Actualizados exitosamente: ${updated}`)
    console.log(`❌ Fallidos: ${failed}`)
    console.log(`📝 Total de IDs proporcionados: ${newWyscoutIds.length}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Error en la actualización:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script
updateWyscoutIds()
  .then(() => {
    console.log('\n✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error)
    process.exit(1)
  })
