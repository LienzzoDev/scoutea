import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface VinculationStats {
  playersProcessed: number
  playersWithTeam: number
  playersWithPosition: number
  playersWithNationality: number
  playersWithAgency: number
  scoutsProcessed: number
  scoutsWithNationality: number
}

async function vincularJugadores(): Promise<VinculationStats> {
  console.log('🔗 FASE 1B: Vinculando Jugadores con Entidades Normalizadas')
  console.log('=' .repeat(60))

  const stats: VinculationStats = {
    playersProcessed: 0,
    playersWithTeam: 0,
    playersWithPosition: 0,
    playersWithNationality: 0,
    playersWithAgency: 0,
    scoutsProcessed: 0,
    scoutsWithNationality: 0
  }

  try {
    // 1. VINCULAR JUGADORES
    console.log('\n🏃 1. Vinculando jugadores...')
    
    const jugadores = await prisma.jugador.findMany({
      select: {
        id_player: true,
        team_name: true,
        correct_team_name: true,
        position_player: true,
        correct_position_player: true,
        nationality_1: true,
        correct_nationality_1: true,
        agency: true,
        correct_agency: true
      }
    })

    for (const jugador of jugadores) {
      const updates: any = {}
      
      // Vincular equipo
      const teamName = jugador.correct_team_name || jugador.team_name
      if (teamName) {
        const team = await prisma.team.findFirst({
          where: { name: teamName }
        })
        if (team) {
          updates.team_id = team.id
          stats.playersWithTeam++
        }
      }

      // Vincular posición
      const positionName = jugador.correct_position_player || jugador.position_player
      if (positionName) {
        const position = await prisma.position.findFirst({
          where: { name: positionName }
        })
        if (position) {
          updates.position_id = position.id
          stats.playersWithPosition++
        }
      }

      // Vincular nacionalidad
      const nationalityName = jugador.correct_nationality_1 || jugador.nationality_1
      if (nationalityName) {
        const country = await prisma.country.findFirst({
          where: { name: nationalityName }
        })
        if (country) {
          updates.nationality_id = country.id
          stats.playersWithNationality++
        }
      }

      // Vincular agencia
      const agencyName = jugador.correct_agency || jugador.agency
      if (agencyName) {
        const agency = await prisma.agency.findFirst({
          where: { name: agencyName }
        })
        if (agency) {
          updates.agency_id = agency.id
          stats.playersWithAgency++
        }
      }

      // Actualizar jugador si hay cambios
      if (Object.keys(updates).length > 0) {
        await prisma.jugador.update({
          where: { id_player: jugador.id_player },
          data: updates
        })
      }

      stats.playersProcessed++
    }

    console.log(`   ✅ Procesados ${stats.playersProcessed} jugadores`)
    console.log(`      - Con equipo: ${stats.playersWithTeam}`)
    console.log(`      - Con posición: ${stats.playersWithPosition}`)
    console.log(`      - Con nacionalidad: ${stats.playersWithNationality}`)
    console.log(`      - Con agencia: ${stats.playersWithAgency}`)

    // 2. VINCULAR SCOUTS
    console.log('\n🔍 2. Vinculando scouts...')
    
    const scouts = await prisma.scout.findMany({
      select: {
        id_scout: true,
        nationality: true,
        country: true
      }
    })

    for (const scout of scouts) {
      const nationalityName = scout.nationality || scout.country
      if (nationalityName) {
        const country = await prisma.country.findFirst({
          where: { name: nationalityName }
        })
        if (country) {
          await prisma.scout.update({
            where: { id_scout: scout.id_scout },
            data: { nationality_id: country.id }
          })
          stats.scoutsWithNationality++
        }
      }
      stats.scoutsProcessed++
    }

    console.log(`   ✅ Procesados ${stats.scoutsProcessed} scouts`)
    console.log(`      - Con nacionalidad: ${stats.scoutsWithNationality}`)

    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMEN DE VINCULACIÓN:')
    console.log(`   🏃 Jugadores procesados: ${stats.playersProcessed}`)
    console.log(`      - Vinculados a equipos: ${stats.playersWithTeam}`)
    console.log(`      - Vinculados a posiciones: ${stats.playersWithPosition}`)
    console.log(`      - Vinculados a países: ${stats.playersWithNationality}`)
    console.log(`      - Vinculados a agencias: ${stats.playersWithAgency}`)
    console.log(`   🔍 Scouts procesados: ${stats.scoutsProcessed}`)
    console.log(`      - Vinculados a países: ${stats.scoutsWithNationality}`)
    console.log('\n✅ Vinculación completada exitosamente!')

    return stats

  } catch (error) {
    console.error('❌ Error en la vinculación:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  vincularJugadores()
    .then(stats => {
      console.log('\n🎉 Vinculación completada:', stats)
    })
    .catch(error => {
      console.error('💥 Error:', error)
      process.exit(1)
    })
}

export { vincularJugadores }