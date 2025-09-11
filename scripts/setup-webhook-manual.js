#!/usr/bin/env node

/**
 * Script para configurar el webhook de Clerk manualmente
 * 
 * Uso:
 * node scripts/setup-webhook-manual.js
 */

// Cargar variables de entorno
require('dotenv').config();

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔧 Configuración manual del webhook de Clerk\n');

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ Error: CLERK_SECRET_KEY no está configurado');
    console.log('💡 Agrega CLERK_SECRET_KEY=sk_test_... a tu archivo .env');
    rl.close();
    return;
  }

  console.log('✅ CLERK_SECRET_KEY está configurado');
  console.log('');

  // Preguntar por la URL del webhook
  const webhookUrl = await question('🌐 Ingresa la URL del webhook (ej: https://abc123.ngrok.io/api/webhooks/clerk): ');
  
  if (!webhookUrl) {
    console.log('❌ URL del webhook requerida');
    rl.close();
    return;
  }

  console.log('');
  console.log('📋 Configuración del webhook:');
  console.log(`   - URL: ${webhookUrl}`);
  console.log(`   - Evento: user.created`);
  console.log('');

  console.log('📝 Pasos para configurar en Clerk Dashboard:');
  console.log('1. Ve a https://dashboard.clerk.com');
  console.log('2. Selecciona tu proyecto');
  console.log('3. Ve a "Webhooks" en el menú lateral');
  console.log('4. Haz clic en "Add Endpoint"');
  console.log(`5. URL del endpoint: ${webhookUrl}`);
  console.log('6. Selecciona el evento: "user.created"');
  console.log('7. Haz clic en "Create"');
  console.log('8. Copia el "Webhook Secret" (comienza con whsec_)');
  console.log('');

  const webhookSecret = await question('🔑 Pega el Webhook Secret aquí: ');
  
  if (!webhookSecret) {
    console.log('❌ Webhook Secret requerido');
    rl.close();
    return;
  }

  console.log('');
  console.log('✅ Configuración completada!');
  console.log('');
  console.log('📝 Agrega estas líneas a tu archivo .env:');
  console.log(`CLERK_WEBHOOK_SECRET=${webhookSecret}`);
  console.log(`WEBHOOK_URL=${webhookUrl}`);
  console.log('');
  console.log('🧪 Para verificar la configuración, ejecuta:');
  console.log('pnpm run webhook:test');

  rl.close();
}

main().catch(console.error);
