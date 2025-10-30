/**
 * Script para corregir el approval_status de jugadores existentes
 *
 * Regla:
 * - Los jugadores que fueron creados por scouts (tienen created_by_scout_id)
 *   y NO han sido aprobados aún, deben estar en 'pending'
 * - Los jugadores que NO tienen created_by_scout_id (creados por admin/sistema)
 *   deben estar en 'approved'
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verificando estado de aprobación de jugadores...\n')

  // 1. Contar jugadores por estado
  const statusCount = await prisma.jugador.groupBy({
    by: ['approval_status'],
    _count: true
  })

  console.log('📊 Estado actual:')
  statusCount.forEach(({ approval_status, _count }) => {
    console.log(`   ${approval_status}: ${_count} jugadores`)
  })

  // 2. Verificar jugadores creados por scouts que están aprobados automáticamente
  const scoutPlayersApproved = await prisma.jugador.count({
    where: {
      created_by_scout_id: { not: null },
      approval_status: 'approved',
      approved_by_admin_id: null // No fueron aprobados manualmente
    }
  })

  console.log(`\n⚠️  Jugadores creados por scouts con aprobación automática: ${scoutPlayersApproved}`)

  // 3. Preguntar si desea corregir
  if (scoutPlayersApproved > 0) {
    console.log('\n📝 Estos jugadores deberían estar en "pending" hasta que un admin los apruebe.')
    console.log('   Para corregirlos, ejecuta: npx tsx scripts/fix-approval-status.ts --fix')
  }

  // 4. Si se pasa el flag --fix, corregir
  if (process.argv.includes('--fix')) {
    console.log('\n🔧 Corrigiendo estado de aprobación...')

    // Marcar como pending los jugadores creados por scouts sin aprobación manual
    const updated = await prisma.jugador.updateMany({
      where: {
        created_by_scout_id: { not: null },
        approval_status: 'approved',
        approved_by_admin_id: null
      },
      data: {
        approval_status: 'pending'
      }
    })

    console.log(`✅ ${updated.count} jugadores actualizados a "pending"`)

    // Mostrar nuevo estado
    const newStatusCount = await prisma.jugador.groupBy({
      by: ['approval_status'],
      _count: true
    })

    console.log('\n📊 Estado después de la corrección:')
    newStatusCount.forEach(({ approval_status, _count }) => {
      console.log(`   ${approval_status}: ${_count} jugadores`)
    })
  }

  console.log('\n✅ Verificación completada')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
