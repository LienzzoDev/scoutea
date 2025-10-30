/**
 * Script para verificar los wyscout_id_1 almacenados
 */

import { prisma } from '../src/lib/db'

async function debugWyscoutIds() {
  console.log('🔍 Verificando Wyscout IDs almacenados...\n')

  // Obtener los primeros 10 jugadores
  const players = await prisma.jugador.findMany({
    take: 10,
    orderBy: {
      id_player: 'asc'
    },
    select: {
      id_player: true,
      player_name: true,
      wyscout_id_1: true,
    }
  })

  console.log('📊 Primeros 10 jugadores:\n')

  players.forEach((player, index) => {
    console.log(`${index + 1}. ${player.player_name}`)
    console.log(`   id_player: ${player.id_player}`)
    console.log(`   wyscout_id_1: "${player.wyscout_id_1}"`)
    console.log(`   Tipo de dato: ${typeof player.wyscout_id_1}`)
    console.log(`   Longitud: ${player.wyscout_id_1?.length}`)
    console.log()
  })

  // Buscar específicamente el primer ID que debería estar
  console.log('\n🔍 Buscando jugador con wyscout_id_1 = "60883"...')
  const player1 = await prisma.jugador.findFirst({
    where: {
      wyscout_id_1: '60883'
    },
    select: {
      id_player: true,
      player_name: true,
      wyscout_id_1: true,
    }
  })

  if (player1) {
    console.log('✅ Encontrado:', player1)
  } else {
    console.log('❌ NO encontrado con búsqueda exacta "60883"')
  }

  // Intentar con número
  console.log('\n🔍 Buscando jugador con wyscout_id_1 = 60883 (número)...')
  const player2 = await prisma.jugador.findFirst({
    where: {
      wyscout_id_1: 60883 as any
    },
    select: {
      id_player: true,
      player_name: true,
      wyscout_id_1: true,
    }
  })

  if (player2) {
    console.log('✅ Encontrado:', player2)
  } else {
    console.log('❌ NO encontrado con búsqueda numérica 60883')
  }

  // Ver todos los wyscout_id_1 únicos
  console.log('\n📋 Verificando tipos de todos los IDs...')
  const allPlayers = await prisma.jugador.findMany({
    select: {
      wyscout_id_1: true,
    }
  })

  const types = new Set()
  allPlayers.forEach(p => {
    if (p.wyscout_id_1) {
      types.add(typeof p.wyscout_id_1)
    }
  })

  console.log('Tipos de dato encontrados:', Array.from(types))

  await prisma.$disconnect()
}

debugWyscoutIds()
  .catch(console.error)
  .finally(() => process.exit(0))
