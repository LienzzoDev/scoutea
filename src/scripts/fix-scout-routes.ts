import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixScoutRoutes() {
  console.log('🔧 FIXING SCOUT ROUTES')
  console.log('=' .repeat(50))

  try {
    // 1. Obtener todos los scouts válidos
    console.log('\n📊 1. Scouts válidos en la base de datos:')
    const scouts = await prisma.scout.findMany({
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        surname: true,
        scout_level: true,
        nationality: true
      },
      orderBy: {
        scout_name: 'asc'
      }
    })

    console.log(`   Total: ${scouts.length} scouts`)
    scouts.forEach((scout, index) => {
      const displayName = scout.scout_name || `${scout.name} ${scout.surname}`.trim()
      console.log(`   ${index + 1}. ${displayName}`)
      console.log(`      ID: ${scout.id_scout}`)
      console.log(`      URL: /member/scout/${scout.id_scout}`)
      console.log(`      Level: ${scout.scout_level || 'N/A'}`)
      console.log(`      Nationality: ${scout.nationality || 'N/A'}`)
      console.log('')
    })

    // 2. Generar URLs de prueba
    console.log('\n🔗 2. URLs de prueba válidas:')
    scouts.slice(0, 3).forEach((scout, index) => {
      const displayName = scout.scout_name || `${scout.name} ${scout.surname}`.trim()
      console.log(`   ${index + 1}. ${displayName}:`)
      console.log(`      http://localhost:3000/member/scout/${scout.id_scout}`)
    })

    // 3. Verificar si hay scouts con IDs problemáticos
    console.log('\n🔍 3. Verificando IDs problemáticos:')
    const problematicIds = scouts.filter(scout => 
      scout.id_scout.includes(' ') || 
      scout.id_scout.includes('/') || 
      scout.id_scout.includes('?') ||
      scout.id_scout.length < 3
    )

    if (problematicIds.length > 0) {
      console.log(`   ⚠️  Encontrados ${problematicIds.length} IDs problemáticos:`)
      problematicIds.forEach(scout => {
        console.log(`      - "${scout.id_scout}" (${scout.scout_name})`)
      })
    } else {
      console.log('   ✅ Todos los IDs son válidos para URLs')
    }

    // 4. Crear datos de prueba adicionales si es necesario
    console.log('\n📝 4. Recomendaciones:')
    
    if (scouts.length < 5) {
      console.log('   💡 Tienes pocos scouts para pruebas. Considera ejecutar:')
      console.log('      npx tsx src/scripts/create-sample-scouts.ts')
    }

    console.log('\n✅ SOLUCIONES IMPLEMENTADAS:')
    console.log('   1. ✅ Mejorado manejo de errores en useScoutProfile')
    console.log('   2. ✅ Agregados logs detallados para debugging')
    console.log('   3. ✅ Creado componente ScoutNotFound')
    console.log('   4. ✅ Agregado toast de error informativo')

    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('   1. Usar uno de los IDs válidos listados arriba')
    console.log('   2. Verificar que el componente reciba el scoutId correcto')
    console.log('   3. Revisar los logs en la consola del navegador')
    console.log('   4. Si el problema persiste, verificar el routing de Next.js')

    // 5. Probar APIs
    console.log('\n🧪 5. Probando APIs rápidamente:')
    const testScout = scouts[0]
    if (testScout) {
      try {
        const response = await fetch(`http://localhost:3000/api/scouts/${testScout.id_scout}`)
        if (response.ok) {
          console.log(`   ✅ API funciona: /api/scouts/${testScout.id_scout}`)
        } else {
          console.log(`   ❌ API error: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.log(`   ⚠️  No se pudo probar API (servidor no corriendo?)`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  fixScoutRoutes()
}

export { fixScoutRoutes }