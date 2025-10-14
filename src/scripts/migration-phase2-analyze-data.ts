/**
 * FASE 2: Análisis de datos para poblar Foreign Keys
 *
 * Este script analiza el estado actual de los datos para determinar
 * qué foreign keys necesitan ser pobladas en el modelo Jugador.
 */

import { prisma } from '@/lib/db';

interface AnalysisResult {
  totalPlayers: number;

  // Team data
  playersWithTeamName: number;
  playersWithTeamId: number;
  uniqueTeamNames: number;
  existingTeams: number;

  // Position data
  playersWithPosition: number;
  playersWithPositionId: number;
  uniquePositions: number;
  existingPositions: number;

  // Nationality data
  playersWithNationality: number;
  playersWithNationalityId: number;
  uniqueNationalities: number;
  existingCountries: number;

  // Agency data
  playersWithAgency: number;
  playersWithAgencyId: number;
  uniqueAgencies: number;
  existingAgencies: number;
}

async function analyzeData(): Promise<AnalysisResult> {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  ANÁLISIS FASE 2: DATOS PARA FOREIGN KEYS                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const result: AnalysisResult = {
    totalPlayers: 0,
    playersWithTeamName: 0,
    playersWithTeamId: 0,
    uniqueTeamNames: 0,
    existingTeams: 0,
    playersWithPosition: 0,
    playersWithPositionId: 0,
    uniquePositions: 0,
    existingPositions: 0,
    playersWithNationality: 0,
    playersWithNationalityId: 0,
    uniqueNationalities: 0,
    existingCountries: 0,
    playersWithAgency: 0,
    playersWithAgencyId: 0,
    uniqueAgencies: 0,
    existingAgencies: 0,
  };

  // 1. Total de jugadores
  console.log('📊 Contando jugadores...');
  result.totalPlayers = await prisma.jugador.count();
  console.log(`   Total: ${result.totalPlayers} jugadores\n`);

  // 2. TEAM DATA
  console.log('🏟️  ANÁLISIS DE EQUIPOS');
  console.log('─'.repeat(60));

  result.playersWithTeamName = await prisma.jugador.count({
    where: {
      OR: [
        { team_name: { not: null } },
        { correct_team_name: { not: null } },
      ],
    },
  });

  result.playersWithTeamId = await prisma.jugador.count({
    where: { team_id: { not: null } },
  });

  result.existingTeams = await prisma.equipo.count();

  // Obtener nombres únicos de equipos
  const uniqueTeams = await prisma.jugador.groupBy({
    by: ['team_name'],
    where: { team_name: { not: null } },
  });
  result.uniqueTeamNames = uniqueTeams.length;

  console.log(`   Jugadores con team_name: ${result.playersWithTeamName}`);
  console.log(`   Jugadores con team_id: ${result.playersWithTeamId}`);
  console.log(`   Nombres únicos de equipos: ${result.uniqueTeamNames}`);
  console.log(`   Equipos en tabla Equipo: ${result.existingTeams}`);
  console.log(`   Por poblar: ${result.playersWithTeamName - result.playersWithTeamId}\n`);

  // 3. POSITION DATA
  console.log('⚽ ANÁLISIS DE POSICIONES');
  console.log('─'.repeat(60));

  result.playersWithPosition = await prisma.jugador.count({
    where: {
      OR: [
        { position_player: { not: null } },
        { correct_position_player: { not: null } },
      ],
    },
  });

  result.playersWithPositionId = await prisma.jugador.count({
    where: { position_id: { not: null } },
  });

  result.existingPositions = await prisma.position.count();

  // Obtener posiciones únicas
  const uniquePositions = await prisma.jugador.groupBy({
    by: ['position_player'],
    where: { position_player: { not: null } },
  });
  result.uniquePositions = uniquePositions.length;

  console.log(`   Jugadores con position_player: ${result.playersWithPosition}`);
  console.log(`   Jugadores con position_id: ${result.playersWithPositionId}`);
  console.log(`   Posiciones únicas: ${result.uniquePositions}`);
  console.log(`   Posiciones en tabla Position: ${result.existingPositions}`);
  console.log(`   Por poblar: ${result.playersWithPosition - result.playersWithPositionId}\n`);

  // Mostrar posiciones únicas
  if (result.uniquePositions <= 20) {
    console.log('   Posiciones encontradas:');
    uniquePositions.forEach((pos, i) => {
      if (pos.position_player) {
        console.log(`      ${i + 1}. ${pos.position_player}`);
      }
    });
    console.log();
  }

  // 4. NATIONALITY DATA
  console.log('🌍 ANÁLISIS DE NACIONALIDADES');
  console.log('─'.repeat(60));

  result.playersWithNationality = await prisma.jugador.count({
    where: {
      OR: [
        { nationality_1: { not: null } },
        { correct_nationality_1: { not: null } },
      ],
    },
  });

  result.playersWithNationalityId = await prisma.jugador.count({
    where: { nationality_id: { not: null } },
  });

  result.existingCountries = await prisma.country.count();

  // Obtener nacionalidades únicas
  const uniqueNationalities = await prisma.jugador.groupBy({
    by: ['nationality_1'],
    where: { nationality_1: { not: null } },
  });
  result.uniqueNationalities = uniqueNationalities.length;

  console.log(`   Jugadores con nationality_1: ${result.playersWithNationality}`);
  console.log(`   Jugadores con nationality_id: ${result.playersWithNationalityId}`);
  console.log(`   Nacionalidades únicas: ${result.uniqueNationalities}`);
  console.log(`   Países en tabla Country: ${result.existingCountries}`);
  console.log(`   Por poblar: ${result.playersWithNationality - result.playersWithNationalityId}\n`);

  // 5. AGENCY DATA
  console.log('🤝 ANÁLISIS DE AGENCIAS');
  console.log('─'.repeat(60));

  result.playersWithAgency = await prisma.jugador.count({
    where: {
      OR: [
        { agency: { not: null } },
        { correct_agency: { not: null } },
      ],
    },
  });

  result.playersWithAgencyId = await prisma.jugador.count({
    where: { agency_id: { not: null } },
  });

  result.existingAgencies = await prisma.agency.count();

  // Obtener agencias únicas
  const uniqueAgencies = await prisma.jugador.groupBy({
    by: ['agency'],
    where: { agency: { not: null } },
  });
  result.uniqueAgencies = uniqueAgencies.length;

  console.log(`   Jugadores con agency: ${result.playersWithAgency}`);
  console.log(`   Jugadores con agency_id: ${result.playersWithAgencyId}`);
  console.log(`   Agencias únicas: ${result.uniqueAgencies}`);
  console.log(`   Agencias en tabla Agency: ${result.existingAgencies}`);
  console.log(`   Por poblar: ${result.playersWithAgency - result.playersWithAgencyId}\n`);

  // 6. RESUMEN
  console.log('═'.repeat(60));
  console.log('📋 RESUMEN');
  console.log('═'.repeat(60));

  const totalToPoblar =
    (result.playersWithTeamName - result.playersWithTeamId) +
    (result.playersWithPosition - result.playersWithPositionId) +
    (result.playersWithNationality - result.playersWithNationalityId) +
    (result.playersWithAgency - result.playersWithAgencyId);

  console.log(`\nTotal de relaciones por poblar: ${totalToPoblar}`);
  console.log(`   - Teams: ${result.playersWithTeamName - result.playersWithTeamId}`);
  console.log(`   - Positions: ${result.playersWithPosition - result.playersWithPositionId}`);
  console.log(`   - Nationalities: ${result.playersWithNationality - result.playersWithNationalityId}`);
  console.log(`   - Agencies: ${result.playersWithAgency - result.playersWithAgencyId}`);

  console.log('\n🎯 RECOMENDACIONES:');

  if (result.playersWithTeamName - result.playersWithTeamId > 0) {
    console.log(`   ✅ Poblar team_id: ${result.playersWithTeamName - result.playersWithTeamId} jugadores`);
  }

  if (result.playersWithPosition - result.playersWithPositionId > 0) {
    console.log(`   ✅ Poblar position_id: ${result.playersWithPosition - result.playersWithPositionId} jugadores`);
    if (result.existingPositions === 0) {
      console.log(`      ⚠️  Primero crear posiciones en tabla Position`);
    }
  }

  if (result.playersWithNationality - result.playersWithNationalityId > 0) {
    console.log(`   ✅ Poblar nationality_id: ${result.playersWithNationality - result.playersWithNationalityId} jugadores`);
  }

  if (result.playersWithAgency - result.playersWithAgencyId > 0) {
    console.log(`   ✅ Poblar agency_id: ${result.playersWithAgency - result.playersWithAgencyId} jugadores`);
  }

  console.log();

  return result;
}

async function main() {
  try {
    const result = await analyzeData();

    // Guardar resultado
    console.log('💾 Análisis completado\n');

  } catch (error) {
    console.error('❌ Error durante análisis:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { analyzeData };
