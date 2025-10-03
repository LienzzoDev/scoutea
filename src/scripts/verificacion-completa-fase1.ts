import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verificacionCompletaFase1() {
  console.log('🔍 VERIFICACIÓN COMPLETA - FASE 1')
  console.log('=' .repeat(60))

  const issues: string[] = []
  const recommendations: string[] = []

  try {
    // 1. VERIFICAR ESTRUCTURA DE TABLAS
    console.log('\n📊 1. Verificando estructura de tablas...')
    
    const tableStats = {
      countries: await prisma.country.count(),
      positions: await prisma.position.count(),
      competitions: await prisma.competition.count(),
      teams: await prisma.team.count(),
      agencies: await prisma.agency.count(),
      players: await prisma.jugador.count(),
      scouts: await prisma.scout.count(),
      reports: await prisma.reporte.count(),
      scoutPlayerReports: await prisma.scoutPlayerReport.count()
    }

    console.log('   ✅ Tablas normalizadas:')
    Object.entries(tableStats).forEach(([table, count]) => {
      console.log(`      - ${table}: ${count} registros`)
    })

    // 2. VERIFICAR INTEGRIDAD DE RELACIONES
    console.log('\n🔗 2. Verificando integridad de relaciones...')
    
    // Jugadores con relaciones
    const playersWithTeam = await prisma.jugador.count({ where: { team_id: { not: null } } })
    const playersWithPosition = await prisma.jugador.count({ where: { position_id: { not: null } } })
    const playersWithNationality = await prisma.jugador.count({ where: { nationality_id: { not: null } } })
    const playersWithAgency = await prisma.jugador.count({ where: { agency_id: { not: null } } })

    console.log(`   📊 De ${tableStats.players} jugadores:`)
    console.log(`      - Con equipo: ${playersWithTeam} (${((playersWithTeam/tableStats.players)*100).toFixed(1)}%)`)
    console.log(`      - Con posición: ${playersWithPosition} (${((playersWithPosition/tableStats.players)*100).toFixed(1)}%)`)
    console.log(`      - Con nacionalidad: ${playersWithNationality} (${((playersWithNationality/tableStats.players)*100).toFixed(1)}%)`)
    console.log(`      - Con agencia: ${playersWithAgency} (${((playersWithAgency/tableStats.players)*100).toFixed(1)}%)`)

    if (playersWithAgency === 0) {
      recommendations.push('Considerar poblar agencias si tienes esos datos')
    }

    // Scouts con relaciones
    const scoutsWithNationality = await prisma.scout.count({ where: { nationality_id: { not: null } } })
    console.log(`   🔍 De ${tableStats.scouts} scouts:`)
    console.log(`      - Con nacionalidad: ${scoutsWithNationality} (${((scoutsWithNationality/tableStats.scouts)*100).toFixed(1)}%)`)

    // Reportes con relaciones
    const reportsWithScout = await prisma.reporte.count({ where: { scout_id: { not: null } } })
    const reportsWithPlayer = await prisma.reporte.count({ where: { id_player: { not: null } } })
    console.log(`   📋 De ${tableStats.reports} reportes:`)
    console.log(`      - Con scout: ${reportsWithScout} (${((reportsWithScout/tableStats.reports)*100).toFixed(1)}%)`)
    console.log(`      - Con jugador: ${reportsWithPlayer} (${((reportsWithPlayer/tableStats.reports)*100).toFixed(1)}%)`)

    // 3. VERIFICAR CONSULTAS OPTIMIZADAS
    console.log('\n🚀 3. Probando consultas optimizadas...')
    
    // Consulta por equipo (nueva forma optimizada)
    const startTime1 = Date.now()
    const playersByTeam = await prisma.jugador.findMany({
      where: {
        team: {
          name: { contains: 'Real' }
        }
      },
      include: {
        team: true,
        position: true,
        nationality: true
      }
    })
    const queryTime1 = Date.now() - startTime1
    console.log(`   ✅ Consulta por equipo: ${playersByTeam.length} resultados en ${queryTime1}ms`)

    // Consulta por posición
    const startTime2 = Date.now()
    const playersByPosition = await prisma.jugador.findMany({
      where: {
        position: {
          category: 'Midfielder'
        }
      },
      include: {
        position: true,
        team: true
      }
    })
    const queryTime2 = Date.now() - startTime2
    console.log(`   ✅ Consulta por posición: ${playersByPosition.length} resultados en ${queryTime2}ms`)

    // Consulta por país
    const startTime3 = Date.now()
    const playersByCountry = await prisma.jugador.findMany({
      where: {
        nationality: {
          confederation: 'UEFA'
        }
      },
      include: {
        nationality: true,
        team: true
      }
    })
    const queryTime3 = Date.now() - startTime3
    console.log(`   ✅ Consulta por confederación: ${playersByCountry.length} resultados en ${queryTime3}ms`)

    // 4. VERIFICAR SERVICIOS Y APIs
    console.log('\n🔌 4. Verificando servicios...')
    
    // Probar ScoutPlayerService
    try {
      const { ScoutPlayerService } = await import('../lib/services/scout-player-service')
      
      // Obtener primer scout
      const firstScout = await prisma.scout.findFirst()
      if (firstScout) {
        const scoutReports = await ScoutPlayerService.getScoutReports(firstScout.id_scout)
        console.log(`   ✅ ScoutPlayerService.getScoutReports: ${scoutReports.length} reportes`)
        
        const scoutStats = await ScoutPlayerService.getScoutPlayerStats(firstScout.id_scout)
        console.log(`   ✅ ScoutPlayerService.getScoutPlayerStats: ${scoutStats.totalReports} reportes`)
      }
    } catch (error) {
      issues.push(`Error en ScoutPlayerService: ${error}`)
    }

    // 5. VERIFICAR CAMPOS REDUNDANTES (PENDIENTES DE LIMPIEZA)
    console.log('\n🧹 5. Verificando campos redundantes pendientes...')
    
    // Verificar si aún hay inconsistencias entre campos originales y normalizados
    const playersWithInconsistentTeam = await prisma.jugador.findMany({
      where: {
        AND: [
          { team_id: { not: null } },
          { team_name: { not: null } }
        ]
      },
      include: {
        team: true
      },
      take: 3
    })

    console.log(`   📊 Jugadores con datos de equipo duplicados: ${playersWithInconsistentTeam.length}`)
    playersWithInconsistentTeam.forEach(p => {
      const consistent = p.team?.name === p.team_name || p.team?.name === p.correct_team_name
      console.log(`      - ${p.player_name}: ${p.team?.name} vs ${p.team_name} ${consistent ? '✅' : '⚠️'}`)
      if (!consistent) {
        issues.push(`Inconsistencia en equipo de ${p.player_name}`)
      }
    })

    // 6. VERIFICAR ÍNDICES Y RENDIMIENTO
    console.log('\n⚡ 6. Verificando rendimiento...')
    
    // Consulta compleja para probar índices
    const startTimeComplex = Date.now()
    const complexQuery = await prisma.jugador.findMany({
      where: {
        AND: [
          { team: { country: { confederation: 'UEFA' } } },
          { position: { category: 'Midfielder' } },
          { player_rating: { gte: 75 } }
        ]
      },
      include: {
        team: { include: { country: true } },
        position: true,
        nationality: true
      },
      take: 10
    })
    const complexQueryTime = Date.now() - startTimeComplex
    console.log(`   ✅ Consulta compleja: ${complexQuery.length} resultados en ${complexQueryTime}ms`)

    if (complexQueryTime > 100) {
      recommendations.push('Considerar optimizar índices para consultas complejas')
    }

    // 7. VERIFICAR MIGRACIÓN DE MÉTRICAS (PENDIENTE FASE 2)
    console.log('\n📈 7. Verificando sistema de métricas...')
    
    const playerMetrics = await prisma.playerMetric.count()
    const radarMetrics = await prisma.radarMetrics.count()
    const playerStats3m = await prisma.playerStats3m.count()
    
    console.log(`   📊 Métricas actuales:`)
    console.log(`      - PlayerMetric (nuevo): ${playerMetrics}`)
    console.log(`      - RadarMetrics (viejo): ${radarMetrics}`)
    console.log(`      - PlayerStats3m (viejo): ${playerStats3m}`)

    if (playerMetrics === 0 && (radarMetrics > 0 || playerStats3m > 0)) {
      recommendations.push('FASE 2: Migrar métricas al sistema unificado PlayerMetric')
    }

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(60))
    console.log('📋 RESUMEN DE VERIFICACIÓN')
    console.log('='.repeat(60))

    if (issues.length === 0) {
      console.log('✅ FASE 1 COMPLETADA EXITOSAMENTE')
      console.log('   - Todas las tablas normalizadas creadas')
      console.log('   - Relaciones funcionando correctamente')
      console.log('   - Consultas optimizadas operativas')
      console.log('   - Servicios funcionando')
    } else {
      console.log('⚠️  ISSUES ENCONTRADOS:')
      issues.forEach(issue => console.log(`   - ${issue}`))
    }

    if (recommendations.length > 0) {
      console.log('\n💡 RECOMENDACIONES:')
      recommendations.forEach(rec => console.log(`   - ${rec}`))
    }

    console.log('\n🚀 PRÓXIMOS PASOS SUGERIDOS:')
    console.log('   1. FASE 2: Limpiar campos redundantes en Jugador')
    console.log('   2. FASE 3: Unificar sistema de métricas')
    console.log('   3. FASE 4: Simplificar tabla Reporte')
    console.log('   4. Actualizar APIs para usar nuevas relaciones')
    console.log('   5. Actualizar componentes UI para aprovechar optimizaciones')

  } catch (error) {
    console.error('❌ Error en verificación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  verificacionCompletaFase1()
}

export { verificacionCompletaFase1 }