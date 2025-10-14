/**
 * FASE 3: Análisis de tabla Reporte
 *
 * Este script analiza la tabla Reporte para identificar campos redundantes
 * que ya existen en la tabla Jugador y pueden ser eliminados.
 */

import { prisma } from '@/lib/db';

interface FieldAnalysis {
  category: string;
  fields: string[];
  reason: string;
  action: 'ELIMINAR' | 'MANTENER';
}

async function analyzeReporteTable() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  ANÁLISIS FASE 3: TABLA REPORTE                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Contar reportes
  const reporteCount = await prisma.reporte.count();
  const reportesWithPlayer = await prisma.reporte.count({
    where: { id_player: { not: null } },
  });

  console.log('📊 ESTADO ACTUAL');
  console.log('─'.repeat(60));
  console.log(`   Total reportes: ${reporteCount}`);
  console.log(`   Reportes con jugador vinculado: ${reportesWithPlayer}`);
  console.log(`   Porcentaje vinculación: ${reporteCount > 0 ? ((reportesWithPlayer / reporteCount) * 100).toFixed(1) : 0}%\n`);

  // Análisis de campos
  const analysis: FieldAnalysis[] = [];

  // CAMPOS ESENCIALES DEL REPORTE (MANTENER)
  analysis.push({
    category: '✅ CAMPOS ESENCIALES (Mantener)',
    fields: [
      'id_report',
      'report_status',
      'report_validation',
      'report_author',
      'scout_id',
      'report_date',
      'report_type',
      'id_player', // Foreign key al jugador
      'report_format',
      'form_url_report',
      'form_url_video',
      'form_text_report',
      'createdAt',
      'updatedAt',
    ],
    reason: 'Información específica del reporte, no del jugador',
    action: 'MANTENER',
  });

  // CAMPOS DE ANÁLISIS DEL SCOUT (MANTENER)
  analysis.push({
    category: '✅ CAMPOS DE ANÁLISIS (Mantener)',
    fields: [
      'form_potential', // Evaluación del scout sobre el potencial
      'roi', // Return on investment estimado por el scout
      'profit', // Beneficio estimado por el scout
      'initial_player_trfm_value', // Valor al momento del reporte
      'initial_age', // Edad al momento del reporte
      'initial_team', // Equipo al momento del reporte
      'correct_initial_team',
      'initial_team_elo',
      'initial_team_level',
      'initial_competition',
      'initial_competition_country',
      'initial_competition_elo',
      'initial_competition_level',
      'transfer_team_pts', // Puntos de análisis de transferencia
      'transfer_competition_pts',
    ],
    reason: 'Snapshot del estado del jugador al momento del reporte (histórico)',
    action: 'MANTENER',
  });

  // CAMPOS REDUNDANTES - Ya están en Jugador (ELIMINAR)
  analysis.push({
    category: '❌ CAMPOS REDUNDANTES - Información básica del jugador',
    fields: [
      'form_player_name',
      'player_name', // Ya en Jugador.player_name
      'complete_player_name', // Ya en Jugador.complete_player_name
      'form_date_of_birth',
      'date_of_birth', // Ya en Jugador.date_of_birth
      'correct_date_of_birth', // Ya en Jugador.correct_date_of_birth
      'age', // Se calcula de date_of_birth
    ],
    reason: 'Accesible vía relación player: { player_name, date_of_birth, age }',
    action: 'ELIMINAR',
  });

  analysis.push({
    category: '❌ CAMPOS REDUNDANTES - Información de equipo actual',
    fields: [
      'form_team_name',
      'pre_team',
      'team_name', // Ya en Jugador.team_name
      'correct_team_name', // Ya en Jugador.correct_team_name
      'team_country', // Ya en Jugador.team_country
      'team_elo', // Ya en Jugador.team_elo
      'team_level', // Ya en Jugador.team_level
    ],
    reason: 'Accesible vía relación player.team: { team_name, team_country, team_elo }',
    action: 'ELIMINAR',
  });

  analysis.push({
    category: '❌ CAMPOS REDUNDANTES - Información de competición actual',
    fields: [
      'form_team_competition',
      'team_competition', // Ya en Jugador.team_competition
      'competition_country', // Ya en Jugador.competition_country
      'competition_tier', // Ya en Jugador.competition_tier
      'competition_confederation', // Ya en Jugador.competition_confederation
      'competition_elo', // Ya en Jugador.competition_elo
      'competition_level', // Ya en Jugador.competition_level
    ],
    reason: 'Accesible vía relación player: { team_competition, competition_country }',
    action: 'ELIMINAR',
  });

  analysis.push({
    category: '❌ CAMPOS REDUNDANTES - Información de préstamo',
    fields: [
      'owner_club', // Ya en Jugador.owner_club
      'owner_club_country', // Ya en Jugador.owner_club_country
      'pre_team_loan_from',
      'team_loan_from', // Ya en Jugador.team_loan_from
      'correct_team_loan_from', // Ya en Jugador.correct_team_loan_from
      'on_loan', // Ya en Jugador.on_loan
    ],
    reason: 'Accesible vía relación player: { owner_club, on_loan }',
    action: 'ELIMINAR',
  });

  analysis.push({
    category: '❌ CAMPOS REDUNDANTES - Características físicas',
    fields: [
      'form_position_player',
      'position_player', // Ya en Jugador.position_player
      'correct_position_player', // Ya en Jugador.correct_position_player
      'form_foot',
      'foot', // Ya en Jugador.foot
      'correct_foot', // Ya en Jugador.correct_foot
      'form_height',
      'height', // Ya en Jugador.height
      'correct_height', // Ya en Jugador.correct_height
    ],
    reason: 'Accesible vía relación player.position: { name }, player: { foot, height }',
    action: 'ELIMINAR',
  });

  analysis.push({
    category: '❌ CAMPOS REDUNDANTES - Nacionalidad',
    fields: [
      'form_nationality_1',
      'nationality_1', // Ya en Jugador.nationality_1
      'correct_nationality_1', // Ya en Jugador.correct_nationality_1
      'form_nationality_2',
      'nationality_2', // Ya en Jugador.nationality_2
      'correct_nationality_2', // Ya en Jugador.correct_nationality_2
      'form_national_tier',
      'national_tier', // Ya en Jugador.national_tier
      'rename_national_tier',
      'correct_national_tier', // Ya en Jugador.correct_national_tier
    ],
    reason: 'Accesible vía relación player.nationality: { name, code }',
    action: 'ELIMINAR',
  });

  analysis.push({
    category: '❌ CAMPOS REDUNDANTES - Agencia y contrato',
    fields: [
      'form_agency',
      'agency', // Ya en Jugador.agency
      'correct_agency', // Ya en Jugador.correct_agency
      'contract_end', // Ya en Jugador.contract_end
      'correct_contract_end', // Ya en Jugador.correct_contract_end
    ],
    reason: 'Accesible vía relación player.agencyRelation: { name }, player: { contract_end }',
    action: 'ELIMINAR',
  });

  analysis.push({
    category: '❌ CAMPOS REDUNDANTES - URLs y referencias',
    fields: [
      'form_url_reference',
      'url_trfm_advisor', // Ya en Jugador.url_trfm_advisor
      'url_trfm', // Ya en Jugador.url_trfm
      'url_secondary', // Ya en Jugador.url_secondary
      'url_instagram', // Ya en Jugador.url_instagram
    ],
    reason: 'Accesible vía relación player: { url_trfm, url_instagram }',
    action: 'ELIMINAR',
  });

  analysis.push({
    category: '❌ CAMPOS REDUNDANTES - Valor de mercado actual',
    fields: [
      'player_trfm_value', // Ya en Jugador.player_trfm_value (valor actual cambia)
    ],
    reason: 'El valor actual está en Jugador. El snapshot histórico está en initial_player_trfm_value',
    action: 'ELIMINAR',
  });

  // MOSTRAR ANÁLISIS
  console.log('📋 ANÁLISIS DE CAMPOS\n');

  let totalMantener = 0;
  let totalEliminar = 0;

  analysis.forEach(cat => {
    console.log(cat.category);
    console.log('─'.repeat(60));
    console.log(`   Campos (${cat.fields.length}):`);
    cat.fields.forEach(field => {
      console.log(`      - ${field}`);
    });
    console.log(`   Razón: ${cat.reason}`);
    console.log();

    if (cat.action === 'MANTENER') {
      totalMantener += cat.fields.length;
    } else {
      totalEliminar += cat.fields.length;
    }
  });

  // RESUMEN
  console.log('═'.repeat(60));
  console.log('📊 RESUMEN');
  console.log('═'.repeat(60));
  console.log(`   Total campos en Reporte: ${totalMantener + totalEliminar}`);
  console.log(`   Campos a MANTENER: ${totalMantener}`);
  console.log(`   Campos a ELIMINAR: ${totalEliminar}`);
  console.log(`   Reducción de campos: ${((totalEliminar / (totalMantener + totalEliminar)) * 100).toFixed(1)}%`);

  console.log('\n💡 BENEFICIOS ESPERADOS:');
  console.log(`   ✅ -${totalEliminar} campos redundantes`);
  console.log(`   ✅ -${(totalEliminar * 8 * reporteCount / 1024 / 1024).toFixed(2)}MB estimado de espacio (aprox)`);
  console.log('   ✅ Datos siempre sincronizados con Jugador');
  console.log('   ✅ Más fácil de mantener');
  console.log('   ✅ Sin riesgo de datos desactualizados');

  console.log('\n⚠️  CONSIDERACIONES:');
  console.log('   - Los campos initial_* se MANTIENEN porque son snapshot histórico');
  console.log('   - form_* se eliminan porque son temporales del formulario');
  console.log('   - Toda la info actual del jugador se accede vía relación player');
  console.log('   - Los campos de análisis del scout (roi, profit, etc.) se mantienen');

  console.log('\n🔄 MIGRACIÓN RECOMENDADA:');
  console.log('   1. Verificar que todos los reportes tienen id_player');
  console.log('   2. Crear script de migración para eliminar campos');
  console.log('   3. Actualizar código para usar player.* en lugar de campos directos');
  console.log('   4. Actualizar índices si es necesario');
  console.log('   5. Ejecutar migración en desarrollo');
  console.log('   6. Verificar integridad de datos');
  console.log('   7. Ejecutar en producción\n');

  return {
    totalFields: totalMantener + totalEliminar,
    fieldsToKeep: totalMantener,
    fieldsToRemove: totalEliminar,
    analysis,
  };
}

async function main() {
  try {
    await analyzeReporteTable();
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

export { analyzeReporteTable };
