import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function consolidateScouts() {
  const scoutWithReports = 'cmg9bieet0000zwme4bkdaz5e' // Scout con 7 reportes
  const scoutDuplicate = 'cmg9befv40000zwfogjcf3bf8' // Scout sin reportes (duplicado)

  console.log('🔍 Analizando scouts...\n')

  // 1. Obtener información de ambos scouts
  const [mainScout, duplicateScout] = await Promise.all([
    prisma.scout.findUnique({
      where: { id_scout: scoutWithReports },
      include: {
        reportes: true,
        scoutLists: true,
        scoutPlayerReports: true,
      }
    }),
    prisma.scout.findUnique({
      where: { id_scout: scoutDuplicate },
      include: {
        reportes: true,
        scoutLists: true,
        scoutPlayerReports: true,
      }
    })
  ])

  if (!mainScout) {
    console.error('❌ No se encontró el scout principal:', scoutWithReports)
    return
  }

  if (!duplicateScout) {
    console.error('❌ No se encontró el scout duplicado:', scoutDuplicate)
    return
  }

  console.log('📊 Scout Principal (con reportes):')
  console.log('  ID:', mainScout.id_scout)
  console.log('  Nombre:', mainScout.name || mainScout.scout_name)
  console.log('  ClerkId:', mainScout.clerkId)
  console.log('  Reportes:', mainScout.reportes.length)
  console.log('  Scout Lists:', mainScout.scoutLists.length)
  console.log('  Scout-Player Reports:', mainScout.scoutPlayerReports.length)
  console.log()

  console.log('📊 Scout Duplicado (sin reportes):')
  console.log('  ID:', duplicateScout.id_scout)
  console.log('  Nombre:', duplicateScout.name || duplicateScout.scout_name)
  console.log('  ClerkId:', duplicateScout.clerkId)
  console.log('  Reportes:', duplicateScout.reportes.length)
  console.log('  Scout Lists:', duplicateScout.scoutLists.length)
  console.log('  Scout-Player Reports:', duplicateScout.scoutPlayerReports.length)
  console.log()

  // 2. Decidir qué hacer
  if (duplicateScout.reportes.length === 0 &&
      duplicateScout.scoutLists.length === 0 &&
      duplicateScout.scoutPlayerReports.length === 0) {
    console.log('✅ El scout duplicado no tiene datos asociados. Es seguro eliminarlo.')
    console.log()

    // 3. Preguntar antes de eliminar
    console.log('⚠️  ¿Deseas eliminar el scout duplicado?')
    console.log('   Para confirmar, ejecuta este script con: npm run consolidate-scout -- --confirm')
    console.log()

    // Si se pasa --confirm, eliminar
    if (process.argv.includes('--confirm')) {
      console.log('🗑️  Eliminando scout duplicado...')
      await prisma.scout.delete({
        where: { id_scout: scoutDuplicate }
      })
      console.log('✅ Scout duplicado eliminado exitosamente!')
      console.log()
      console.log('📌 Ahora el perfil correcto es:')
      console.log(`   /member/scout/${scoutWithReports}`)
    }
  } else {
    console.log('⚠️  El scout duplicado tiene datos asociados. Necesitamos migrarlos primero.')
    console.log()

    // Si tiene datos, mostrar plan de migración
    if (duplicateScout.reportes.length > 0) {
      console.log(`   - ${duplicateScout.reportes.length} reportes a migrar`)
    }
    if (duplicateScout.scoutLists.length > 0) {
      console.log(`   - ${duplicateScout.scoutLists.length} entradas en listas a migrar`)
    }
    if (duplicateScout.scoutPlayerReports.length > 0) {
      console.log(`   - ${duplicateScout.scoutPlayerReports.length} scout-player reports a migrar`)
    }
    console.log()
    console.log('   Para migrar estos datos, ejecuta: npm run consolidate-scout -- --migrate')

    // Si se pasa --migrate, migrar los datos
    if (process.argv.includes('--migrate')) {
      console.log()
      console.log('🔄 Migrando datos...')
      console.log()

      // Migrar reportes
      if (duplicateScout.reportes.length > 0) {
        await prisma.reporte.updateMany({
          where: { scout_id: scoutDuplicate },
          data: { scout_id: scoutWithReports }
        })
        console.log(`✅ ${duplicateScout.reportes.length} reportes migrados`)
      }

      // Migrar scoutLists
      if (duplicateScout.scoutLists.length > 0) {
        await prisma.scoutList.updateMany({
          where: { scoutId: scoutDuplicate },
          data: { scoutId: scoutWithReports }
        })
        console.log(`✅ ${duplicateScout.scoutLists.length} entradas en listas migradas`)
      }

      // Migrar scoutPlayerReports
      if (duplicateScout.scoutPlayerReports.length > 0) {
        await prisma.scoutPlayerReport.updateMany({
          where: { scoutId: scoutDuplicate },
          data: { scoutId: scoutWithReports }
        })
        console.log(`✅ ${duplicateScout.scoutPlayerReports.length} scout-player reports migrados`)
      }

      console.log()
      console.log('✅ Migración completada!')
      console.log()
      console.log('🗑️  Ahora puedes eliminar el scout duplicado con: npm run consolidate-scout -- --confirm')
    }
  }
}

consolidateScouts()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
