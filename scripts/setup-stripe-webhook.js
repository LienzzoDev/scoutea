#!/usr/bin/env node

const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function setupStripeWebhook() {
  console.log('🔧 Configuración del Webhook de Stripe')
  console.log('=====================================\n')

  console.log('📋 Pasos para configurar el webhook:')
  console.log('1. Ve a https://dashboard.stripe.com/webhooks')
  console.log('2. Haz clic en "Add endpoint"')
  console.log('3. Usa esta URL: https://khaki-corners-rush.loca.lt/api/webhooks/stripe')
  console.log('4. Selecciona estos eventos:')
  console.log('   - checkout.session.completed')
  console.log('   - customer.subscription.updated')
  console.log('   - customer.subscription.deleted')
  console.log('   - invoice.payment_failed')
  console.log('5. Copia el webhook secret que empiece con "whsec_"')
  console.log('')

  const webhookSecret = await question('🔑 Ingresa el webhook secret de Stripe (whsec_...): ')
  
  if (!webhookSecret.startsWith('whsec_')) {
    console.log('❌ El webhook secret debe empezar con "whsec_"')
    rl.close()
    return
  }

  // Actualizar el archivo .env
  const fs = require('fs')
  const path = require('path')
  const envPath = path.join(process.cwd(), '.env')

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8')
    
    // Reemplazar el webhook secret
    envContent = envContent.replace(
      'STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here',
      `STRIPE_WEBHOOK_SECRET=${webhookSecret}`
    )
    
    fs.writeFileSync(envPath, envContent)
    console.log('✅ Webhook secret actualizado en .env')
  }

  console.log('\n🎉 Configuración completada!')
  console.log('📋 Resumen:')
  console.log(`- Webhook URL: https://khaki-corners-rush.loca.lt/api/webhooks/stripe`)
  console.log(`- Webhook Secret: ${webhookSecret}`)
  console.log('\n🚀 Ahora puedes probar los pagos!')
  console.log('💳 Usa la tarjeta de prueba: 4242 4242 4242 4242')

  rl.close()
}

setupStripeWebhook().catch(console.error)
