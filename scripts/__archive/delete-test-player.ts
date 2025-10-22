/**
 * Script para eliminar el jugador de prueba
 * Útil después de probar la importación FMI
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteTestPlayer() {
  try {
    console.log('🔄 Eliminando jugador de prueba...')

    const testPlayerId = 'test_player_2000188850'

    // 1. Eliminar atributos primero (si existen)
    const deletedAttributes = await prisma.atributos.deleteMany({
      where: {
        id_player: testPlayerId
      }
    })
    console.log(`   ✅ Atributos eliminados: ${deletedAttributes.count}`)

    // 2. Eliminar jugador
    const deletedPlayer = await prisma.jugador.delete({
      where: {
        id_player: testPlayerId
      }
    })
    console.log(`   ✅ Jugador eliminado: ${deletedPlayer.player_name}`)

    console.log('')
    console.log('✅ Jugador de prueba eliminado exitosamente')

  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      console.log('ℹ️  El jugador de prueba no existe en la base de datos')
    } else {
      console.error('❌ Error eliminando jugador de prueba:', error)
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script
deleteTestPlayer()
  .then(() => {
    console.log('✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en script:', error)
    process.exit(1)
  })
