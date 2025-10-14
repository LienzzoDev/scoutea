/**
 * Análisis: Diferencia entre Reporte y ScoutPlayerReport
 */

import { prisma } from '@/lib/db';

async function analyze() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  ANÁLISIS: Reporte vs ScoutPlayerReport                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Contar registros
  const reporteCount = await prisma.reporte.count();
  const scoutPlayerReportCount = await prisma.scoutPlayerReport.count();

  console.log('📊 CONTEO DE REGISTROS');
  console.log('─'.repeat(60));
  console.log(`   Reportes (tabla principal):      ${reporteCount}`);
  console.log(`   ScoutPlayerReports (junction):    ${scoutPlayerReportCount}\n`);

  // Verificar linkeo
  const reportesWithLink = await prisma.reporte.count({
    where: {
      scoutPlayerReports: {
        some: {}
      }
    }
  });

  console.log('🔗 RELACIÓN');
  console.log('─'.repeat(60));
  console.log(`   Reportes con ScoutPlayerReport: ${reportesWithLink}/${reporteCount}`);
  console.log(`   Reportes sin ScoutPlayerReport: ${reporteCount - reportesWithLink}\n`);

  // Ejemplos
  console.log('📋 EJEMPLO DE REPORTE');
  console.log('─'.repeat(60));
  const sampleReporte = await prisma.reporte.findFirst({
    include: {
      scout: { select: { scout_name: true } },
      player: { select: { player_name: true } },
      scoutPlayerReports: true
    }
  });

  if (sampleReporte) {
    console.log(`   ID Reporte: ${sampleReporte.id_report}`);
    console.log(`   Scout: ${sampleReporte.scout?.scout_name || sampleReporte.scout_id || 'N/A'}`);
    console.log(`   Jugador: ${sampleReporte.player?.player_name || sampleReporte.id_player || 'N/A'}`);
    console.log(`   Fecha: ${sampleReporte.report_date || sampleReporte.createdAt}`);
    console.log(`   ScoutPlayerReports vinculados: ${sampleReporte.scoutPlayerReports.length}\n`);
  }

  console.log('📋 EJEMPLO DE SCOUTPLAYERREPORT');
  console.log('─'.repeat(60));
  const sampleJunction = await prisma.scoutPlayerReport.findFirst({
    include: {
      scout: { select: { scout_name: true } },
      player: { select: { player_name: true } },
      report: { select: { report_type: true, report_date: true } }
    }
  });

  if (sampleJunction) {
    console.log(`   ID Junction: ${sampleJunction.id}`);
    console.log(`   Scout: ${sampleJunction.scout?.scout_name || 'N/A'}`);
    console.log(`   Jugador: ${sampleJunction.player?.player_name || 'N/A'}`);
    console.log(`   Reporte: ${sampleJunction.report?.report_type || 'N/A'}`);
    console.log(`   Fecha: ${sampleJunction.createdAt}\n`);
  } else {
    console.log('   No hay registros en ScoutPlayerReport\n');
  }

  // Análisis de diferencias
  console.log('═'.repeat(60));
  console.log('📊 DIFERENCIAS CLAVE');
  console.log('═'.repeat(60));
  console.log('\n🔵 REPORTE (tabla principal):');
  console.log('   - Contiene TODO el contenido del reporte');
  console.log('   - Tiene análisis, evaluaciones, ROI, profit');
  console.log('   - Snapshot histórico del jugador al momento del reporte');
  console.log('   - URLs, videos, texto del reporte');
  console.log('   - Estado, validación, formato');
  console.log('   - 29 campos de información\n');

  console.log('🔵 SCOUTPLAYERREPORT (tabla de unión):');
  console.log('   - Solo relaciona Scout + Jugador + Reporte');
  console.log('   - No contiene información del reporte');
  console.log('   - Es una "junction table" o "tabla pivote"');
  console.log('   - Solo 3 foreign keys + timestamps');
  console.log('   - Permite consultas M:N (muchos a muchos)\n');

  console.log('💡 CONCLUSIÓN:');
  console.log('─'.repeat(60));

  if (scoutPlayerReportCount === 0) {
    console.log('   ⚠️  ScoutPlayerReport está VACÍA');
    console.log('   ⚠️  No se está usando actualmente');
    console.log('   ✅ Los reportes funcionan con sus relaciones directas');
    console.log('   ✅ Reporte.scout_id → Scout (relación directa)');
    console.log('   ✅ Reporte.id_player → Jugador (relación directa)');
    console.log('\n   💭 RECOMENDACIÓN:');
    console.log('      - Opción A: Eliminar ScoutPlayerReport (no se usa)');
    console.log('      - Opción B: Poblar ScoutPlayerReport si hay caso de uso M:N');
  } else if (reportesWithLink === reporteCount) {
    console.log('   ✅ Todas las tablas están sincronizadas');
    console.log('   ✅ ScoutPlayerReport se está usando correctamente');
  } else {
    console.log(`   ⚠️  ${reporteCount - reportesWithLink} reportes sin ScoutPlayerReport`);
    console.log('   ⚠️  Sincronización incompleta');
  }

  console.log('\n   📖 CASO DE USO:');
  console.log('      ScoutPlayerReport permite:');
  console.log('      - Buscar "todos los reportes de un scout sobre un jugador"');
  console.log('      - Relaciones M:N si múltiples scouts pueden editar un reporte');
  console.log('      - Pero actualmente Reporte ya tiene scout_id y id_player directos\n');

  await prisma.$disconnect();
}

analyze();
