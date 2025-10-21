import { clerkClient } from '@clerk/nextjs/server'

async function checkScoutRoles() {
  const scoutsWithClerk = [
    { name: 'Tech Lienzzo', clerkId: 'user_31HeIcK1NIrvosfkUsDbRQmocR6' },
    { name: 'Demo Scout', clerkId: 'user_33DdeSzs9lF8wVsD7TJmyxU0kUq' }
  ]

  console.log('🔍 Verificando roles de scouts en Clerk...\n')

  const client = await clerkClient()

  for (const scout of scoutsWithClerk) {
    try {
      const user = await client.users.getUser(scout.clerkId)
      const role = user.publicMetadata?.role as string | undefined

      console.log(`👤 ${scout.name}`)
      console.log(`   Clerk ID: ${scout.clerkId}`)
      console.log(`   Email: ${user.emailAddresses[0]?.emailAddress}`)
      console.log(`   Rol en Clerk: ${role || 'NO TIENE ROL'}`)
      console.log(`   ✅ Válido para reportes: ${role === 'scout' ? 'SÍ' : 'NO'}`)
      console.log('')
    } catch (error) {
      console.error(`❌ Error al obtener usuario ${scout.name}:`, error)
    }
  }
}

checkScoutRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })