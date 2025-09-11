// Script para probar el webhook de Stripe en localhost
// Ejecutar con: node scripts/test-stripe-webhook-local.js

const { clerkClient } = require('@clerk/nextjs/server')

async function testStripeWebhookLocal() {
  try {
    console.log('🔄 Testing Stripe webhook functionality in localhost...')
    
    // Obtener todos los usuarios
    const clerk = await clerkClient()
    const users = await clerk.users.getUserList({
      limit: 10
    })
    
    console.log(`📊 Found ${users.data.length} users`)
    
    // Buscar un usuario con metadatos para probar
    const testUser = users.data.find(user => 
      user.publicMetadata && 
      user.publicMetadata.role === 'member'
    )
    
    if (!testUser) {
      console.log('❌ No se encontró un usuario member para probar')
      return
    }
    
    console.log(`\n🧪 Testing subscription update for user: ${testUser.id}`)
    console.log('📋 Metadatos actuales:', JSON.stringify(testUser.publicMetadata, null, 2))
    
    try {
      const existingMetadata = testUser.publicMetadata || {}
      
      // Simular actualización de suscripción como lo haría el webhook
      await clerk.users.updateUser(testUser.id, {
        publicMetadata: {
          ...existingMetadata,
          subscription: {
            plan: 'premium',
            billing: 'monthly',
            status: 'active',
            customerId: 'cus_test123',
            subscriptionId: 'sub_test123',
            startDate: new Date().toISOString(),
            sessionId: 'cs_test123',
            testUpdate: new Date().toISOString()
          }
        }
      })
      
      console.log('✅ Test subscription update successful')
      
      // Verificar la actualización
      const updatedUser = await clerk.users.getUser(testUser.id)
      console.log('🔍 Metadatos después de la actualización:', JSON.stringify(updatedUser.publicMetadata, null, 2))
      
    } catch (updateError) {
      console.error('❌ Test subscription update failed:', updateError)
    }
    
  } catch (error) {
    console.error('❌ Error testing Stripe webhook:', error)
  }
}

testStripeWebhookLocal()
