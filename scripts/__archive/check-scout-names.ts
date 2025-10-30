import { prisma } from '../src/lib/db'

async function checkScoutNames() {
  console.log('🔍 Checking scout names in database...\n')

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

  console.log(`📊 Total scouts: ${scouts.length}\n`)

  for (const scout of scouts) {
    console.log('═'.repeat(60))
    console.log(`Scout ID: ${scout.id_scout}`)
    console.log(`Clerk ID: ${scout.clerkId}`)
    console.log(`Scout Name: ${scout.scout_name}`)
    console.log(`First Name: ${scout.name}`)
    console.log(`Last Name: ${scout.surname}`)
    console.log(`Email: ${scout.email}`)
    console.log('═'.repeat(60) + '\n')
  }

  // Verificar usuarios en la tabla Usuario
  console.log('\n🔍 Checking users in Usuario table...\n')

  const users = await prisma.usuario.findMany({
    select: {
      id: true,
      clerkId: true,
      firstName: true,
      lastName: true,
      email: true,
      profileCompleted: true
    }
  })

  console.log(`📊 Total users: ${users.length}\n`)

  for (const user of users) {
    console.log('─'.repeat(60))
    console.log(`User ID: ${user.id}`)
    console.log(`Clerk ID: ${user.clerkId}`)
    console.log(`First Name: ${user.firstName}`)
    console.log(`Last Name: ${user.lastName}`)
    console.log(`Email: ${user.email}`)
    console.log(`Profile Completed: ${user.profileCompleted}`)
    console.log('─'.repeat(60) + '\n')
  }

  await prisma.$disconnect()
}

checkScoutNames()
