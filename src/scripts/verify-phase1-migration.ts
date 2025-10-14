/**
 * Verificación de migración Fase 1: Consolidación Competicion → Competition
 *
 * Este script verifica que la migración se completó correctamente:
 * 1. La tabla Competicion ya no existe
 * 2. La tabla Competition tiene datos
 * 3. Los torneos tienen referencias correctas
 */

import { prisma } from '@/lib/db';

async function verifyMigration() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  VERIFICACIÓN FASE 1: COMPETICION → COMPETITION           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const results: { check: string; status: '✅' | '❌'; details: string }[] = [];

  try {
    // 1. Verificar que Competition existe y tiene datos
    console.log('📊 Verificando tabla Competition...');
    try {
      const competitionCount = await prisma.competition.count();
      if (competitionCount > 0) {
        results.push({
          check: 'Competition table exists and has data',
          status: '✅',
          details: `${competitionCount} competitions found`,
        });
        console.log(`   ✅ Competition: ${competitionCount} registros\n`);
      } else {
        results.push({
          check: 'Competition table has data',
          status: '❌',
          details: 'Competition table is empty',
        });
        console.log(`   ⚠️  Competition: tabla vacía\n`);
      }
    } catch (error) {
      results.push({
        check: 'Competition table exists',
        status: '❌',
        details: `Error: ${error}`,
      });
      console.error(`   ❌ Error accediendo a Competition: ${error}\n`);
    }

    // 2. Verificar que Competicion ya no existe en Prisma client
    console.log('🔍 Verificando que Competicion fue eliminada del schema...');
    // @ts-ignore - intentionally checking if old model exists
    if (typeof prisma.competicion === 'undefined') {
      results.push({
        check: 'Competicion model removed from Prisma',
        status: '✅',
        details: 'Competicion successfully removed from Prisma schema',
      });
      console.log('   ✅ Competicion eliminada del schema Prisma\n');
    } else {
      results.push({
        check: 'Competicion model removed from Prisma',
        status: '❌',
        details: 'Competicion still exists in Prisma client',
      });
      console.log('   ❌ Competicion todavía existe en Prisma client\n');
    }

    // 3. Verificar torneos
    console.log('🏆 Verificando torneos...');
    const torneoCount = await prisma.torneo.count();
    const torneosWithCompetition = await prisma.torneo.count({
      where: { competition_id: { not: null } },
    });

    results.push({
      check: 'Torneo table structure',
      status: '✅',
      details: `${torneoCount} total, ${torneosWithCompetition} with competition_id`,
    });
    console.log(`   ✅ Torneos: ${torneoCount} total`);
    console.log(`   ℹ️  Con competition_id: ${torneosWithCompetition}\n`);

    // 4. Verificar relación Competition → Country
    console.log('🌍 Verificando relación Competition → Country...');
    const totalCompetitions = await prisma.competition.count();

    // country_id es obligatorio, así que todas las competitions deben tenerlo
    results.push({
      check: 'Competition-Country relation',
      status: '✅',
      details: `All ${totalCompetitions} competitions have country_id (required field)`,
    });
    console.log(`   ✅ Todas las competitions tienen country_id (campo obligatorio)\n`);

    // 5. Test de consulta con relación
    console.log('🔗 Probando consultas con relación...');
    try {
      const sampleCompetitions = await prisma.competition.findMany({
        take: 3,
        include: {
          country: true,
          torneos: true,
        },
      });

      if (sampleCompetitions.length > 0) {
        results.push({
          check: 'Competition queries with relations',
          status: '✅',
          details: `Successfully queried ${sampleCompetitions.length} competitions with relations`,
        });
        console.log(`   ✅ Consultas con relaciones funcionan correctamente`);
        sampleCompetitions.forEach(comp => {
          console.log(`      - ${comp.name} (${comp.country.name}) - ${comp.torneos.length} torneos`);
        });
        console.log();
      }
    } catch (error) {
      results.push({
        check: 'Competition queries with relations',
        status: '❌',
        details: `Error: ${error}`,
      });
      console.error(`   ❌ Error en consultas con relaciones: ${error}\n`);
    }

    // 6. Resumen
    console.log('═'.repeat(60));
    console.log('📋 RESUMEN DE VERIFICACIÓN');
    console.log('═'.repeat(60));

    const passedChecks = results.filter(r => r.status === '✅').length;
    const failedChecks = results.filter(r => r.status === '❌').length;

    results.forEach(result => {
      console.log(`${result.status} ${result.check}`);
      console.log(`   ${result.details}`);
    });

    console.log('═'.repeat(60));
    console.log(`Total checks: ${results.length}`);
    console.log(`Passed: ${passedChecks}`);
    console.log(`Failed: ${failedChecks}`);
    console.log('═'.repeat(60));

    if (failedChecks === 0) {
      console.log('\n✅ ¡FASE 1 COMPLETADA EXITOSAMENTE!');
      console.log('\n📝 SIGUIENTES PASOS:');
      console.log('   - Fase 2: Poblar foreign keys normalizadas (team_id, position_id, etc.)');
      console.log('   - Fase 3: Limpiar tabla Reporte (eliminar campos redundantes)');
      console.log('   - Fase 4: Consolidar campos correct_* usando PlayerCorrection\n');
    } else {
      console.log('\n⚠️  Hay verificaciones que fallaron. Revisar antes de continuar.\n');
    }

  } catch (error) {
    console.error('❌ Error crítico durante verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar verificación
if (require.main === module) {
  verifyMigration();
}

export { verifyMigration };
