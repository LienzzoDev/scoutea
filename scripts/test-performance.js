// 🚀 SCRIPT DE PRUEBA DE PERFORMANCE
// ✅ PROPÓSITO: Verificar que las optimizaciones de BD están funcionando
// ✅ BENEFICIO: Medir el impacto real de los índices creados

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPerformance() {
  console.log('🚀 Iniciando pruebas de performance...')
  console.log('=' .repeat(50))
  
  try {
    // 📊 OBTENER INFORMACIÓN BÁSICA
    const totalPlayers = await prisma.jugador.count()
    console.log(`📋 Total de jugadores en BD: ${totalPlayers.toLocaleString()}`)
    console.log('')

    // 🔍 TEST 1: Búsqueda por nombre (idx_player_search_composite)
    console.log('🔍 TEST 1: Búsqueda por nombre...')
    const start1 = Date.now()
    const nameResults = await prisma.jugador.findMany({
      where: { 
        player_name: { contains: 'a', mode: 'insensitive' } 
      },
      take: 20
    })
    const time1 = Date.now() - start1
    console.log(`   ✅ Encontrados: ${nameResults.length} jugadores`)
    console.log(`   ⏱️  Tiempo: ${time1}ms`)
    console.log(`   📊 Performance: ${time1 < 100 ? '🟢 Excelente' : time1 < 500 ? '🟡 Buena' : '🔴 Necesita mejora'}`)
    console.log('')

    // 🎯 TEST 2: Búsqueda por posición (idx_player_analytics)
    console.log('🎯 TEST 2: Búsqueda por posición...')
    const start2 = Date.now()
    const positionResults = await prisma.jugador.findMany({
      where: { position_player: 'CF' },
      take: 20
    })
    const time2 = Date.now() - start2
    console.log(`   ✅ Encontrados: ${positionResults.length} delanteros`)
    console.log(`   ⏱️  Tiempo: ${time2}ms`)
    console.log(`   📊 Performance: ${time2 < 50 ? '🟢 Excelente' : time2 < 200 ? '🟡 Buena' : '🔴 Necesita mejora'}`)
    console.log('')

    // ⭐ TEST 3: Ordenamiento por rating (idx_player_rating_created)
    console.log('⭐ TEST 3: Ordenamiento por rating...')
    const start3 = Date.now()
    const ratingResults = await prisma.jugador.findMany({
      where: { player_rating: { gte: 80 } },
      orderBy: { player_rating: 'desc' },
      take: 20
    })
    const time3 = Date.now() - start3
    console.log(`   ✅ Encontrados: ${ratingResults.length} jugadores top`)
    console.log(`   ⏱️  Tiempo: ${time3}ms`)
    console.log(`   📊 Performance: ${time3 < 100 ? '🟢 Excelente' : time3 < 300 ? '🟡 Buena' : '🔴 Necesita mejora'}`)
    console.log('')

    // 🚀 TEST 4: Búsqueda compuesta compleja (múltiples índices)
    console.log('🚀 TEST 4: Búsqueda compuesta compleja...')
    const start4 = Date.now()
    const compositeResults = await prisma.jugador.findMany({
      where: {
        position_player: 'CF',
        age: { gte: 20, lte: 25 },
        player_rating: { gte: 75 },
        nationality_1: { not: null }
      },
      orderBy: [
        { player_rating: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 20
    })
    const time4 = Date.now() - start4
    console.log(`   ✅ Encontrados: ${compositeResults.length} jugadores jóvenes prometedores`)
    console.log(`   ⏱️  Tiempo: ${time4}ms`)
    console.log(`   📊 Performance: ${time4 < 150 ? '🟢 Excelente' : time4 < 400 ? '🟡 Buena' : '🔴 Necesita mejora'}`)
    console.log('')

    // 📊 TEST 5: Agregaciones para estadísticas (múltiples índices)
    console.log('📊 TEST 5: Agregaciones para estadísticas...')
    const start5 = Date.now()
    const [positionStats, nationalityStats] = await Promise.all([
      prisma.jugador.groupBy({
        by: ['position_player'],
        _count: { position_player: true },
        where: { position_player: { not: null } },
        orderBy: { _count: { position_player: 'desc' } },
        take: 10
      }),
      prisma.jugador.groupBy({
        by: ['nationality_1'],
        _count: { nationality_1: true },
        where: { nationality_1: { not: null } },
        orderBy: { _count: { nationality_1: 'desc' } },
        take: 10
      })
    ])
    const time5 = Date.now() - start5
    console.log(`   ✅ Posiciones analizadas: ${positionStats.length}`)
    console.log(`   ✅ Nacionalidades analizadas: ${nationalityStats.length}`)
    console.log(`   ⏱️  Tiempo: ${time5}ms`)
    console.log(`   📊 Performance: ${time5 < 200 ? '🟢 Excelente' : time5 < 500 ? '🟡 Buena' : '🔴 Necesita mejora'}`)
    console.log('')

    // 🏆 RESUMEN FINAL
    console.log('🏆 RESUMEN DE PERFORMANCE')
    console.log('=' .repeat(50))
    
    const avgTime = (time1 + time2 + time3 + time4 + time5) / 5
    const totalTime = time1 + time2 + time3 + time4 + time5
    
    console.log(`📊 Tiempo promedio por consulta: ${avgTime.toFixed(1)}ms`)
    console.log(`⏱️  Tiempo total de todas las pruebas: ${totalTime}ms`)
    console.log(`📈 Consultas por segundo estimadas: ${Math.round(1000 / avgTime)}`)
    console.log('')
    
    // 🎯 EVALUACIÓN GENERAL
    if (avgTime < 100) {
      console.log('🟢 EVALUACIÓN: EXCELENTE - Los índices están funcionando perfectamente')
    } else if (avgTime < 250) {
      console.log('🟡 EVALUACIÓN: BUENA - Performance aceptable, posibles mejoras menores')
    } else {
      console.log('🔴 EVALUACIÓN: NECESITA MEJORA - Considerar optimizaciones adicionales')
    }
    
    console.log('')
    console.log('💡 RECOMENDACIONES:')
    if (time1 > 200) console.log('   - Considerar índice de texto completo para búsquedas por nombre')
    if (time3 > 200) console.log('   - Verificar que el índice de rating esté siendo usado correctamente')
    if (time4 > 300) console.log('   - Las consultas compuestas pueden beneficiarse de índices adicionales')
    if (time5 > 400) console.log('   - Las agregaciones pueden necesitar índices específicos')
    
    if (avgTime < 100) {
      console.log('   ✅ ¡Todas las consultas están bien optimizadas!')
    }

  } catch (error) {
    console.error('❌ Error durante las pruebas de performance:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 🚀 EJECUTAR PRUEBAS
testPerformance()
  .then(() => {
    console.log('')
    console.log('🎉 Pruebas de performance completadas.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal en pruebas:', error)
    process.exit(1)
  })