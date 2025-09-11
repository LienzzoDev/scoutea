// Script para probar el endpoint del webhook de Stripe
// Ejecutar con: node scripts/test-webhook-endpoint.js

const https = require('https')
const http = require('http')

async function testWebhookEndpoint() {
  try {
    console.log('🔄 Testing webhook endpoint...')
    
    // URL del webhook (ajustar según tu configuración)
    const webhookUrl = 'http://localhost:3000/api/webhooks/stripe'
    
    // Simular evento de checkout.session.completed
    const mockEvent = {
      id: 'evt_test123',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test123',
          object: 'checkout.session',
          amount_total: 2000,
          currency: 'usd',
          customer: 'cus_test123',
          subscription: 'sub_test123',
          metadata: {
            userId: 'user_test123', // Reemplazar con un ID real de usuario
            plan: 'premium',
            billing: 'monthly'
          },
          payment_status: 'paid',
          status: 'complete'
        }
      }
    }
    
    const postData = JSON.stringify(mockEvent)
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/webhooks/stripe',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'stripe-signature': 'test_signature' // Esto fallará la verificación, pero podemos ver el log
      }
    }
    
    console.log('📤 Enviando evento de prueba a:', webhookUrl)
    console.log('📋 Datos del evento:', JSON.stringify(mockEvent, null, 2))
    
    const req = http.request(options, (res) => {
      console.log(`📥 Respuesta del servidor: ${res.statusCode}`)
      
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        console.log('📋 Respuesta completa:', data)
      })
    })
    
    req.on('error', (error) => {
      console.error('❌ Error en la petición:', error)
    })
    
    req.write(postData)
    req.end()
    
  } catch (error) {
    console.error('❌ Error testing webhook endpoint:', error)
  }
}

testWebhookEndpoint()
