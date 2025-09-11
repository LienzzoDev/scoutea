// Script para actualizar metadatos directamente sin webhook
// Ejecutar con: node scripts/update-metadata-direct.js

const { clerkClient } = require('@clerk/nextjs/server')

async function updateMetadataDirect() {
  try {
    console.log('🔄 Actualizando metadatos directamente...')
    
    const userId = 'user_32PSBp1RdaFayn7xX1TnGomCslr' // Tu userId del evento
    const plan = 'basic'
    const billing = 'monthly'
    
    const clerk = await clerkClient()
    
    // Obtener metadatos existentes
    const user = await clerk.users.getUser(userId)
    const existingMetadata = user.publicMetadata || {}
    
    console.log('📋 Metadatos existentes:', JSON.stringify(existingMetadata, null, 2))
    
    // Actualizar metadatos con suscripción
    const updatedMetadata = {
      ...existingMetadata,
      subscription: {
        plan: plan,
        billing: billing,
        status: 'active',
        customerId: 'cus_T12ey6exI88XRO',
        subscriptionId: 'sub_1S50ZIC3O3th9zYqDy3NRX6M',
        startDate: new Date().toISOString(),
        sessionId: 'cs_test_a1N9ziOCKITqdMc13kdRQbQwffmKAr5NMPjdRvaRJ3ZmImm8XUfPkPwGIJ',
        manualUpdate: new Date().toISOString()
      }
    }
    
    console.log('📝 Actualizando metadatos:', JSON.stringify(updatedMetadata, null, 2))
    
    await clerk.users.updateUser(userId, {
      publicMetadata: updatedMetadata
    })
    
    console.log('✅ Metadatos actualizados correctamente!')
    
    // Verificar actualización
    const updatedUser = await clerk.users.getUser(userId)
    console.log('🔍 Verificación - Metadatos actualizados:', JSON.stringify(updatedUser.publicMetadata, null, 2))
    
  } catch (error) {
    console.error('❌ Error actualizando metadatos:', error)
  }
}

updateMetadataDirect()
