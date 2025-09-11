// Script para corregir los metadatos del usuario
// Ejecutar con: node scripts/fix-user-metadata.js

const { clerkClient } = require('@clerk/nextjs/server')

async function fixUserMetadata() {
  try {
    console.log('🔄 Corrigiendo metadatos del usuario...')
    
    // Reemplazar con tu userId real
    const userId = 'user_2wX8vQK9XxXxXxXxXxXxXx' // CAMBIAR ESTO
    
    if (userId === 'user_2wX8vQK9XxXxXxXxXxXxXx') {
      console.log('❌ Por favor, cambia el userId en el script con tu ID real')
      return
    }
    
    const clerk = await clerkClient()
    
    // Obtener usuario actual
    const user = await clerk.users.getUser(userId)
    console.log('👤 Usuario actual:', {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      publicMetadata: user.publicMetadata
    })
    
    // Actualizar metadatos
    const updatedMetadata = {
      ...user.publicMetadata,
      profile: 'completed', // Marcar perfil como completado
      subscription: {
        plan: 'premium',
        billing: 'monthly',
        status: 'active',
        customerId: 'cus_test123',
        subscriptionId: 'sub_test123',
        startDate: new Date().toISOString(),
        sessionId: 'cs_test123',
        manualUpdate: new Date().toISOString()
      }
    }
    
    console.log('📝 Actualizando metadatos:', JSON.stringify(updatedMetadata, null, 2))
    
    await clerk.users.updateUser(userId, {
      publicMetadata: updatedMetadata
    })
    
    console.log('✅ Metadatos actualizados correctamente')
    
    // Verificar actualización
    const updatedUser = await clerk.users.getUser(userId)
    console.log('🔍 Verificación - Metadatos actualizados:', JSON.stringify(updatedUser.publicMetadata, null, 2))
    
  } catch (error) {
    console.error('❌ Error actualizando metadatos:', error)
  }
}

fixUserMetadata()
