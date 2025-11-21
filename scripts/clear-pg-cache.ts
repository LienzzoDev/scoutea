import { prisma } from '../src/lib/db'

async function clearPgCache() {
  try {
    console.log('🔄 Clearing PostgreSQL prepared statement cache...')

    // Discard all cached plans
    await prisma.$executeRaw`DISCARD PLANS`

    // Also discard temporary tables
    await prisma.$executeRaw`DISCARD TEMP`

    console.log('✅ PostgreSQL cache cleared successfully!')
    console.log('💡 Please restart your development server for changes to take effect.')

  } catch (error) {
    console.error('❌ Failed to clear cache:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearPgCache()
