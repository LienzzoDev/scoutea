import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TableStats {
  name: string
  count: number
  hasData: boolean
  lastUpdated?: Date
  sampleRecord?: any
}

async function databaseHealthCheck() {
  console.log('🔍 Database Health Check - ScoutEA\n')
  console.log('=' .repeat(60))

  try {
    const stats: TableStats[] = []

    // 1. USUARIOS Y AUTENTICACIÓN
    console.log('\n👥 USUARIOS Y AUTENTICACIÓN')
    console.log('-'.repeat(40))
    
    const usuarioCount = await prisma.usuario.count()
    const sampleUsuario = await prisma.usuario.findFirst()
    stats.push({
      name: 'Usuario',
      count: usuarioCount,
      hasData: usuarioCount > 0,
      lastUpdated: sampleUsuario?.updatedAt,
      sampleRecord: sampleUsuario ? {
        email: sampleUsuario.email,
        profileCompleted: sampleUsuario.profileCompleted
      } : null
    })
    console.log(`📊 Usuarios: ${usuarioCount} registros`)

    // 2. ENTIDADES DEPORTIVAS PRINCIPALES
    console.log('\n⚽ ENTIDADES DEPORTIVAS')
    console.log('-'.repeat(40))
    
    const jugadorCount = await prisma.jugador.count()
    const sampleJugador = await prisma.jugador.findFirst()
    stats.push({
      name: 'Jugador',
      count: jugadorCount,
      hasData: jugadorCount > 0,
      lastUpdated: sampleJugador?.updatedAt,
      sampleRecord: sampleJugador ? {
        name: sampleJugador.player_name,
        position: sampleJugador.position_player,
        team: sampleJugador.team_name,
        rating: sampleJugador.player_rating
      } : null
    })
    console.log(`🏃 Jugadores: ${jugadorCount} registros`)

    const scoutCount = await prisma.scout.count()
    const sampleScout = await prisma.scout.findFirst()
    stats.push({
      name: 'Scout',
      count: scoutCount,
      hasData: scoutCount > 0,
      lastUpdated: sampleScout?.updatedAt,
      sampleRecord: sampleScout ? {
        name: sampleScout.scout_name || sampleScout.name,
        level: sampleScout.scout_level,
        reports: sampleScout.total_reports,
        elo: sampleScout.scout_elo
      } : null
    })
    console.log(`🔍 Scouts: ${scoutCount} registros`)

    const equipoCount = await prisma.equipo.count()
    stats.push({ name: 'Equipo', count: equipoCount, hasData: equipoCount > 0 })
    console.log(`🏟️  Equipos: ${equipoCount} registros`)

    const competitionCount = await prisma.competition.count()
    stats.push({ name: 'Competition', count: competitionCount, hasData: competitionCount > 0 })
    console.log(`🏆 Competitions: ${competitionCount} registros`)

    // 3. REPORTES Y ANÁLISIS
    console.log('\n📋 REPORTES Y ANÁLISIS')
    console.log('-'.repeat(40))
    
    const reporteCount = await prisma.reporte.count()
    const reporteWithScout = await prisma.reporte.count({ where: { scout_id: { not: null } } })
    const reporteWithPlayer = await prisma.reporte.count({ where: { id_player: { not: null } } })
    const sampleReporte = await prisma.reporte.findFirst()
    
    stats.push({
      name: 'Reporte',
      count: reporteCount,
      hasData: reporteCount > 0,
      lastUpdated: sampleReporte?.updatedAt,
      sampleRecord: sampleReporte ? {
        type: sampleReporte.report_type,
        status: sampleReporte.report_status,
        hasScout: !!sampleReporte.scout_id,
        hasPlayer: !!sampleReporte.id_player,
        roi: sampleReporte.roi
      } : null
    })
    console.log(`📄 Reportes: ${reporteCount} registros`)
    console.log(`   └─ Con Scout: ${reporteWithScout} (${((reporteWithScout/reporteCount)*100).toFixed(1)}%)`)
    console.log(`   └─ Con Jugador: ${reporteWithPlayer} (${((reporteWithPlayer/reporteCount)*100).toFixed(1)}%)`)

    const scoutPlayerReportCount = await prisma.scoutPlayerReport.count()
    stats.push({ name: 'ScoutPlayerReport', count: scoutPlayerReportCount, hasData: scoutPlayerReportCount > 0 })
    console.log(`🔗 Relaciones Scout-Player: ${scoutPlayerReportCount} registros`)

    // 4. MÉTRICAS Y ESTADÍSTICAS
    console.log('\n📈 MÉTRICAS Y ESTADÍSTICAS')
    console.log('-'.repeat(40))
    
    const playerStats3mCount = await prisma.playerStats3m.count()
    stats.push({ name: 'PlayerStats3m', count: playerStats3mCount, hasData: playerStats3mCount > 0 })
    console.log(`📊 Estadísticas 3m: ${playerStats3mCount} registros`)

    const radarMetricsCount = await prisma.radarMetrics.count()
    stats.push({ name: 'RadarMetrics', count: radarMetricsCount, hasData: radarMetricsCount > 0 })
    console.log(`🎯 Métricas Radar: ${radarMetricsCount} registros`)

    const atributosCount = await prisma.atributos.count()
    stats.push({ name: 'Atributos', count: atributosCount, hasData: atributosCount > 0 })
    console.log(`⚡ Atributos: ${atributosCount} registros`)

    // 5. LISTAS DE USUARIOS
    console.log('\n📝 LISTAS DE USUARIOS')
    console.log('-'.repeat(40))
    
    const playerListCount = await prisma.playerList.count()
    stats.push({ name: 'PlayerList', count: playerListCount, hasData: playerListCount > 0 })
    console.log(`⭐ Listas de Jugadores: ${playerListCount} registros`)

    const scoutListCount = await prisma.scoutList.count()
    stats.push({ name: 'ScoutList', count: scoutListCount, hasData: scoutListCount > 0 })
    console.log(`⭐ Listas de Scouts: ${scoutListCount} registros`)

    // 6. FUNCIONALIDADES ADICIONALES
    console.log('\n🔧 FUNCIONALIDADES ADICIONALES')
    console.log('-'.repeat(40))
    
    const torneoCount = await prisma.torneo.count()
    stats.push({ name: 'Torneo', count: torneoCount, hasData: torneoCount > 0 })
    console.log(`🏆 Torneos: ${torneoCount} registros`)

    const onDemandMessageCount = await prisma.onDemandMessage.count()
    stats.push({ name: 'OnDemandMessage', count: onDemandMessageCount, hasData: onDemandMessageCount > 0 })
    console.log(`💬 Mensajes On-Demand: ${onDemandMessageCount} registros`)

    const dataPopulationLogCount = await prisma.dataPopulationLog.count()
    stats.push({ name: 'DataPopulationLog', count: dataPopulationLogCount, hasData: dataPopulationLogCount > 0 })
    console.log(`📝 Logs de Población: ${dataPopulationLogCount} registros`)

    // RESUMEN FINAL
    console.log('\n' + '='.repeat(60))
    console.log('📋 RESUMEN DEL ESTADO')
    console.log('='.repeat(60))

    const totalTables = stats.length
    const tablesWithData = stats.filter(s => s.hasData).length
    const totalRecords = stats.reduce((sum, s) => sum + s.count, 0)

    console.log(`📊 Total de tablas: ${totalTables}`)
    console.log(`✅ Tablas con datos: ${tablesWithData} (${((tablesWithData/totalTables)*100).toFixed(1)}%)`)
    console.log(`📈 Total de registros: ${totalRecords.toLocaleString()}`)

    // Tablas principales
    const mainTables = ['Jugador', 'Scout', 'Reporte', 'Usuario']
    console.log('\n🎯 ESTADO DE TABLAS PRINCIPALES:')
    mainTables.forEach(tableName => {
      const table = stats.find(s => s.name === tableName)
      if (table) {
        const status = table.hasData ? '✅' : '❌'
        console.log(`   ${status} ${tableName}: ${table.count} registros`)
      }
    })

    // Verificar relaciones
    console.log('\n🔗 VERIFICACIÓN DE RELACIONES:')
    if (reporteCount > 0) {
      const relationIntegrity = ((reporteWithScout / reporteCount) * 100).toFixed(1)
      console.log(`   📊 Integridad Scout-Reporte: ${relationIntegrity}%`)
      
      if (scoutPlayerReportCount > 0) {
        console.log(`   ✅ Nueva tabla de relaciones: Implementada`)
      } else {
        console.log(`   ⚠️  Nueva tabla de relaciones: Sin datos`)
      }
    }

    // Recomendaciones
    console.log('\n💡 RECOMENDACIONES:')
    if (tablesWithData < totalTables) {
      console.log(`   📝 ${totalTables - tablesWithData} tablas sin datos - considerar si son necesarias`)
    }
    if (reporteWithScout < reporteCount) {
      console.log(`   🔧 ${reporteCount - reporteWithScout} reportes sin scout_id - migrar datos`)
    }
    if (scoutPlayerReportCount === 0 && reporteCount > 0) {
      console.log(`   🚀 Ejecutar migración de relaciones scout-player`)
    }

    console.log('\n✅ Health Check completado!')

  } catch (error) {
    console.error('❌ Error en health check:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  databaseHealthCheck()
}

export { databaseHealthCheck }