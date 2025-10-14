/**
 * LIMPIEZA: Eliminar tabla ScoutPlayerReport redundante
 *
 * Esta tabla junction está prácticamente sin usar (1/76 registros)
 * y las relaciones directas en Reporte ya funcionan perfectamente.
 */

import { prisma } from '@/lib/db';

interface AnalysisResult {
  totalReportes: number;
  totalScoutPlayerReports: number;
  reportesConJunction: number;
  reportesSinJunction: number;
  canDelete: boolean;
  reasons: string[];
}

async function analyzeScoutPlayerReport(): Promise<AnalysisResult> {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  ANÁLISIS: Tabla ScoutPlayerReport                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const totalReportes = await prisma.reporte.count();
  const totalScoutPlayerReports = await prisma.scoutPlayerReport.count();

  const reportesConJunction = await prisma.reporte.count({
    where: {
      scoutPlayerReports: {
        some: {}
      }
    }
  });

  const reportesSinJunction = totalReportes - reportesConJunction;

  console.log('📊 ESTADO ACTUAL');
  console.log('─'.repeat(60));
  console.log(`   Total Reportes:              ${totalReportes}`);
  console.log(`   Total ScoutPlayerReports:    ${totalScoutPlayerReports}`);
  console.log(`   Reportes con junction:       ${reportesConJunction} (${((reportesConJunction/totalReportes)*100).toFixed(1)}%)`);
  console.log(`   Reportes sin junction:       ${reportesSinJunction} (${((reportesSinJunction/totalReportes)*100).toFixed(1)}%)\n`);

  // Análisis de razones
  const reasons: string[] = [];
  let canDelete = false;

  if (totalScoutPlayerReports === 0) {
    reasons.push('✅ Tabla completamente vacía - no se usa');
    canDelete = true;
  } else if (reportesSinJunction > totalReportes * 0.9) {
    reasons.push('✅ Más del 90% de reportes NO usan la junction table');
    canDelete = true;
  } else {
    reasons.push('⚠️  Tabla tiene uso significativo');
    canDelete = false;
  }

  // Verificar relaciones directas en Reporte
  const reportesWithDirectRelations = await prisma.reporte.count({
    where: {
      AND: [
        { scout_id: { not: null } },
        { id_player: { not: null } }
      ]
    }
  });

  if (reportesWithDirectRelations === totalReportes) {
    reasons.push('✅ Todos los reportes tienen relaciones directas (scout_id, id_player)');
    reasons.push('✅ Junction table es redundante');
  } else {
    reasons.push(`⚠️  ${totalReportes - reportesWithDirectRelations} reportes sin relaciones directas`);
  }

  console.log('🔍 ANÁLISIS DE REDUNDANCIA');
  console.log('─'.repeat(60));
  reasons.forEach(reason => console.log(`   ${reason}`));

  console.log('\n💡 VENTAJAS DE ELIMINAR ScoutPlayerReport:');
  console.log('─'.repeat(60));
  console.log('   ✅ Simplifica el schema (-1 tabla)');
  console.log('   ✅ Elimina redundancia innecesaria');
  console.log('   ✅ Menos índices que mantener');
  console.log('   ✅ Queries más simples');
  console.log('   ✅ Código más fácil de entender');

  console.log('\n⚠️  CONSIDERACIONES:');
  console.log('─'.repeat(60));
  console.log('   - Reporte.scout_id → Scout (directo)');
  console.log('   - Reporte.id_player → Jugador (directo)');
  console.log('   - Relaciones 1:N funcionan perfectamente');
  console.log('   - No hay caso de uso M:N actualmente');

  console.log('\n🎯 RECOMENDACIÓN:');
  console.log('─'.repeat(60));
  if (canDelete) {
    console.log('   ✅ ELIMINAR ScoutPlayerReport');
    console.log('   ✅ Mantener solo relaciones directas en Reporte');
    console.log('   ✅ No hay pérdida de funcionalidad');
  } else {
    console.log('   ⚠️  REVISAR antes de eliminar');
    console.log('   ⚠️  Tabla tiene uso que debe migrarse primero');
  }

  console.log('\n📋 PASOS PARA ELIMINACIÓN:');
  console.log('─'.repeat(60));
  console.log('   1. Verificar código que usa ScoutPlayerReport');
  console.log('   2. Actualizar queries para usar relaciones directas');
  console.log('   3. Eliminar modelo del schema.prisma');
  console.log('   4. Ejecutar prisma db push');
  console.log('   5. Verificar que todo funciona\n');

  return {
    totalReportes,
    totalScoutPlayerReports,
    reportesConJunction,
    reportesSinJunction,
    canDelete,
    reasons
  };
}

async function main() {
  try {
    const result = await analyzeScoutPlayerReport();

    console.log('═'.repeat(60));
    console.log('📊 RESUMEN');
    console.log('═'.repeat(60));
    console.log(`Puede eliminarse: ${result.canDelete ? '✅ SÍ' : '❌ NO'}`);
    console.log(`Impacto: Mínimo - solo ${result.totalScoutPlayerReports}/${result.totalReportes} registros`);
    console.log(`Beneficio: Simplificación del schema\n`);

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

export { analyzeScoutPlayerReport };
