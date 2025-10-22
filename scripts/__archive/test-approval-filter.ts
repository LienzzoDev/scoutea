/**
 * Script para probar que los jugadores pendientes NO aparecen en búsquedas
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Probando filtros de aprobación...\n')

  // 1. Obtener jugadores pendientes
  const pendingPlayers = await prisma.jugador.findMany({
    where: { approval_status: 'pending' },
    select: {
      id_player: true,
      player_name: true,
      approval_status: true,
      created_by_scout_id: true
    }
  })

  console.log(`📋 Jugadores pendientes (${pendingPlayers.length}):`)
  pendingPlayers.forEach(p => {
    console.log(`   - ${p.player_name} (${p.id_player}) - Scout: ${p.created_by_scout_id}`)
  })

  // 2. Simular búsqueda de miembros (CON filtro de aprobación)
  const memberSearch = await prisma.jugador.findMany({
    where: {
      approval_status: 'approved',
      player_name: {
        contains: '',
        mode: 'insensitive'
      }
    },
    take: 5,
    select: {
      id_player: true,
      player_name: true,
      approval_status: true
    }
  })

  console.log(`\n✅ Búsqueda para MIEMBROS (con filtro approval_status='approved'):`)
  console.log(`   Total encontrado: ${memberSearch.length}`)
  memberSearch.forEach(p => {
    console.log(`   - ${p.player_name} (Status: ${p.approval_status})`)
  })

  // 3. Verificar que los jugadores pendientes NO estén en la búsqueda de miembros
  const pendingIds = new Set(pendingPlayers.map(p => p.id_player))
  const foundPendingInMemberSearch = memberSearch.some(p => pendingIds.has(p.id_player))

  if (foundPendingInMemberSearch) {
    console.log('\n❌ ERROR: Se encontraron jugadores pendientes en la búsqueda de miembros!')
  } else {
    console.log('\n✅ CORRECTO: Los jugadores pendientes NO aparecen en la búsqueda de miembros')
  }

  // 4. Simular búsqueda SIN filtro (para comparar)
  const unfiltered = await prisma.jugador.count()
  const approved = await prisma.jugador.count({ where: { approval_status: 'approved' } })
  const pending = await prisma.jugador.count({ where: { approval_status: 'pending' } })

  console.log('\n📊 Resumen:')
  console.log(`   Total jugadores en DB: ${unfiltered}`)
  console.log(`   Jugadores aprobados: ${approved}`)
  console.log(`   Jugadores pendientes: ${pending}`)
  console.log(`   Diferencia: ${unfiltered - approved} (${pending} pendientes + ${unfiltered - approved - pending} otros)`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
