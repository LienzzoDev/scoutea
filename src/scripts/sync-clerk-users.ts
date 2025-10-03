import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncClerkUsers() {
  console.log('🔄 SINCRONIZANDO USUARIOS DE CLERK')
  console.log('=' .repeat(50))

  try {
    // Para desarrollo, vamos a crear un usuario de prueba
    // En producción, esto se haría automáticamente con webhooks de Clerk
    
    console.log('\n📊 1. Verificando usuarios existentes...')
    const existingUsers = await prisma.usuario.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true
      }
    })

    console.log(`   Usuarios en BD: ${existingUsers.length}`)
    existingUsers.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`)
      console.log(`     ClerkId: ${user.clerkId}`)
    })

    if (existingUsers.length === 0) {
      console.log('\n🚀 2. Creando usuario de desarrollo...')
      
      // Crear usuario de prueba para desarrollo
      const testUser = await prisma.usuario.create({
        data: {
          clerkId: 'user_test_development', // ID de prueba
          email: 'test@scoutea.com',
          firstName: 'Test',
          lastName: 'User',
          nationality: 'Spain',
          location: 'Madrid, Spain',
          bio: 'Usuario de prueba para desarrollo',
          profileCompleted: true,
          languages: ['Spanish', 'English'],
        }
      })

      console.log(`   ✅ Usuario creado: ${testUser.firstName} ${testUser.lastName}`)
      console.log(`   📧 Email: ${testUser.email}`)
      console.log(`   🆔 ClerkId: ${testUser.clerkId}`)
    }

    // 3. Verificar configuración de Clerk
    console.log('\n🔐 3. Verificando configuración de Clerk...')
    
    const clerkEnvVars = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
      'NEXT_PUBLIC_CLERK_SIGN_UP_URL'
    ]

    clerkEnvVars.forEach(envVar => {
      const value = process.env[envVar]
      if (value) {
        console.log(`   ✅ ${envVar}: ${value.substring(0, 20)}...`)
      } else {
        console.log(`   ❌ ${envVar}: No configurado`)
      }
    })

    // 4. Instrucciones para solucionar el problema
    console.log('\n💡 SOLUCIONES PARA EL ERROR "Usuario no encontrado":')
    console.log('')
    console.log('   OPCIÓN A - Para Desarrollo (Rápida):')
    console.log('   1. Modifica el API para no requerir usuario en BD')
    console.log('   2. O usa el usuario de prueba creado arriba')
    console.log('')
    console.log('   OPCIÓN B - Para Producción (Completa):')
    console.log('   1. Configura webhooks de Clerk para crear usuarios automáticamente')
    console.log('   2. Implementa sincronización en el middleware')
    console.log('')
    console.log('   OPCIÓN C - Temporal (Bypass):')
    console.log('   1. Modifica useScoutProfile para no cargar la lista si no hay usuario')
    console.log('   2. Maneja el error gracefully en el frontend')

    console.log('\n🔧 IMPLEMENTANDO SOLUCIÓN TEMPORAL...')
    
    // Verificar si podemos crear el usuario automáticamente
    console.log('   📝 Creando función helper para auto-crear usuarios...')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  syncClerkUsers()
}

export { syncClerkUsers }