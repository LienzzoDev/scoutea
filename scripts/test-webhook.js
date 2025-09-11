#!/usr/bin/env node

/**
 * Script para probar el webhook de Clerk
 * 
 * Uso:
 * node scripts/test-webhook.js
 */

// Cargar variables de entorno
require('dotenv').config();

const https = require('https');

// Función para hacer peticiones HTTPS
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testWebhook() {
  console.log('🧪 Probando configuración del webhook de Clerk...\n');

  const secretKey = process.env.CLERK_SECRET_KEY;
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  // Verificar variables de entorno
  console.log('📋 Verificando configuración:');
  console.log(`   - CLERK_SECRET_KEY: ${secretKey ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   - CLERK_WEBHOOK_SECRET: ${webhookSecret ? '✅ Configurado' : '❌ No configurado'}`);
  console.log('');

  if (!secretKey) {
    console.error('❌ Error: CLERK_SECRET_KEY no está configurado');
    console.log('💡 Agrega CLERK_SECRET_KEY=sk_test_... a tu archivo .env');
    return;
  }

  if (!webhookSecret) {
    console.log('⚠️ CLERK_WEBHOOK_SECRET no está configurado');
    console.log('💡 Esto significa que el webhook no está configurado aún');
    console.log('💡 Ejecuta: pnpm run webhook:dev (para desarrollo) o pnpm run webhook:setup (para producción)');
    return;
  }

  console.log('✅ Configuración básica correcta');
  console.log('🎉 El webhook debería estar funcionando');
  console.log('');
  console.log('📝 Para verificar que funciona:');
  console.log('   1. Registra un nuevo usuario');
  console.log('   2. Revisa los logs del servidor para ver:');
  console.log('      "🔔 User created webhook received"');
  console.log('      "✅ Successfully assigned role \'member\' to user"');
  console.log('   3. Verifica en Clerk Dashboard que el usuario tiene el rol asignado');
}

testWebhook().catch(console.error);
