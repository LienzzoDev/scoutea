#!/usr/bin/env node

/**
 * Script para configurar el webhook de Clerk automáticamente
 * 
 * Uso:
 * 1. Configura las variables de entorno en .env.local
 * 2. Ejecuta: node scripts/setup-webhook.js
 */

// Cargar variables de entorno
require('dotenv').config();

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Función para configurar el webhook
async function setupWebhook() {
  console.log('🔧 Configurando webhook de Clerk...\n');

  // Verificar variables de entorno
  const secretKey = process.env.CLERK_SECRET_KEY;
  const webhookUrl = process.env.WEBHOOK_URL || 'https://tu-dominio.com/api/webhooks/clerk';

  if (!secretKey) {
    console.error('❌ Error: CLERK_SECRET_KEY no está configurado en .env.local');
    console.log('💡 Agrega CLERK_SECRET_KEY=sk_test_... a tu archivo .env.local');
    process.exit(1);
  }

  console.log('📋 Configuración:');
  console.log(`   - Secret Key: ${secretKey.substring(0, 20)}...`);
  console.log(`   - Webhook URL: ${webhookUrl}`);
  console.log('');

  // Preguntar por confirmación
  const confirm = await new Promise((resolve) => {
    rl.question('¿Continuar con la configuración? (y/N): ', resolve);
  });

  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('❌ Configuración cancelada');
    rl.close();
    return;
  }

  try {
    // Obtener la instancia de Clerk
    const instanceResponse = await makeRequest({
      hostname: 'api.clerk.com',
      path: '/v1/instances',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (instanceResponse.status !== 200) {
      throw new Error(`Error al obtener instancia: ${instanceResponse.data}`);
    }

    const instance = instanceResponse.data[0];
    console.log(`✅ Instancia encontrada: ${instance.name}`);

    // Crear el webhook
    const webhookData = {
      url: webhookUrl,
      events: ['user.created'],
      active: true
    };

    const webhookResponse = await makeRequest({
      hostname: 'api.clerk.com',
      path: '/v1/webhooks',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    }, webhookData);

    if (webhookResponse.status === 201) {
      const webhook = webhookResponse.data;
      console.log('✅ Webhook creado exitosamente!');
      console.log(`   - ID: ${webhook.id}`);
      console.log(`   - URL: ${webhook.url}`);
      console.log(`   - Secret: ${webhook.secret}`);
      console.log('');
      console.log('🔑 Agrega este secret a tu .env.local:');
      console.log(`CLERK_WEBHOOK_SECRET=${webhook.secret}`);
      console.log('');
      console.log('📝 También actualiza tu .env.local con:');
      console.log(`WEBHOOK_URL=${webhookUrl}`);
    } else {
      console.error('❌ Error al crear webhook:', webhookResponse.data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  rl.close();
}

// Función para listar webhooks existentes
async function listWebhooks() {
  console.log('📋 Listando webhooks existentes...\n');

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ Error: CLERK_SECRET_KEY no está configurado');
    return;
  }

  try {
    const response = await makeRequest({
      hostname: 'api.clerk.com',
      path: '/v1/webhooks',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      const webhooks = response.data;
      if (webhooks.length === 0) {
        console.log('📭 No hay webhooks configurados');
      } else {
        console.log(`📋 ${webhooks.length} webhook(s) encontrado(s):`);
        webhooks.forEach((webhook, index) => {
          console.log(`\n${index + 1}. ${webhook.url}`);
          console.log(`   - ID: ${webhook.id}`);
          console.log(`   - Activo: ${webhook.active ? '✅' : '❌'}`);
          console.log(`   - Eventos: ${webhook.events.join(', ')}`);
        });
      }
    } else {
      console.error('❌ Error al listar webhooks:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Función principal
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'list':
      await listWebhooks();
      break;
    case 'setup':
    default:
      await setupWebhook();
      break;
  }
}

main().catch(console.error);
