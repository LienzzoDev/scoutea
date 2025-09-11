// Script para probar la asignación de metadatos
// Ejecutar con: node scripts/test-metadata.js

const { clerkClient } = require('@clerk/nextjs/server')

async function testMetadata() {
  try {
    console.log('🔄 Testing metadata assignment...')
    
    // Obtener todos los usuarios
    const users = await clerkClient.users.getUserList({
      limit: 10
    })
    
    console.log(`📊 Found ${users.data.length} users`)
    
    users.data.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.emailAddresses[0]?.emailAddress}`)
      console.log(`   Public Metadata:`, JSON.stringify(user.publicMetadata, null, 2))
      console.log(`   Unsafe Metadata:`, JSON.stringify(user.unsafeMetadata, null, 2))
    })
    
    // Probar actualización de metadatos para el primer usuario
    if (users.data.length > 0) {
      const testUser = users.data[0]
      console.log(`\n🧪 Testing metadata update for user: ${testUser.id}`)
      
      try {
        await clerkClient.users.updateUser(testUser.id, {
          publicMetadata: {
            ...testUser.publicMetadata,
            testUpdate: new Date().toISOString()
          }
        })
        console.log('✅ Test metadata update successful')
      } catch (updateError) {
        console.error('❌ Test metadata update failed:', updateError)
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing metadata:', error)
  }
}

testMetadata()
