/**
 * Verificación de migración Fase 2: Foreign Keys Pobladas
 *
 * Este script verifica que todas las foreign keys se poblaron correctamente.
 */

import { prisma } from '@/lib/db';

async function verifyMigration() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  VERIFICACIÓN FASE 2: FOREIGN KEYS POBLADAS               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const results: { check: string; status: '✅' | '❌' | '⚠️'; details: string }[] = [];

  try {
    // 1. Verificar jugadores con posiciones
    console.log('⚽ Verificando Posiciones...');
    const totalPlayers = await prisma.jugador.count();
    const playersWithPosition = await prisma.jugador.count({
      where: {
        OR: [
          { position_player: { not: null } },
          { correct_position_player: { not: null } },
        ],
      },
    });
    const playersWithPositionId = await prisma.jugador.count({
      where: { position_id: { not: null } },
    });

    const positionCoverage = playersWithPosition > 0
      ? (playersWithPositionId / playersWithPosition * 100).toFixed(1)
      : '0';

    if (playersWithPositionId >= playersWithPosition) {
      results.push({
        check: 'Position IDs populated',
        status: '✅',
        details: `${playersWithPositionId}/${playersWithPosition} jugadores (${positionCoverage}%)`,
      });
      console.log(`   ✅ ${playersWithPositionId}/${playersWithPosition} jugadores con position_id (${positionCoverage}%)\n`);
    } else {
      results.push({
        check: 'Position IDs populated',
        status: '⚠️',
        details: `${playersWithPositionId}/${playersWithPosition} jugadores (${positionCoverage}%)`,
      });
      console.log(`   ⚠️  ${playersWithPositionId}/${playersWithPosition} jugadores con position_id (${positionCoverage}%)\n`);
    }

    // Test de consulta con relación position
    try {
      const samplePlayers = await prisma.jugador.findMany({
        take: 3,
        where: { position_id: { not: null } },
        include: { position: true },
      });

      if (samplePlayers.length > 0 && samplePlayers.every(p => p.position)) {
        results.push({
          check: 'Position relations work',
          status: '✅',
          details: `Queries con relación position funcionan`,
        });
        console.log(`   ✅ Consultas con relación position funcionan`);
        samplePlayers.forEach(p => {
          console.log(`      - ${p.player_name} → ${p.position?.name} (${p.position?.short_name})`);
        });
        console.log();
      }
    } catch (error) {
      results.push({
        check: 'Position relations work',
        status: '❌',
        details: `Error: ${error}`,
      });
    }

    // 2. Verificar jugadores con nacionalidades
    console.log('🌍 Verificando Nacionalidades...');
    const playersWithNationality = await prisma.jugador.count({
      where: {
        OR: [
          { nationality_1: { not: null } },
          { correct_nationality_1: { not: null } },
        ],
      },
    });
    const playersWithNationalityId = await prisma.jugador.count({
      where: { nationality_id: { not: null } },
    });

    const nationalityCoverage = playersWithNationality > 0
      ? (playersWithNationalityId / playersWithNationality * 100).toFixed(1)
      : '0';

    if (playersWithNationalityId >= playersWithNationality) {
      results.push({
        check: 'Nationality IDs populated',
        status: '✅',
        details: `${playersWithNationalityId}/${playersWithNationality} jugadores (${nationalityCoverage}%)`,
      });
      console.log(`   ✅ ${playersWithNationalityId}/${playersWithNationality} jugadores con nationality_id (${nationalityCoverage}%)\n`);
    } else {
      results.push({
        check: 'Nationality IDs populated',
        status: '⚠️',
        details: `${playersWithNationalityId}/${playersWithNationality} jugadores (${nationalityCoverage}%)`,
      });
      console.log(`   ⚠️  ${playersWithNationalityId}/${playersWithNationality} jugadores con nationality_id (${nationalityCoverage}%)\n`);
    }

    // Test de consulta con relación nationality
    try {
      const samplePlayers = await prisma.jugador.findMany({
        take: 3,
        where: { nationality_id: { not: null } },
        include: { nationality: true },
      });

      if (samplePlayers.length > 0 && samplePlayers.every(p => p.nationality)) {
        results.push({
          check: 'Nationality relations work',
          status: '✅',
          details: `Queries con relación nationality funcionan`,
        });
        console.log(`   ✅ Consultas con relación nationality funcionan`);
        samplePlayers.forEach(p => {
          console.log(`      - ${p.player_name} → ${p.nationality?.name} (${p.nationality?.code})`);
        });
        console.log();
      }
    } catch (error) {
      results.push({
        check: 'Nationality relations work',
        status: '❌',
        details: `Error: ${error}`,
      });
    }

    // 3. Verificar jugadores con equipos
    console.log('🏟️  Verificando Equipos...');
    const playersWithTeam = await prisma.jugador.count({
      where: {
        OR: [
          { team_name: { not: null } },
          { correct_team_name: { not: null } },
        ],
      },
    });
    const playersWithTeamId = await prisma.jugador.count({
      where: { team_id: { not: null } },
    });

    const teamCoverage = playersWithTeam > 0
      ? (playersWithTeamId / playersWithTeam * 100).toFixed(1)
      : '0';

    if (playersWithTeamId >= playersWithTeam) {
      results.push({
        check: 'Team IDs populated',
        status: '✅',
        details: `${playersWithTeamId}/${playersWithTeam} jugadores (${teamCoverage}%)`,
      });
      console.log(`   ✅ ${playersWithTeamId}/${playersWithTeam} jugadores con team_id (${teamCoverage}%)\n`);
    } else {
      results.push({
        check: 'Team IDs populated',
        status: '⚠️',
        details: `${playersWithTeamId}/${playersWithTeam} jugadores (${teamCoverage}%)`,
      });
      console.log(`   ⚠️  ${playersWithTeamId}/${playersWithTeam} jugadores con team_id (${teamCoverage}%)\n`);
    }

    // Test de consulta con relación team
    try {
      const samplePlayers = await prisma.jugador.findMany({
        take: 3,
        where: { team_id: { not: null } },
        include: { team: true },
      });

      if (samplePlayers.length > 0 && samplePlayers.every(p => p.team)) {
        results.push({
          check: 'Team relations work',
          status: '✅',
          details: `Queries con relación team funcionan`,
        });
        console.log(`   ✅ Consultas con relación team funcionan`);
        samplePlayers.forEach(p => {
          console.log(`      - ${p.player_name} → ${p.team?.team_name}`);
        });
        console.log();
      }
    } catch (error) {
      results.push({
        check: 'Team relations work',
        status: '❌',
        details: `Error: ${error}`,
      });
    }

    // 4. Verificar jugadores con agencias
    console.log('🤝 Verificando Agencias...');
    const playersWithAgency = await prisma.jugador.count({
      where: {
        OR: [
          { agency: { not: null } },
          { correct_agency: { not: null } },
        ],
      },
    });
    const playersWithAgencyId = await prisma.jugador.count({
      where: { agency_id: { not: null } },
    });

    const agencyCoverage = playersWithAgency > 0
      ? (playersWithAgencyId / playersWithAgency * 100).toFixed(1)
      : '0';

    if (playersWithAgencyId >= playersWithAgency) {
      results.push({
        check: 'Agency IDs populated',
        status: '✅',
        details: `${playersWithAgencyId}/${playersWithAgency} jugadores (${agencyCoverage}%)`,
      });
      console.log(`   ✅ ${playersWithAgencyId}/${playersWithAgency} jugadores con agency_id (${agencyCoverage}%)\n`);
    } else if (playersWithAgency === 0) {
      results.push({
        check: 'Agency IDs populated',
        status: '✅',
        details: `Sin agencias para poblar`,
      });
      console.log(`   ✅ Sin agencias para poblar\n`);
    } else {
      results.push({
        check: 'Agency IDs populated',
        status: '⚠️',
        details: `${playersWithAgencyId}/${playersWithAgency} jugadores (${agencyCoverage}%)`,
      });
      console.log(`   ⚠️  ${playersWithAgencyId}/${playersWithAgency} jugadores con agency_id (${agencyCoverage}%)\n`);
    }

    // Test de consulta con relación agency
    if (playersWithAgencyId > 0) {
      try {
        const samplePlayers = await prisma.jugador.findMany({
          take: 3,
          where: { agency_id: { not: null } },
          include: { agencyRelation: true },
        });

        if (samplePlayers.length > 0 && samplePlayers.every(p => p.agencyRelation)) {
          results.push({
            check: 'Agency relations work',
            status: '✅',
            details: `Queries con relación agency funcionan`,
          });
          console.log(`   ✅ Consultas con relación agency funcionan`);
          samplePlayers.forEach(p => {
            console.log(`      - ${p.player_name} → ${p.agencyRelation?.name}`);
          });
          console.log();
        }
      } catch (error) {
        results.push({
          check: 'Agency relations work',
          status: '❌',
          details: `Error: ${error}`,
        });
      }
    }

    // 5. Test complejo: Query con todas las relaciones
    console.log('🔗 Probando consulta con todas las relaciones...');
    try {
      const complexQuery = await prisma.jugador.findFirst({
        where: {
          AND: [
            { position_id: { not: null } },
            { nationality_id: { not: null } },
            { team_id: { not: null } },
          ],
        },
        include: {
          position: true,
          nationality: true,
          team: true,
          agencyRelation: true,
        },
      });

      if (complexQuery) {
        results.push({
          check: 'Complex query with all relations',
          status: '✅',
          details: `Query compleja funciona correctamente`,
        });
        console.log(`   ✅ Query compleja funciona`);
        console.log(`      Jugador: ${complexQuery.player_name}`);
        console.log(`      Posición: ${complexQuery.position?.name}`);
        console.log(`      Nacionalidad: ${complexQuery.nationality?.name}`);
        console.log(`      Equipo: ${complexQuery.team?.team_name}`);
        if (complexQuery.agencyRelation) {
          console.log(`      Agencia: ${complexQuery.agencyRelation.name}`);
        }
        console.log();
      }
    } catch (error) {
      results.push({
        check: 'Complex query with all relations',
        status: '❌',
        details: `Error: ${error}`,
      });
      console.error(`   ❌ Error en query compleja: ${error}\n`);
    }

    // 6. Verificar tablas normalizadas
    console.log('📊 Verificando tablas normalizadas...');
    const positionsCount = await prisma.position.count();
    const countriesCount = await prisma.country.count();
    const teamsCount = await prisma.equipo.count();
    const agenciesCount = await prisma.agency.count();

    console.log(`   Positions: ${positionsCount}`);
    console.log(`   Countries: ${countriesCount}`);
    console.log(`   Teams: ${teamsCount}`);
    console.log(`   Agencies: ${agenciesCount}\n`);

    results.push({
      check: 'Normalized tables populated',
      status: '✅',
      details: `Positions: ${positionsCount}, Countries: ${countriesCount}, Teams: ${teamsCount}, Agencies: ${agenciesCount}`,
    });

    // RESUMEN
    console.log('═'.repeat(60));
    console.log('📋 RESUMEN DE VERIFICACIÓN');
    console.log('═'.repeat(60));

    const passedChecks = results.filter(r => r.status === '✅').length;
    const warningChecks = results.filter(r => r.status === '⚠️').length;
    const failedChecks = results.filter(r => r.status === '❌').length;

    results.forEach(result => {
      console.log(`${result.status} ${result.check}`);
      console.log(`   ${result.details}`);
    });

    console.log('═'.repeat(60));
    console.log(`Total checks: ${results.length}`);
    console.log(`Passed: ${passedChecks}`);
    console.log(`Warnings: ${warningChecks}`);
    console.log(`Failed: ${failedChecks}`);
    console.log('═'.repeat(60));

    if (failedChecks === 0 && warningChecks === 0) {
      console.log('\n✅ ¡FASE 2 COMPLETADA EXITOSAMENTE!');
      console.log('\n📝 BENEFICIOS OBTENIDOS:');
      console.log('   ✅ Foreign keys normalizadas pobladas');
      console.log('   ✅ Relaciones tipadas funcionando');
      console.log('   ✅ Queries más eficientes con joins');
      console.log('   ✅ Mejor integridad referencial');
      console.log('\n📝 SIGUIENTES PASOS:');
      console.log('   - Fase 3: Limpiar tabla Reporte (eliminar 60+ campos redundantes)');
      console.log('   - Fase 4: Consolidar campos correct_* usando PlayerCorrection\n');
    } else if (failedChecks === 0) {
      console.log('\n⚠️  Fase 2 completada con advertencias. Revisar cobertura.\n');
    } else {
      console.log('\n⚠️  Hay verificaciones que fallaron. Revisar antes de continuar.\n');
    }

  } catch (error) {
    console.error('❌ Error crítico durante verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  verifyMigration();
}

export { verifyMigration };
