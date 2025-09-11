// Script para probar la obtención del email del usuario para Stripe Checkout
// Ejecutar con: node scripts/test-checkout-email.js

const { clerkClient } = require('@clerk/nextjs/server')

async function testCheckoutEmail() {
  try {
    console.log('🔄 Testing email retrieval for Stripe Checkout...')
    
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
      console.log(`   First Name: ${user.firstName}`)
      console.log(`   Last Name: ${user.lastName}`)
      
      // Simular la lógica del checkout
      const customerEmail = user.emailAddresses[0]?.emailAddress
      if (customerEmail) {
        console.log(`   ✅ Email disponible para Stripe Checkout: ${customerEmail}`)
      } else {
        console.log(`   ❌ No hay email disponible para Stripe Checkout`)
      }
    })
    
    // Probar con el primer usuario que tenga email
    const userWithEmail = users.data.find(user => 
      user.emailAddresses && user.emailAddresses.length > 0
    )
    
    if (userWithEmail) {
      console.log(`\n🧪 Testing checkout session creation for user: ${userWithEmail.id}`)
      
      const customerEmail = userWithEmail.emailAddresses[0]?.emailAddress
      console.log('📧 Email que se enviaría a Stripe:', customerEmail)
      
      // Simular la configuración de la sesión
      const mockSessionConfig = {
        customer_email: customerEmail,
        metadata: {
          userId: userWithEmail.id,
          plan: 'premium',
          billing: 'monthly'
        }
      }
      
      console.log('📋 Configuración de sesión simulada:', JSON.stringify(mockSessionConfig, null, 2))
    } else {
      console.log('❌ No se encontró ningún usuario con email para probar')
    }
    
  } catch (error) {
    console.error('❌ Error testing checkout email:', error)
  }
}

testCheckoutEmail()
