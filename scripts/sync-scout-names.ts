/**
 * Script para sincronizar nombres de scouts con datos de usuarios
 * Actualiza scout.name, scout.surname, scout.scout_name desde Usuario.firstName/lastName
 *
 * Uso:
 *   npx tsx scripts/sync-scout-names.ts --dry-run   # Ver qué se actualizaría
 *   npx tsx scripts/sync-scout-names.ts             # Ejecutar sincronización
 */

import { clerkClient } from '@clerk/nextjs/server'

import { prisma } from '../src/lib/db'

async function syncScoutNames() {
  const isDryRun = process.argv.includes('--dry-run')

  console.log('═══════════════════════════════════════════════════════')
  console.log('        SYNC SCOUT NAMES WITH USER DATA                ')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '✏️  UPDATE MODE'}`)
  console.log('═══════════════════════════════════════════════════════\n')

  // Obtener todos los scouts
  const scouts = await prisma.scout.findMany({
    select: {
      id_scout: true,
      clerkId: true,
      scout_name: true,
      name: true,
      surname: true,
      email: true
    }
  })

  console.log(`📊 Total scouts in database: ${scouts.length}\n`)

  const updates = []

  for (const scout of scouts) {
    if (!scout.clerkId) {
      console.log(`⚠️  Scout ${scout.id_scout} has no clerkId, skipping\n`)
      continue
    }

    console.log('─'.repeat(60))
    console.log(`🔍 Checking scout: ${scout.scout_name}`)
    console.log(`   Clerk ID: ${scout.clerkId}`)
    console.log(`   Current: name="${scout.name}", surname="${scout.surname}"`)

    // 1. Buscar en la tabla Usuario
    const usuario = await prisma.usuario.findUnique({
      where: { clerkId: scout.clerkId },
      select: {
        firstName: true,
        lastName: true,
        profileCompleted: true
      }
    })

    let firstName = ''
    let lastName = ''
    let source = ''

    if (usuario && usuario.firstName && usuario.lastName) {
      firstName = usuario.firstName
      lastName = usuario.lastName
      source = 'Usuario table'
      console.log(`   ✅ Found in Usuario: "${firstName} ${lastName}"`)
    } else {
      // 2. Si no está en Usuario, buscar en Clerk
      try {
        const clerk = await clerkClient()
        const clerkUser = await clerk.users.getUser(scout.clerkId)

        if (clerkUser.firstName && clerkUser.lastName) {
          firstName = clerkUser.firstName
          lastName = clerkUser.lastName
          source = 'Clerk'
          console.log(`   ✅ Found in Clerk: "${firstName} ${lastName}"`)
        } else {
          console.log(`   ⚠️  No name data found in Clerk or Usuario`)
        }
      } catch (error) {
        console.log(`   ❌ User not found in Clerk`)
      }
    }

    // Verificar si hay que actualizar
    if (firstName && lastName) {
      const newScoutName = `${firstName} ${lastName}`.trim()

      // Solo actualizar si hay cambios
      if (scout.name !== firstName || scout.surname !== lastName || scout.scout_name !== newScoutName) {
        updates.push({
          id_scout: scout.id_scout,
          clerkId: scout.clerkId,
          oldName: scout.scout_name,
          newName: newScoutName,
          firstName,
          lastName,
          source
        })

        console.log(`   📝 Will update to: "${newScoutName}" (from ${source})`)
      } else {
        console.log(`   ✓ Already up to date`)
      }
    }

    console.log()
  }

  if (updates.length === 0) {
    console.log('✅ All scouts are already up to date!\n')
    return
  }

  console.log('═'.repeat(60))
  console.log(`\n📋 Summary: Found ${updates.length} scouts to update:\n`)

  for (const update of updates) {
    console.log(`   "${update.oldName}" → "${update.newName}" (from ${update.source})`)
  }

  if (isDryRun) {
    console.log('\n💡 Run without --dry-run to apply these changes\n')
    return
  }

  console.log('\n✏️  Applying updates...\n')

  for (const update of updates) {
    try {
      await prisma.scout.update({
        where: { id_scout: update.id_scout },
        data: {
          name: update.firstName,
          surname: update.lastName,
          scout_name: update.newName
        }
      })

      console.log(`✅ Updated: "${update.oldName}" → "${update.newName}"`)
    } catch (error) {
      console.error(`❌ Error updating scout ${update.id_scout}:`, error)
    }
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('                  SYNC COMPLETED                       ')
  console.log('═══════════════════════════════════════════════════════\n')

  await prisma.$disconnect()
}

syncScoutNames()
