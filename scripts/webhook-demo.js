#!/usr/bin/env node

/**
 * Script para configurar webhook con URL de ejemplo
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
  console.log('🔧 Configuración del webhook con URL de ejemplo\n');

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ Error: CLERK_SECRET_KEY no está configurado');
    rl.close();
    return;
  }

  console.log('✅ CLERK_SECRET_KEY está configurado');
  console.log('');

  // URL de ejemplo
  const exampleUrl = 'https://tu-dominio.com/api/webhooks/clerk';
  
  console.log('📋 Configuración del webhook:');
  console.log(`   - URL: ${exampleUrl}`);
  console.log(`   - Evento: user.created`);
  console.log('');

  console.log('📝 Pasos para configurar en Clerk Dashboard:');
  console.log('1. Ve a https://dashboard.clerk.com');
  console.log('2. Selecciona tu proyecto');
  console.log('3. Ve a "Webhooks" en el menú lateral');
  console.log('4. Haz clic en "Add Endpoint"');
  console.log(`5. URL del endpoint: ${exampleUrl}`);
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
  console.log(`WEBHOOK_URL=${exampleUrl}`);
  console.log('');
  console.log('⚠️ IMPORTANTE: Esta es una URL de ejemplo');
  console.log('💡 Para desarrollo local, necesitarás:');
  console.log('   1. Una URL pública (ngrok, localtunnel, etc.)');
  console.log('   2. Actualizar la URL en Clerk Dashboard');
  console.log('   3. Actualizar WEBHOOK_URL en tu .env');
  console.log('');
  console.log('🧪 Para verificar la configuración, ejecuta:');
  console.log('pnpm run webhook:test');

  rl.close();
}

main().catch(console.error);
