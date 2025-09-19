import { clerkClient } from '@clerk/nextjs/server'

import { prisma } from '@/lib/db'

/**
 * Obtiene o crea un usuario en la base de datos basado en su Clerk ID
 * Esta función asegura que el usuario exista en la base de datos local
 */
export async function getOrCreateUser(clerkId: string) {
  try {
    console.log('🔍 Buscando usuario en DB:', clerkId)
    
    // Intentar encontrar el usuario primero
    let user = await prisma.usuario.findUnique({
      where: { clerkId },
      select: { id: true, email: true }
    })

    // Si el usuario existe, devolverlo
    if (user) {
      console.log('✅ Usuario encontrado en DB:', user.id)
      return user
    }

    // Si no existe, crearlo automáticamente
    console.log('⚠️ Usuario no encontrado, creando automáticamente:', clerkId)
    
    try {
      // Obtener información del usuario desde Clerk
      console.log('🔍 Obteniendo información de Clerk...')
      const clerk = await clerkClient()
      const clerkUser = await clerk.users.getUser(clerkId)
      console.log('✅ Información de Clerk obtenida')
      
      const email = clerkUser.emailAddresses[0]?.emailAddress
      if (!email) {
        console.error('❌ No se encontró email en Clerk')
        throw new Error('No se pudo obtener el email del usuario desde Clerk')
      }
      console.log('📧 Email obtenido:', email)

      // Crear el usuario en la base de datos
      console.log('➕ Creando usuario en DB...')
      user = await prisma.usuario.create({
        data: {
          clerkId,
          email,
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          profileCompleted: false
        },
        select: { id: true, email: true }
      })
      
      console.log('✅ Usuario creado automáticamente:', user.id)
      return user
      
    } catch (createError) {
      console.error('❌ Error creando usuario automáticamente:', createError)
      console.error('❌ Error stack:', createError instanceof Error ? createError.stack : 'No stack trace')
      throw new Error(`Error al crear usuario en la base de datos: ${createError instanceof Error ? createError.message : 'Error desconocido'}`)
    }
    
  } catch (error) {
    console.error('❌ Error en getOrCreateUser:', error)
    throw error
  }
}