// Script para probar el webhook de Stripe
// Ejecutar con: node scripts/test-stripe-webhook.js

const { clerkClient } = require('@clerk/nextjs/server')

async function testStripeWebhook() {
  try {
    console.log('🔄 Testing Stripe webhook functionality...')
    
    // Obtener todos los usuarios
    const clerk = await clerkClient()
    const users = await clerk.users.getUserList({
      limit: 10
    })
    
    console.log(`📊 Found ${users.data.length} users`)
    
    users.data.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.emailAddresses[0]?.emailAddress}`)
      console.log(`   Public Metadata:`, JSON.stringify(user.publicMetadata, null, 2))
      
      const subscription = (user.publicMetadata as any)?.subscription
      if (subscription) {
        console.log(`   📋 Subscription Status: ${subscription.status}`)
        console.log(`   📋 Plan: ${subscription.plan}`)
        console.log(`   📋 Billing: ${subscription.billing}`)
      } else {
        console.log(`   📋 No subscription found`)
      }
    })
    
    // Simular actualización de suscripción
    if (users.data.length > 0) {
      const testUser = users.data[0]
      console.log(`\n🧪 Testing subscription update for user: ${testUser.id}`)
      
      try {
        const existingMetadata = testUser.publicMetadata || {}
        
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
              testUpdate: new Date().toISOString()
            }
          }
        })
        console.log('✅ Test subscription update successful')
      } catch (updateError) {
        console.error('❌ Test subscription update failed:', updateError)
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Stripe webhook:', error)
  }
}

testStripeWebhook()
