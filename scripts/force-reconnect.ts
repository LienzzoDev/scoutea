import { PrismaClient } from '@prisma/client'

async function forceReconnect() {
  try {
    console.log('🔄 Forcing fresh database connection...')

    // Create a fresh Prisma client without extensions
    const freshPrisma = new PrismaClient({
      log: ['error'],
    })

    // Disconnect any existing connections
    console.log('🔌 Disconnecting existing connections...')
    await freshPrisma.$disconnect()

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Reconnect and test
    console.log('🔌 Creating fresh connection...')
    const testPrisma = new PrismaClient({
      log: ['error'],
    })

    // Try to discard cached plans on the new connection
    try {
      await testPrisma.$executeRaw`DISCARD ALL`
      console.log('✅ Executed DISCARD ALL')
    } catch (e) {
      console.log('⚠️ Could not execute DISCARD ALL:', e)
    }

    // Test the connection with a simple query
    console.log('🧪 Testing connection with simple query...')
    const count = await testPrisma.jugador.count()
    console.log(`✅ Successfully counted ${count} players`)

    // Test fetching a player
    console.log('🧪 Testing fetch of first player...')
    const firstPlayer = await testPrisma.jugador.findFirst({
      orderBy: { id_player: 'asc' }
    })
    console.log(`✅ Retrieved player: ID ${firstPlayer?.id_player} - ${firstPlayer?.player_name}`)

    console.log('\n✅ Connection test successful!')
    console.log('💡 The connection pooler cache may have reset.')
    console.log('💡 Try restarting your dev server now.')

    await testPrisma.$disconnect()

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

forceReconnect()
