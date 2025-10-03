import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verificarNormalizacion() {
  console.log('🔍 VERIFICACIÓN FASE 1: Normalización de Entidades')
  console.log('=' .repeat(60))

  try {
    // 1. VERIFICAR ENTIDADES CREADAS
    console.log('\n📊 1. Verificando entidades creadas...')
    
    const countries = await prisma.country.count()
    const positions = await prisma.position.count()
    const competitions = await prisma.competition.count()
    const teams = await prisma.team.count()
    const agencies = await prisma.agency.count()

    console.log(`   🌍 Países: ${countries}`)
    console.log(`   ⚽ Posiciones: ${positions}`)
    console.log(`   🏆 Competiciones: ${competitions}`)
    console.log(`   🏟️  Equipos: ${teams}`)
    console.log(`   🏢 Agencias: ${agencies}`)

    // 2. VERIFICAR RELACIONES DE JUGADORES
    console.log('\n🏃 2. Verificando relaciones de jugadores...')
    
    const playersWithRelations = await prisma.jugador.findMany({
      include: {
        team: true,
        position: true,
        nationality: true,
        agencyRelation: true
      },
      take: 3
    })

    console.log(`   📋 Muestra de ${playersWithRelations.length} jugadores:`)
    playersWithRelations.forEach((player, index) => {
      console.log(`   ${index + 1}. ${player.player_name}`)
      console.log(`      - Equipo: ${player.team?.name || 'Sin vincular'} (${player.team_name})`)
      console.log(`      - Posición: ${player.position?.name || 'Sin vincular'} (${player.position_player})`)
      console.log(`      - Nacionalidad: ${player.nationality?.name || 'Sin vincular'} (${player.nationality_1})`)
      console.log(`      - Agencia: ${player.agencyRelation?.name || 'Sin vincular'} (${player.agency || 'N/A'})`)
    })

    // 3. VERIFICAR RELACIONES DE SCOUTS
    console.log('\n🔍 3. Verificando relaciones de scouts...')
    
    const scoutsWithRelations = await prisma.scout.findMany({
      include: {
        nationalityCountry: true
      },
      take: 3
    })

    console.log(`   📋 Muestra de ${scoutsWithRelations.length} scouts:`)
    scoutsWithRelations.forEach((scout, index) => {
      console.log(`   ${index + 1}. ${scout.scout_name || scout.name}`)
      console.log(`      - Nacionalidad: ${scout.nationalityCountry?.name || 'Sin vincular'} (${scout.nationality})`)
    })

    // 4. VERIFICAR INTEGRIDAD DE DATOS
    console.log('\n🔍 4. Verificando integridad de datos...')
    
    const playersWithTeamId = await prisma.jugador.count({
      where: { team_id: { not: null } }
    })
    
    const playersWithPositionId = await prisma.jugador.count({
      where: { position_id: { not: null } }
    })
    
    const playersWithNationalityId = await prisma.jugador.count({
      where: { nationality_id: { not: null } }
    })

    const totalPlayers = await prisma.jugador.count()

    console.log(`   📊 De ${totalPlayers} jugadores:`)
    console.log(`      - ${playersWithTeamId} tienen equipo vinculado (${((playersWithTeamId/totalPlayers)*100).toFixed(1)}%)`)
    console.log(`      - ${playersWithPositionId} tienen posición vinculada (${((playersWithPositionId/totalPlayers)*100).toFixed(1)}%)`)
    console.log(`      - ${playersWithNationalityId} tienen nacionalidad vinculada (${((playersWithNationalityId/totalPlayers)*100).toFixed(1)}%)`)

    // 5. PROBAR CONSULTAS OPTIMIZADAS
    console.log('\n🚀 5. Probando consultas optimizadas...')
    
    // Consulta por equipo (ahora con JOIN en lugar de LIKE)
    const playersInTeam = await prisma.jugador.findMany({
      where: {
        team: {
          name: { contains: 'Real' }
        }
      },
      include: {
        team: true,
        position: true
      },
      take: 2
    })

    console.log(`   🔍 Jugadores en equipos con "Real": ${playersInTeam.length}`)
    playersInTeam.forEach(p => {
      console.log(`      - ${p.player_name} (${p.team?.name}, ${p.position?.name})`)
    })

    // Consulta por posición
    const midfielders = await prisma.jugador.findMany({
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

    console.log(`   ⚽ Centrocampistas encontrados: ${midfielders.length}`)
    midfielders.forEach(p => {
      console.log(`      - ${p.player_name} (${p.position?.name}, ${p.team?.name})`)
    })

    // Consulta por país
    const spanishPlayers = await prisma.jugador.findMany({
      where: {
        nationality: {
          name: 'Spain'
        }
      },
      include: {
        nationality: true,
        team: true
      }
    })

    console.log(`   🇪🇸 Jugadores españoles: ${spanishPlayers.length}`)
    spanishPlayers.forEach(p => {
      console.log(`      - ${p.player_name} (${p.team?.name})`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('✅ VERIFICACIÓN COMPLETADA')
    console.log('\n💡 BENEFICIOS OBTENIDOS:')
    console.log('   🎯 Consultas más precisas (JOIN vs LIKE)')
    console.log('   🚀 Mejor rendimiento en búsquedas')
    console.log('   🔗 Integridad referencial garantizada')
    console.log('   📊 Estadísticas por entidad posibles')
    console.log('   🧹 Datos más limpios y consistentes')

  } catch (error) {
    console.error('❌ Error en la verificación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verificarNormalizacion()
}

export { verificarNormalizacion }