#!/usr/bin/env node

/**
 * Script para obtener la URL del webhook
 */

const { exec } = require('child_process');

function getWebhookUrl() {
  return new Promise((resolve, reject) => {
    // Intentar obtener la URL de localtunnel
    exec('curl -s http://localhost:4040/api/tunnels 2>/dev/null || echo "no-ngrok"', (error, stdout, stderr) => {
      if (stdout.includes('no-ngrok')) {
        // Si no hay ngrok, usar localtunnel
        exec('ps aux | grep "lt --port 3000" | grep -v grep', (error, stdout, stderr) => {
          if (stdout) {
            console.log('🌐 localtunnel está ejecutándose en puerto 3000');
            console.log('📝 Para obtener la URL, revisa la salida del comando localtunnel');
            console.log('💡 La URL debería ser algo como: https://abc123.loca.lt');
            console.log('');
            console.log('🔗 URL del webhook sería: https://abc123.loca.lt/api/webhooks/clerk');
            console.log('');
            console.log('📋 Pasos siguientes:');
            console.log('1. Ve a la terminal donde ejecutaste "lt --port 3000"');
            console.log('2. Copia la URL que aparece (ej: https://abc123.loca.lt)');
            console.log('3. Ejecuta: pnpm run webhook:manual');
            console.log('4. Pega la URL completa: https://abc123.loca.lt/api/webhooks/clerk');
            resolve();
          } else {
            console.log('❌ localtunnel no está ejecutándose');
            console.log('💡 Ejecuta: lt --port 3000');
            resolve();
          }
        });
      } else {
        // Si hay ngrok, intentar obtener la URL
        try {
          const tunnels = JSON.parse(stdout);
          const httpsTunnel = tunnels.tunnels.find(t => t.proto === 'https');
          if (httpsTunnel) {
            const webhookUrl = `${httpsTunnel.public_url}/api/webhooks/clerk`;
            console.log('✅ URL del webhook encontrada:');
            console.log(`🔗 ${webhookUrl}`);
            resolve(webhookUrl);
          } else {
            console.log('❌ No se encontró túnel HTTPS en ngrok');
            resolve();
          }
        } catch (e) {
          console.log('❌ Error al parsear respuesta de ngrok');
          resolve();
        }
      }
    });
  });
}

getWebhookUrl().catch(console.error);
