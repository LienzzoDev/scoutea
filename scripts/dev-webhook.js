#!/usr/bin/env node

/**
 * Script para configurar webhook de Clerk en desarrollo local
 * 
 * Este script te ayuda a configurar el webhook usando ngrok
 * 
 * Uso:
 * 1. Instala ngrok: npm install -g ngrok
 * 2. Ejecuta: node scripts/dev-webhook.js
 * 3. Sigue las instrucciones
 */

// Cargar variables de entorno
require('dotenv').config();

const { exec } = require('child_process');
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

async function checkNgrok() {
  return new Promise((resolve) => {
    exec('ngrok version', (error, stdout, stderr) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function startNgrok() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Iniciando ngrok en puerto 3000...');
    
    const ngrok = exec('ngrok http 3000', (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
    });

    // Esperar un poco para que ngrok se inicie
    setTimeout(() => {
      // Obtener la URL de ngrok
      exec('curl -s http://localhost:4040/api/tunnels', (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          try {
            const tunnels = JSON.parse(stdout);
            const httpsTunnel = tunnels.tunnels.find(t => t.proto === 'https');
            if (httpsTunnel) {
              resolve(httpsTunnel.public_url);
            } else {
              reject(new Error('No se encontró túnel HTTPS'));
            }
          } catch (e) {
            reject(e);
          }
        }
      });
    }, 3000);
  });
}

async function main() {
  console.log('🔧 Configuración de webhook para desarrollo local\n');

  // Verificar ngrok
  const hasNgrok = await checkNgrok();
  if (!hasNgrok) {
    console.log('❌ ngrok no está instalado');
    console.log('💡 Instala ngrok con: npm install -g ngrok');
    console.log('   O descárgalo desde: https://ngrok.com/download');
    rl.close();
    return;
  }

  console.log('✅ ngrok está instalado');

  // Verificar variables de entorno
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.log('❌ CLERK_SECRET_KEY no está configurado');
    console.log('💡 Agrega CLERK_SECRET_KEY=sk_test_... a tu archivo .env.local');
    rl.close();
    return;
  }

  console.log('✅ CLERK_SECRET_KEY está configurado');

  // Preguntar si el servidor está ejecutándose
  const serverRunning = await question('¿Está ejecutándose el servidor de desarrollo en puerto 3000? (y/N): ');
  if (serverRunning.toLowerCase() !== 'y' && serverRunning.toLowerCase() !== 'yes') {
    console.log('💡 Ejecuta: pnpm run dev');
    rl.close();
    return;
  }

  try {
    // Iniciar ngrok
    const ngrokUrl = await startNgrok();
    const webhookUrl = `${ngrokUrl}/api/webhooks/clerk`;

    console.log('\n✅ ngrok iniciado exitosamente!');
    console.log(`🌐 URL pública: ${ngrokUrl}`);
    console.log(`🔗 Webhook URL: ${webhookUrl}`);

    console.log('\n📋 Pasos siguientes:');
    console.log('1. Ve a https://dashboard.clerk.com');
    console.log('2. Selecciona tu proyecto');
    console.log('3. Ve a "Webhooks" en el menú lateral');
    console.log('4. Haz clic en "Add Endpoint"');
    console.log(`5. URL del endpoint: ${webhookUrl}`);
    console.log('6. Selecciona el evento: "user.created"');
    console.log('7. Copia el Webhook Secret');
    console.log('8. Agrega a tu .env.local:');
    console.log(`   CLERK_WEBHOOK_SECRET=whsec_...`);

    console.log('\n⏳ Mantén este script ejecutándose mientras configuras el webhook...');
    console.log('   Presiona Ctrl+C para detener ngrok');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);
