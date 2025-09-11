const { PrismaClient } = require('@prisma/client')
const { clerkClient } = require('@clerk/nextjs/server')

const prisma = new PrismaClient()

async function setAdminRole() {
  try {
    console.log('🔧 Configurando rol de admin...')

    // Obtener el primer usuario de la base de datos
    const user = await prisma.usuario.findFirst({
      orderBy: { createdAt: 'asc' }
    })

    if (!user) {
      console.log('❌ No hay usuarios en la base de datos')
      return
    }

    console.log('👤 Usuario encontrado:', user.email)

    // Actualizar el rol en Clerk usando API REST
    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${user.clerkId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          public_metadata: {
            role: 'admin',
            profile: 'completed'
          }
        })
      })

      if (response.ok) {
        console.log('✅ Rol de admin asignado en Clerk para:', user.email)
      } else {
        const errorData = await response.json()
        console.error('❌ Error al actualizar Clerk:', errorData)
      }
    } catch (clerkError) {
      console.error('❌ Error al actualizar Clerk:', clerkError.message)
    }

    // Actualizar en la base de datos local
    await prisma.usuario.update({
      where: { id: user.id },
      data: {
        profileCompleted: true
      }
    })

    console.log('✅ Perfil marcado como completado en la base de datos')
    console.log('🎉 Usuario configurado como admin:', user.email)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setAdminRole()
