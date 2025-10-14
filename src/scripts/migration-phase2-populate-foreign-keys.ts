/**
 * FASE 2: Poblar Foreign Keys Normalizadas
 *
 * Este script puebla los campos team_id, position_id, nationality_id y agency_id
 * en el modelo Jugador, creando las entidades necesarias en las tablas normalizadas.
 */

import { prisma } from '@/lib/db';

interface MigrationStats {
  teamsCreated: number;
  teamsLinked: number;
  positionsCreated: number;
  positionsLinked: number;
  countriesCreated: number;
  nationalitiesLinked: number;
  agenciesCreated: number;
  agenciesLinked: number;
  errors: string[];
}

// Mapeo de posiciones comunes a nombres estándar
const POSITION_MAPPING: Record<string, { name: string; short_name: string; category: string }> = {
  // Goalkeepers
  'GK': { name: 'Goalkeeper', short_name: 'GK', category: 'Goalkeeper' },
  'Goalkeeper': { name: 'Goalkeeper', short_name: 'GK', category: 'Goalkeeper' },

  // Defenders
  'CB': { name: 'Centre-Back', short_name: 'CB', category: 'Defender' },
  'LB': { name: 'Left-Back', short_name: 'LB', category: 'Defender' },
  'RB': { name: 'Right-Back', short_name: 'RB', category: 'Defender' },
  'LWB': { name: 'Left Wing-Back', short_name: 'LWB', category: 'Defender' },
  'RWB': { name: 'Right Wing-Back', short_name: 'RWB', category: 'Defender' },
  'Defender': { name: 'Defender', short_name: 'DEF', category: 'Defender' },

  // Midfielders
  'CDM': { name: 'Defensive Midfielder', short_name: 'CDM', category: 'Midfielder' },
  'CM': { name: 'Central Midfielder', short_name: 'CM', category: 'Midfielder' },
  'CAM': { name: 'Attacking Midfielder', short_name: 'CAM', category: 'Midfielder' },
  'LM': { name: 'Left Midfielder', short_name: 'LM', category: 'Midfielder' },
  'RM': { name: 'Right Midfielder', short_name: 'RM', category: 'Midfielder' },
  'Midfielder': { name: 'Midfielder', short_name: 'MID', category: 'Midfielder' },
  'Central Midfielder': { name: 'Central Midfielder', short_name: 'CM', category: 'Midfielder' },

  // Forwards
  'LW': { name: 'Left Winger', short_name: 'LW', category: 'Forward' },
  'RW': { name: 'Right Winger', short_name: 'RW', category: 'Forward' },
  'ST': { name: 'Striker', short_name: 'ST', category: 'Forward' },
  'CF': { name: 'Centre-Forward', short_name: 'CF', category: 'Forward' },
  'Forward': { name: 'Forward', short_name: 'FWD', category: 'Forward' },
};

// Mapeo de códigos de país comunes
const COUNTRY_CODES: Record<string, string> = {
  'Spain': 'ES',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'France': 'FR',
  'Germany': 'DE',
  'Italy': 'IT',
  'England': 'GB-ENG',
  'Portugal': 'PT',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Uruguay': 'UY',
  'Colombia': 'CO',
  'Mexico': 'MX',
  'USA': 'US',
  'United States': 'US',
  'Chile': 'CL',
  'Croatia': 'HR',
  'Denmark': 'DK',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Poland': 'PL',
};

async function populateForeignKeys(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    teamsCreated: 0,
    teamsLinked: 0,
    positionsCreated: 0,
    positionsLinked: 0,
    countriesCreated: 0,
    nationalitiesLinked: 0,
    agenciesCreated: 0,
    agenciesLinked: 0,
    errors: [],
  };

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  FASE 2: POBLANDO FOREIGN KEYS                            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // ============================================================
    // 1. POBLAR POSITIONS
    // ============================================================
    console.log('⚽ PASO 1: Poblando Posiciones');
    console.log('─'.repeat(60));

    // Crear mapa de posiciones existentes
    const existingPositions = await prisma.position.findMany();
    const positionMap = new Map(existingPositions.map(p => [p.short_name.toUpperCase(), p.id]));

    console.log(`   Posiciones existentes: ${existingPositions.length}`);

    // Obtener jugadores sin position_id
    const playersWithoutPositionId = await prisma.jugador.findMany({
      where: {
        position_id: null,
        OR: [
          { position_player: { not: null } },
          { correct_position_player: { not: null } },
        ],
      },
      select: {
        id_player: true,
        position_player: true,
        correct_position_player: true,
      },
    });

    console.log(`   Jugadores sin position_id: ${playersWithoutPositionId.length}\n`);

    for (const player of playersWithoutPositionId) {
      try {
        const positionStr = (player.correct_position_player || player.position_player || '').trim();
        if (!positionStr) continue;

        const positionKey = positionStr.toUpperCase();
        const positionData = POSITION_MAPPING[positionStr] || POSITION_MAPPING[positionKey];

        if (!positionData) {
          // Crear posición genérica si no está mapeada
          const category = positionStr.toLowerCase().includes('mid') ? 'Midfielder' :
                          positionStr.toLowerCase().includes('def') ? 'Defender' :
                          positionStr.toLowerCase().includes('for') || positionStr.toLowerCase().includes('att') ? 'Forward' :
                          positionStr.toLowerCase().includes('gk') || positionStr.toLowerCase().includes('goal') ? 'Goalkeeper' : 'Midfielder';

          const position = await prisma.position.upsert({
            where: { short_name: positionStr.toUpperCase() },
            create: {
              name: positionStr,
              short_name: positionStr.toUpperCase(),
              category,
            },
            update: {},
          });

          positionMap.set(positionStr.toUpperCase(), position.id);
          stats.positionsCreated++;
          console.log(`   ✅ Creada posición: ${position.name} (${position.short_name})`);
        } else {
          // Usar posición mapeada
          let positionId = positionMap.get(positionData.short_name.toUpperCase());

          if (!positionId) {
            const position = await prisma.position.create({
              data: positionData,
            });
            positionId = position.id;
            positionMap.set(positionData.short_name.toUpperCase(), positionId);
            stats.positionsCreated++;
            console.log(`   ✅ Creada posición: ${positionData.name} (${positionData.short_name})`);
          }
        }

        // Actualizar jugador con position_id
        const positionId = positionMap.get(positionKey) || positionMap.get(positionData?.short_name.toUpperCase() || '');
        if (positionId) {
          await prisma.jugador.update({
            where: { id_player: player.id_player },
            data: { position_id: positionId },
          });
          stats.positionsLinked++;
        }

      } catch (error) {
        const errorMsg = `Error procesando posición para jugador ${player.id_player}: ${error}`;
        stats.errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    console.log(`\n   📦 Resumen Posiciones:`);
    console.log(`      Creadas: ${stats.positionsCreated}`);
    console.log(`      Vinculadas: ${stats.positionsLinked}\n`);

    // ============================================================
    // 2. POBLAR COUNTRIES (para nationalities)
    // ============================================================
    console.log('🌍 PASO 2: Poblando Nacionalidades');
    console.log('─'.repeat(60));

    const existingCountries = await prisma.country.findMany();
    const countryMap = new Map(existingCountries.map(c => [c.name.toLowerCase(), c.id]));

    console.log(`   Países existentes: ${existingCountries.length}`);

    const playersWithoutNationalityId = await prisma.jugador.findMany({
      where: {
        nationality_id: null,
        OR: [
          { nationality_1: { not: null } },
          { correct_nationality_1: { not: null } },
        ],
      },
      select: {
        id_player: true,
        nationality_1: true,
        correct_nationality_1: true,
      },
    });

    console.log(`   Jugadores sin nationality_id: ${playersWithoutNationalityId.length}\n`);

    for (const player of playersWithoutNationalityId) {
      try {
        const nationalityStr = (player.correct_nationality_1 || player.nationality_1 || '').trim();
        if (!nationalityStr) continue;

        const nationalityKey = nationalityStr.toLowerCase();
        let countryId = countryMap.get(nationalityKey);

        if (!countryId) {
          // Crear país
          const code = COUNTRY_CODES[nationalityStr] || nationalityStr.substring(0, 3).toUpperCase();

          const country = await prisma.country.create({
            data: {
              name: nationalityStr,
              code: code,
            },
          });

          countryId = country.id;
          countryMap.set(nationalityKey, countryId);
          stats.countriesCreated++;
          console.log(`   ✅ Creado país: ${country.name} (${country.code})`);
        }

        // Actualizar jugador
        await prisma.jugador.update({
          where: { id_player: player.id_player },
          data: { nationality_id: countryId },
        });
        stats.nationalitiesLinked++;

      } catch (error) {
        const errorMsg = `Error procesando nacionalidad para jugador ${player.id_player}: ${error}`;
        stats.errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    console.log(`\n   📦 Resumen Nacionalidades:`);
    console.log(`      Países creados: ${stats.countriesCreated}`);
    console.log(`      Vinculadas: ${stats.nationalitiesLinked}\n`);

    // ============================================================
    // 3. POBLAR TEAMS
    // ============================================================
    console.log('🏟️  PASO 3: Poblando Equipos');
    console.log('─'.repeat(60));

    const existingTeams = await prisma.equipo.findMany();
    const teamMap = new Map(existingTeams.map(t => [t.team_name.toLowerCase(), t.id_team]));

    console.log(`   Equipos existentes: ${existingTeams.length}`);

    const playersWithoutTeamId = await prisma.jugador.findMany({
      where: {
        team_id: null,
        OR: [
          { team_name: { not: null } },
          { correct_team_name: { not: null } },
        ],
      },
      select: {
        id_player: true,
        team_name: true,
        correct_team_name: true,
        team_country: true,
      },
    });

    console.log(`   Jugadores sin team_id: ${playersWithoutTeamId.length}\n`);

    for (const player of playersWithoutTeamId) {
      try {
        const teamName = (player.correct_team_name || player.team_name || '').trim();
        if (!teamName) continue;

        const teamKey = teamName.toLowerCase();
        let teamId = teamMap.get(teamKey);

        if (!teamId) {
          // Crear equipo
          const team = await prisma.equipo.create({
            data: {
              team_name: teamName,
              correct_team_name: teamName,
              team_country: player.team_country,
            },
          });

          teamId = team.id_team;
          teamMap.set(teamKey, teamId);
          stats.teamsCreated++;
          console.log(`   ✅ Creado equipo: ${team.team_name}`);
        }

        // Actualizar jugador
        await prisma.jugador.update({
          where: { id_player: player.id_player },
          data: { team_id: teamId },
        });
        stats.teamsLinked++;

      } catch (error) {
        const errorMsg = `Error procesando equipo para jugador ${player.id_player}: ${error}`;
        stats.errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    console.log(`\n   📦 Resumen Equipos:`);
    console.log(`      Creados: ${stats.teamsCreated}`);
    console.log(`      Vinculados: ${stats.teamsLinked}\n`);

    // ============================================================
    // 4. POBLAR AGENCIES
    // ============================================================
    console.log('🤝 PASO 4: Poblando Agencias');
    console.log('─'.repeat(60));

    const existingAgencies = await prisma.agency.findMany();
    const agencyMap = new Map(existingAgencies.map(a => [a.name.toLowerCase(), a.id]));

    console.log(`   Agencias existentes: ${existingAgencies.length}`);

    const playersWithoutAgencyId = await prisma.jugador.findMany({
      where: {
        agency_id: null,
        OR: [
          { agency: { not: null } },
          { correct_agency: { not: null } },
        ],
      },
      select: {
        id_player: true,
        agency: true,
        correct_agency: true,
      },
    });

    console.log(`   Jugadores sin agency_id: ${playersWithoutAgencyId.length}\n`);

    for (const player of playersWithoutAgencyId) {
      try {
        const agencyName = (player.correct_agency || player.agency || '').trim();
        if (!agencyName) continue;

        const agencyKey = agencyName.toLowerCase();
        let agencyId = agencyMap.get(agencyKey);

        if (!agencyId) {
          // Crear agencia
          const agency = await prisma.agency.create({
            data: {
              name: agencyName,
            },
          });

          agencyId = agency.id;
          agencyMap.set(agencyKey, agencyId);
          stats.agenciesCreated++;
          console.log(`   ✅ Creada agencia: ${agency.name}`);
        }

        // Actualizar jugador
        await prisma.jugador.update({
          where: { id_player: player.id_player },
          data: { agency_id: agencyId },
        });
        stats.agenciesLinked++;

      } catch (error) {
        const errorMsg = `Error procesando agencia para jugador ${player.id_player}: ${error}`;
        stats.errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    console.log(`\n   📦 Resumen Agencias:`);
    console.log(`      Creadas: ${stats.agenciesCreated}`);
    console.log(`      Vinculadas: ${stats.agenciesLinked}\n`);

    // ============================================================
    // RESUMEN FINAL
    // ============================================================
    console.log('═'.repeat(60));
    console.log('📋 RESUMEN FINAL');
    console.log('═'.repeat(60));
    console.log(`\nPOSICIONES:`);
    console.log(`   Creadas: ${stats.positionsCreated}`);
    console.log(`   Vinculadas: ${stats.positionsLinked}`);
    console.log(`\nNACIONALIDADES:`);
    console.log(`   Países creados: ${stats.countriesCreated}`);
    console.log(`   Vinculadas: ${stats.nationalitiesLinked}`);
    console.log(`\nEQUIPOS:`);
    console.log(`   Creados: ${stats.teamsCreated}`);
    console.log(`   Vinculados: ${stats.teamsLinked}`);
    console.log(`\nAGENCIAS:`);
    console.log(`   Creadas: ${stats.agenciesCreated}`);
    console.log(`   Vinculadas: ${stats.agenciesLinked}`);
    console.log(`\nTOTAL RELACIONES: ${stats.positionsLinked + stats.nationalitiesLinked + stats.teamsLinked + stats.agenciesLinked}`);
    console.log(`ERRORES: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORES ENCONTRADOS:');
      stats.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

    console.log('\n✅ Migración Fase 2 completada');

  } catch (error) {
    console.error('❌ Error crítico durante migración:', error);
    stats.errors.push(`Error crítico: ${error}`);
  }

  return stats;
}

async function main() {
  try {
    const stats = await populateForeignKeys();
    console.log('\n💾 Estadísticas guardadas\n');
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { populateForeignKeys };
