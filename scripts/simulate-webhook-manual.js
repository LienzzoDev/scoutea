// Script para simular el webhook de Stripe manualmente
// Ejecutar con: node scripts/simulate-webhook-manual.js

const https = require('https')
const http = require('http')

async function simulateWebhookManual() {
  try {
    console.log('🔄 Simulando webhook de Stripe manualmente...')
    
    // URL del webhook local
    const webhookUrl = 'http://localhost:3000/api/webhooks/stripe'
    
    // Datos del evento checkout.session.completed que recibiste
    const mockEvent = {
      id: 'evt_test123',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_a1N9ziOCKITqdMc13kdRQbQwffmKAr5NMPjdRvaRJ3ZmImm8XUfPkPwGIJ',
          object: 'checkout.session',
          amount_total: 1000,
          currency: 'usd',
          customer: 'cus_T12ey6exI88XRO',
          subscription: 'sub_1S50ZIC3O3th9zYqDy3NRX6M',
          metadata: {
            userId: 'user_32PSBp1RdaFayn7xX1TnGomCslr',
            plan: 'basic',
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
        if (res.statusCode === 200) {
          console.log('✅ Webhook simulado exitosamente!')
        } else {
          console.log('❌ Error en el webhook')
        }
      })
    })
    
    req.on('error', (error) => {
      console.error('❌ Error en la petición:', error)
    })
    
    req.write(postData)
    req.end()
    
  } catch (error) {
    console.error('❌ Error simulando webhook:', error)
  }
}

simulateWebhookManual()
