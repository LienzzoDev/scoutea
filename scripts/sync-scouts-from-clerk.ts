import { clerkClient } from '@clerk/nextjs/server'

import { prisma } from '@/lib/db'

async function syncScoutsFromClerk() {
  console.log('🔄 Iniciando sincronización de scouts desde Clerk...\n')

  try {
    const client = await clerkClient()

    // 1. Obtener TODOS los usuarios de Clerk
    console.log('📋 Paso 1: Obteniendo todos los usuarios de Clerk...')
    const { data: allUsers } = await client.users.getUserList({ limit: 500 })
    console.log(`   ✅ Total de usuarios en Clerk: ${allUsers.length}\n`)

    // 2. Filtrar solo usuarios con rol "scout"
    console.log('🔍 Paso 2: Filtrando usuarios con rol "scout"...')
    const scoutUsers = allUsers.filter(user => {
      const role = user.publicMetadata?.role as string | undefined
      return role === 'scout'
    })
    console.log(`   ✅ Usuarios con rol "scout": ${scoutUsers.length}`)

    if (scoutUsers.length > 0) {
      console.log('\n   📝 Scouts encontrados en Clerk:')
      scoutUsers.forEach(user => {
        console.log(`      - ${user.firstName} ${user.lastName} (${user.emailAddresses[0]?.emailAddress})`)
      })
    }
    console.log('')

    // 3. Obtener todos los scouts actuales en la DB
    console.log('📋 Paso 3: Obteniendo scouts actuales de la base de datos...')
    const dbScouts = await prisma.scout.findMany({
      select: {
        id_scout: true,
        clerkId: true,
        scout_name: true,
        email: true
      }
    })
    console.log(`   ✅ Total de scouts en DB: ${dbScouts.length}\n`)

    // 4. Crear o actualizar scouts con rol "scout" en Clerk
    console.log('➕ Paso 4: Creando/actualizando scouts en la base de datos...')
    let created = 0
    let updated = 0

    for (const user of scoutUsers) {
      const email = user.emailAddresses[0]?.emailAddress || null
      const firstName = user.firstName || ''
      const lastName = user.lastName || ''
      const fullName = `${firstName} ${lastName}`.trim() || email?.split('@')[0] || 'Scout'

      // Buscar si ya existe
      const existingScout = dbScouts.find(s => s.clerkId === user.id)

      if (existingScout) {
        // Actualizar scout existente
        await prisma.scout.update({
          where: { id_scout: existingScout.id_scout },
          data: {
            scout_name: fullName,
            name: firstName,
            surname: lastName,
            email: email,
            clerkId: user.id
          }
        })
        console.log(`   🔄 Actualizado: ${fullName} (${email})`)
        updated++
      } else {
        // Crear nuevo scout
        await prisma.scout.create({
          data: {
            clerkId: user.id,
            scout_name: fullName,
            name: firstName,
            surname: lastName,
            email: email,
            join_date: user.createdAt ? new Date(user.createdAt) : new Date(),
            total_reports: 0,
            original_reports: 0,
            open_to_work: true
          }
        })
        console.log(`   ✅ Creado: ${fullName} (${email})`)
        created++
      }
    }
    console.log(`\n   📊 Resumen: ${created} creados, ${updated} actualizados\n`)

    // 5. Eliminar scouts cuyo usuario ya no existe en Clerk
    console.log('🗑️  Paso 5: Verificando scouts con clerkId...')

    const scoutsWithClerkId = dbScouts.filter(s => s.clerkId)
    let deleted = 0

    for (const scout of scoutsWithClerkId) {
      try {
        let shouldDelete = false
        let reason = ''

        try {
          // Verificar si el usuario todavía existe en Clerk
          await client.users.getUser(scout.clerkId!)
          // Si llegamos aquí, el usuario existe en Clerk
          // NO lo eliminamos, aunque no tenga rol "scout"
          // porque es un usuario real del sistema
        } catch (error) {
          // El usuario ya NO existe en Clerk, eliminar
          shouldDelete = true
          reason = 'usuario eliminado de Clerk'
        }

        if (shouldDelete) {
          await prisma.scout.delete({
            where: { id_scout: scout.id_scout }
          })
          console.log(`   ❌ Eliminado: ${scout.scout_name} (${reason})`)
          deleted++
        }
      } catch (error) {
        console.error(`   ⚠️  Error al procesar scout ${scout.scout_name}:`, error)
      }
    }

    // También eliminar scouts sin clerkId (datos de muestra)
    const scoutsWithoutClerkId = dbScouts.filter(s => !s.clerkId)
    console.log(`\n   🧹 Limpiando scouts sin cuenta en Clerk (${scoutsWithoutClerkId.length})...`)

    for (const scout of scoutsWithoutClerkId) {
      try {
        await prisma.scout.delete({
          where: { id_scout: scout.id_scout }
        })
        console.log(`   ❌ Eliminado: ${scout.scout_name} (sin cuenta en Clerk)`)
        deleted++
      } catch (error) {
        console.error(`   ⚠️  Error al eliminar scout ${scout.scout_name}:`, error)
      }
    }

    console.log(`\n   📊 Total eliminados: ${deleted}\n`)

    // 6. Resumen final
    console.log('📊 RESUMEN FINAL:')
    console.log('================')
    console.log(`✅ Scouts con rol "scout" en Clerk: ${scoutUsers.length}`)
    console.log(`➕ Scouts creados en DB: ${created}`)
    console.log(`🔄 Scouts actualizados en DB: ${updated}`)
    console.log(`❌ Scouts eliminados de DB: ${deleted}`)

    const finalCount = await prisma.scout.count()
    console.log(`\n📦 Total de scouts en DB después de sincronizar: ${finalCount}`)

    if (finalCount > 0) {
      console.log('\n✨ Scouts sincronizados correctamente:')
      const finalScouts = await prisma.scout.findMany({
        select: {
          scout_name: true,
          email: true,
          clerkId: true
        }
      })
      finalScouts.forEach(scout => {
        console.log(`   - ${scout.scout_name} (${scout.email})`)
      })
    } else {
      console.log('\n⚠️  No hay scouts con rol "scout" en Clerk.')
      console.log('   Para crear un scout, registra un usuario en Clerk y asígnale el rol "scout" en publicMetadata.')
    }

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error)
    throw error
  }
}

// Ejecutar script
syncScoutsFromClerk()
  .then(() => {
    console.log('\n✅ Sincronización completada exitosamente!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })