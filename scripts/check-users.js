const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...')
    
    const users = await prisma.usuario.findMany()
    
    console.log(`📊 Total de usuarios: ${users.length}`)
    
    if (users.length > 0) {
      console.log('\n👥 Usuarios encontrados:')
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`)
        console.log(`   Clerk ID: ${user.clerkId}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Nombre: ${user.firstName} ${user.lastName}`)
        console.log(`   Perfil completado: ${user.profileCompleted}`)
        console.log(`   Creado: ${user.createdAt}`)
        console.log('---')
      })
    } else {
      console.log('❌ No se encontraron usuarios en la base de datos')
    }
    
  } catch (error) {
    console.error('❌ Error al verificar usuarios:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
