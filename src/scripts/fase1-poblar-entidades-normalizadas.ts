import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface PopulationStats {
  countries: number
  positions: number
  competitions: number
  teams: number
  agencies: number
  playersUpdated: number
  scoutsUpdated: number
}

async function poblarEntidadesNormalizadas(): Promise<PopulationStats> {
  console.log('🚀 FASE 1: Poblando Entidades Normalizadas')
  console.log('=' .repeat(60))

  const stats: PopulationStats = {
    countries: 0,
    positions: 0,
    competitions: 0,
    teams: 0,
    agencies: 0,
    playersUpdated: 0,
    scoutsUpdated: 0
  }

  try {
    // 1. POBLAR PAÍSES
    console.log('\n🌍 1. Poblando países...')
    
    // Extraer países únicos de jugadores y scouts
    const playerCountries = await prisma.jugador.findMany({
      select: { nationality_1: true, correct_nationality_1: true },
      where: {
        OR: [
          { nationality_1: { not: null } },
          { correct_nationality_1: { not: null } }
        ]
      }
    })

    const scoutCountries = await prisma.scout.findMany({
      select: { nationality: true, country: true },
      where: {
        OR: [
          { nationality: { not: null } },
          { country: { not: null } }
        ]
      }
    })

    // Crear set de países únicos
    const uniqueCountries = new Set<string>()
    
    playerCountries.forEach(p => {
      if (p.correct_nationality_1) uniqueCountries.add(p.correct_nationality_1)
      else if (p.nationality_1) uniqueCountries.add(p.nationality_1)
    })
    
    scoutCountries.forEach(s => {
      if (s.nationality) uniqueCountries.add(s.nationality)
      if (s.country) uniqueCountries.add(s.country)
    })

    // Mapeo de países a códigos y confederaciones
    const countryMapping: Record<string, { code: string; confederation: string }> = {
      'Spain': { code: 'ES', confederation: 'UEFA' },
      'Brazil': { code: 'BR', confederation: 'CONMEBOL' },
      'Argentina': { code: 'AR', confederation: 'CONMEBOL' },
      'France': { code: 'FR', confederation: 'UEFA' },
      'Italy': { code: 'IT', confederation: 'UEFA' },
      'Germany': { code: 'DE', confederation: 'UEFA' },
      'England': { code: 'GB', confederation: 'UEFA' },
      'Portugal': { code: 'PT', confederation: 'UEFA' },
      'Netherlands': { code: 'NL', confederation: 'UEFA' },
      'Mexico': { code: 'MX', confederation: 'CONCACAF' },
      'Colombia': { code: 'CO', confederation: 'CONMEBOL' },
      'Uruguay': { code: 'UY', confederation: 'CONMEBOL' },
      'Chile': { code: 'CL', confederation: 'CONMEBOL' },
      'Peru': { code: 'PE', confederation: 'CONMEBOL' },
      'Ecuador': { code: 'EC', confederation: 'CONMEBOL' },
      'Venezuela': { code: 'VE', confederation: 'CONMEBOL' },
      'United States': { code: 'US', confederation: 'CONCACAF' },
      'Canada': { code: 'CA', confederation: 'CONCACAF' }
    }

    for (const countryName of uniqueCountries) {
      if (countryName && countryName.trim()) {
        const mapping = countryMapping[countryName] || { 
          code: countryName.substring(0, 2).toUpperCase(), 
          confederation: 'OTHER' 
        }
        
        await prisma.country.upsert({
          where: { name: countryName },
          update: {},
          create: {
            name: countryName,
            code: mapping.code,
            confederation: mapping.confederation
          }
        })
        stats.countries++
      }
    }

    console.log(`   ✅ Creados ${stats.countries} países`)

    // 2. POBLAR POSICIONES
    console.log('\n⚽ 2. Poblando posiciones...')
    
    const playerPositions = await prisma.jugador.findMany({
      select: { position_player: true, correct_position_player: true },
      where: {
        OR: [
          { position_player: { not: null } },
          { correct_position_player: { not: null } }
        ]
      }
    })

    const uniquePositions = new Set<string>()
    playerPositions.forEach(p => {
      if (p.correct_position_player) uniquePositions.add(p.correct_position_player)
      else if (p.position_player) uniquePositions.add(p.position_player)
    })

    // Mapeo de posiciones
    const positionMapping: Record<string, { shortName: string; category: string }> = {
      'Goalkeeper': { shortName: 'GK', category: 'Goalkeeper' },
      'Centre-Back': { shortName: 'CB', category: 'Defender' },
      'Left-Back': { shortName: 'LB', category: 'Defender' },
      'Right-Back': { shortName: 'RB', category: 'Defender' },
      'Defender': { shortName: 'DEF', category: 'Defender' },
      'Defensive Midfielder': { shortName: 'CDM', category: 'Midfielder' },
      'Central Midfielder': { shortName: 'CM', category: 'Midfielder' },
      'Attacking Midfielder': { shortName: 'CAM', category: 'Midfielder' },
      'Left Midfielder': { shortName: 'LM', category: 'Midfielder' },
      'Right Midfielder': { shortName: 'RM', category: 'Midfielder' },
      'Midfielder': { shortName: 'MID', category: 'Midfielder' },
      'Left Winger': { shortName: 'LW', category: 'Forward' },
      'Right Winger': { shortName: 'RW', category: 'Forward' },
      'Centre-Forward': { shortName: 'CF', category: 'Forward' },
      'Striker': { shortName: 'ST', category: 'Forward' },
      'Forward': { shortName: 'FW', category: 'Forward' }
    }

    for (const positionName of uniquePositions) {
      if (positionName && positionName.trim()) {
        const mapping = positionMapping[positionName] || { 
          shortName: positionName.substring(0, 3).toUpperCase(), 
          category: 'Other' 
        }
        
        await prisma.position.upsert({
          where: { name: positionName },
          update: {},
          create: {
            name: positionName,
            short_name: mapping.shortName,
            category: mapping.category
          }
        })
        stats.positions++
      }
    }

    console.log(`   ✅ Creadas ${stats.positions} posiciones`)

    // 3. POBLAR COMPETICIONES
    console.log('\n🏆 3. Poblando competiciones...')
    
    const playerCompetitions = await prisma.jugador.findMany({
      select: { 
        team_competition: true, 
        competition_country: true,
        competition_tier: true,
        competition_confederation: true
      },
      where: {
        team_competition: { not: null }
      }
    })

    const uniqueCompetitions = new Map<string, any>()
    playerCompetitions.forEach(p => {
      if (p.team_competition) {
        const key = `${p.team_competition}-${p.competition_country || 'Unknown'}`
        if (!uniqueCompetitions.has(key)) {
          uniqueCompetitions.set(key, {
            name: p.team_competition,
            country: p.competition_country || 'Unknown',
            tier: parseInt(p.competition_tier || '1') || 1,
            confederation: p.competition_confederation || 'OTHER'
          })
        }
      }
    })

    for (const [_, comp] of uniqueCompetitions) {
      // Buscar el país
      const country = await prisma.country.findFirst({
        where: { name: comp.country }
      })

      if (country) {
        await prisma.competition.upsert({
          where: { name: comp.name },
          update: {},
          create: {
            name: comp.name,
            short_name: comp.name.length > 10 ? comp.name.substring(0, 10) : comp.name,
            country_id: country.id,
            tier: comp.tier,
            confederation: comp.confederation
          }
        })
        stats.competitions++
      }
    }

    console.log(`   ✅ Creadas ${stats.competitions} competiciones`)

    // 4. POBLAR EQUIPOS
    console.log('\n🏟️  4. Poblando equipos...')
    
    const playerTeams = await prisma.jugador.findMany({
      select: { 
        team_name: true, 
        correct_team_name: true,
        team_country: true,
        team_competition: true
      },
      where: {
        OR: [
          { team_name: { not: null } },
          { correct_team_name: { not: null } }
        ]
      }
    })

    const uniqueTeams = new Map<string, any>()
    playerTeams.forEach(p => {
      const teamName = p.correct_team_name || p.team_name
      if (teamName) {
        const key = `${teamName}-${p.team_country || 'Unknown'}`
        if (!uniqueTeams.has(key)) {
          uniqueTeams.set(key, {
            name: teamName,
            country: p.team_country || 'Unknown',
            competition: p.team_competition
          })
        }
      }
    })

    for (const [_, team] of uniqueTeams) {
      // Buscar el país
      const country = await prisma.country.findFirst({
        where: { name: team.country }
      })

      // Buscar la competición
      const competition = team.competition ? await prisma.competition.findFirst({
        where: { name: team.competition }
      }) : null

      if (country) {
        await prisma.team.upsert({
          where: { name: team.name },
          update: {},
          create: {
            name: team.name,
            short_name: team.name.length > 10 ? team.name.substring(0, 10) : team.name,
            country_id: country.id,
            competition_id: competition?.id
          }
        })
        stats.teams++
      }
    }

    console.log(`   ✅ Creados ${stats.teams} equipos`)

    // 5. POBLAR AGENCIAS
    console.log('\n🏢 5. Poblando agencias...')
    
    const playerAgencies = await prisma.jugador.findMany({
      select: { agency: true, correct_agency: true },
      where: {
        OR: [
          { agency: { not: null } },
          { correct_agency: { not: null } }
        ]
      }
    })

    const uniqueAgencies = new Set<string>()
    playerAgencies.forEach(p => {
      const agencyName = p.correct_agency || p.agency
      if (agencyName && agencyName.trim()) {
        uniqueAgencies.add(agencyName)
      }
    })

    for (const agencyName of uniqueAgencies) {
      await prisma.agency.upsert({
        where: { name: agencyName },
        update: {},
        create: {
          name: agencyName
        }
      })
      stats.agencies++
    }

    console.log(`   ✅ Creadas ${stats.agencies} agencias`)

    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMEN DE POBLACIÓN:')
    console.log(`   🌍 Países: ${stats.countries}`)
    console.log(`   ⚽ Posiciones: ${stats.positions}`)
    console.log(`   🏆 Competiciones: ${stats.competitions}`)
    console.log(`   🏟️  Equipos: ${stats.teams}`)
    console.log(`   🏢 Agencias: ${stats.agencies}`)
    console.log('\n✅ Fase 1 completada exitosamente!')

    return stats

  } catch (error) {
    console.error('❌ Error en la población:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  poblarEntidadesNormalizadas()
    .then(stats => {
      console.log('\n🎉 Población completada:', stats)
    })
    .catch(error => {
      console.error('💥 Error:', error)
      process.exit(1)
    })
}

export { poblarEntidadesNormalizadas }