#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env')

// Leer el archivo .env existente o crear uno nuevo
let envContent = ''
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
}

// Configuración de Stripe
const stripeConfig = `
# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here`

// Verificar si ya existen las variables de Stripe
if (envContent.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')) {
  console.log('✅ Las variables de Stripe ya están configuradas en .env')
} else {
  // Agregar configuración de Stripe
  const updatedContent = envContent + stripeConfig
  fs.writeFileSync(envPath, updatedContent)
  console.log('✅ Variables de Stripe agregadas al archivo .env')
}

console.log('\n🔧 Configuración de Stripe completada!')
console.log('📋 Próximos pasos:')
console.log('1. Configurar webhook en Stripe Dashboard')
console.log('2. Obtener STRIPE_WEBHOOK_SECRET')
console.log('3. Probar la integración de pagos')
console.log('\n📚 Ver STRIPE_SETUP.md para más detalles')
