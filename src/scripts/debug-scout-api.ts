import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugScoutAPI() {
  console.log('🔍 DEBUG: Scout API Issues')
  console.log('=' .repeat(50))

  try {
    // 1. Verificar scouts en la base de datos
    console.log('\n📊 1. Scouts en la base de datos:')
    const scouts = await prisma.scout.findMany({
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        surname: true
      }
    })

    console.log(`   Total scouts: ${scouts.length}`)
    scouts.forEach((scout, index) => {
      console.log(`   ${index + 1}. ID: ${scout.id_scout} | Nombre: ${scout.scout_name || scout.name}`)
    })

    if (scouts.length === 0) {
      console.log('   ❌ No hay scouts en la base de datos!')
      return
    }

    // 2. Probar API con scout existente
    console.log('\n🔌 2. Probando API con scout existente:')
    const firstScout = scouts[0]
    console.log(`   Probando con scout: ${firstScout.id_scout}`)

    try {
      const response = await fetch(`http://localhost:3000/api/scouts/${firstScout.id_scout}`)
      console.log(`   Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ API funciona correctamente`)
        console.log(`   Scout obtenido: ${data.scout?.scout_name || data.scout?.name}`)
      } else {
        const errorData = await response.text()
        console.log(`   ❌ Error en API: ${errorData}`)
      }
    } catch (fetchError) {
      console.log(`   ❌ Error de conexión: ${fetchError}`)
      console.log('   💡 Asegúrate de que el servidor esté corriendo en localhost:3000')
    }

    // 3. Probar API con scout inexistente
    console.log('\n🔌 3. Probando API con scout inexistente:')
    try {
      const response = await fetch(`http://localhost:3000/api/scouts/scout-inexistente`)
      console.log(`   Status: ${response.status} ${response.statusText}`)
      
      if (response.status === 404) {
        console.log(`   ✅ API maneja correctamente scouts inexistentes`)
      } else {
        const errorData = await response.text()
        console.log(`   ⚠️  Respuesta inesperada: ${errorData}`)
      }
    } catch (fetchError) {
      console.log(`   ❌ Error de conexión: ${fetchError}`)
    }

    // 4. Verificar tipos de Scout
    console.log('\n📝 4. Verificando estructura de datos:')
    const sampleScout = await prisma.scout.findFirst()
    if (sampleScout) {
      console.log('   Campos disponibles en Scout:')
      console.log(`   - id_scout: ${sampleScout.id_scout}`)
      console.log(`   - scout_name: ${sampleScout.scout_name}`)
      console.log(`   - name: ${sampleScout.name}`)
      console.log(`   - surname: ${sampleScout.surname}`)
      console.log(`   - nationality: ${sampleScout.nationality}`)
      console.log(`   - scout_level: ${sampleScout.scout_level}`)
    }

    console.log('\n💡 POSIBLES CAUSAS DEL ERROR 404:')
    console.log('   1. El scoutId que se está pasando no existe en la BD')
    console.log('   2. El servidor no está corriendo en localhost:3000')
    console.log('   3. Hay un problema de routing en Next.js')
    console.log('   4. El componente está pasando un ID incorrecto')

    console.log('\n🔧 SOLUCIONES SUGERIDAS:')
    console.log('   1. Verificar qué scoutId se está pasando al componente')
    console.log('   2. Usar uno de los IDs válidos listados arriba')
    console.log('   3. Agregar logs en el hook useScoutProfile')
    console.log('   4. Verificar que el servidor esté corriendo')

  } catch (error) {
    console.error('❌ Error en debug:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  debugScoutAPI()
}

export { debugScoutAPI }