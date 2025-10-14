/**
 * FASE 4: Análisis de campos correct_*
 *
 * Este script analiza todos los pares de campos (original, correct_*) en el modelo Jugador
 * para determinar cuáles pueden ser consolidados en la tabla PlayerCorrection.
 */

import { prisma } from '@/lib/db';

interface CorrectFieldPair {
  originalField: string;
  correctField: string;
  playersWithCorrection: number;
  sampleCorrections: Array<{
    playerId: string;
    playerName: string;
    originalValue: any;
    correctedValue: any;
  }>;
}

async function analyzeCorrectFields() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  ANÁLISIS FASE 4: CAMPOS CORRECT_*                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const totalPlayers = await prisma.jugador.count();
  console.log(`📊 Total de jugadores: ${totalPlayers}\n`);

  // Lista de pares de campos a analizar
  const fieldPairs = [
    { original: 'date_of_birth', correct: 'correct_date_of_birth' },
    { original: 'position_player', correct: 'correct_position_player' },
    { original: 'foot', correct: 'correct_foot' },
    { original: 'height', correct: 'correct_height' },
    { original: 'nationality_1', correct: 'correct_nationality_1' },
    { original: 'nationality_2', correct: 'correct_nationality_2' },
    { original: 'national_tier', correct: 'correct_national_tier' },
    { original: 'team_name', correct: 'correct_team_name' },
    { original: 'team_loan_from', correct: 'correct_team_loan_from' },
    { original: 'agency', correct: 'correct_agency' },
    { original: 'contract_end', correct: 'correct_contract_end' },
  ];

  const results: CorrectFieldPair[] = [];
  let totalCorrections = 0;

  console.log('🔍 ANÁLISIS DE PARES DE CAMPOS\n');

  for (const pair of fieldPairs) {
    console.log(`📌 ${pair.original} → ${pair.correct}`);
    console.log('─'.repeat(60));

    try {
      // Contar jugadores con corrección
      const playersWithCorrection = await prisma.jugador.count({
        where: {
          AND: [
            { [pair.correct]: { not: null } },
            {
              OR: [
                { [pair.original]: null },
                // Si ambos tienen valor, verificar que sean diferentes
              ],
            },
          ],
        },
      });

      // Obtener muestras de correcciones
      const samplePlayers = await prisma.jugador.findMany({
        where: {
          [pair.correct]: { not: null },
        },
        select: {
          id_player: true,
          player_name: true,
          [pair.original]: true,
          [pair.correct]: true,
        },
        take: 3,
      });

      const sampleCorrections = samplePlayers
        .filter((p: any) => p[pair.original] !== p[pair.correct])
        .map((p: any) => ({
          playerId: p.id_player,
          playerName: p.player_name,
          originalValue: p[pair.original],
          correctedValue: p[pair.correct],
        }));

      results.push({
        originalField: pair.original,
        correctField: pair.correct,
        playersWithCorrection,
        sampleCorrections,
      });

      totalCorrections += playersWithCorrection;

      console.log(`   Jugadores con corrección: ${playersWithCorrection}`);
      if (sampleCorrections.length > 0) {
        console.log('   Ejemplos:');
        sampleCorrections.forEach(sample => {
          console.log(`      - ${sample.playerName}:`);
          console.log(`        Original: ${sample.originalValue || 'null'}`);
          console.log(`        Corregido: ${sample.correctedValue}`);
        });
      }
      console.log();
    } catch (error) {
      console.error(`   ❌ Error analizando ${pair.original}: ${error}\n`);
    }
  }

  // RESUMEN
  console.log('═'.repeat(60));
  console.log('📋 RESUMEN');
  console.log('═'.repeat(60));
  console.log(`\nTotal de pares analizados: ${fieldPairs.length}`);
  console.log(`Total de correcciones encontradas: ${totalCorrections}`);

  const pairsWithCorrections = results.filter(r => r.playersWithCorrection > 0).length;
  console.log(`Pares con correcciones activas: ${pairsWithCorrections}/${fieldPairs.length}`);

  console.log('\n📊 DETALLE POR CAMPO:');
  results
    .sort((a, b) => b.playersWithCorrection - a.playersWithCorrection)
    .forEach(result => {
      const percentage = totalPlayers > 0 ? ((result.playersWithCorrection / totalPlayers) * 100).toFixed(1) : '0';
      console.log(`   ${result.originalField.padEnd(25)} → ${result.playersWithCorrection.toString().padStart(3)} jugadores (${percentage}%)`);
    });

  console.log('\n💡 ESTRATEGIA DE MIGRACIÓN:');
  console.log('─'.repeat(60));
  console.log('\n1. TABLA PlayerCorrection (ya existe en schema)');
  console.log('   - Registra historial completo de correcciones');
  console.log('   - Incluye fecha y motivo de cada corrección');
  console.log('   - Auditoría completa de cambios');

  console.log('\n2. MIGRACIÓN DE DATOS:');
  console.log('   a) Para cada par (original, correct_*):');
  console.log('      - Si correct_* tiene valor diferente a original');
  console.log('      - Crear registro en PlayerCorrection');
  console.log('      - Actualizar campo original con valor corregido');
  console.log('      - Eliminar campo correct_*');

  console.log('\n3. BENEFICIOS:');
  console.log(`   ✅ -${fieldPairs.length} campos en modelo Jugador`);
  console.log('   ✅ Historial completo de correcciones');
  console.log('   ✅ Auditoría de quién y cuándo corrigió');
  console.log('   ✅ Posibilidad de revertir correcciones');
  console.log('   ✅ Más escalable para correcciones futuras');

  console.log('\n4. CONSIDERACIONES:');
  console.log('   ⚠️  Los campos correct_* actuales son snapshot simple');
  console.log('   ⚠️  PlayerCorrection permite múltiples correcciones históricas');
  console.log('   ⚠️  Necesitaremos actualizar código que usa correct_* directamente');
  console.log('   ⚠️  Algunos campos ya usan foreign keys (position_id, nationality_id)');

  console.log('\n5. CAMPOS QUE YA NO NECESITAN CORRECT_* (Fase 2):');
  console.log('   ✅ position_player → Usar position_id (foreign key)');
  console.log('   ✅ nationality_1 → Usar nationality_id (foreign key)');
  console.log('   ✅ team_name → Usar team_id (foreign key)');
  console.log('   ℹ️  Estos ya tienen mecanismo normalizado');

  console.log('\n6. CAMPOS CANDIDATOS PARA PLAYERCORERCTION:');
  const candidateFields = results.filter(r =>
    !['position_player', 'nationality_1', 'team_name'].includes(r.originalField) &&
    r.playersWithCorrection > 0
  );
  candidateFields.forEach(field => {
    console.log(`   - ${field.originalField} (${field.playersWithCorrection} correcciones)`);
  });

  console.log('\n🎯 RECOMENDACIÓN:');
  console.log('   Opción A: Migración completa');
  console.log(`     - Eliminar ${fieldPairs.length} campos correct_*`);
  console.log('     - Usar PlayerCorrection para historial');
  console.log('     - Máximo beneficio, requiere más trabajo');
  console.log('');
  console.log('   Opción B: Migración parcial (RECOMENDADA)');
  console.log('     - Mantener campos con pocas correcciones');
  console.log('     - Migrar solo campos con correcciones frecuentes');
  console.log('     - Balance entre beneficio y esfuerzo');
  console.log('');
  console.log('   Opción C: No migrar');
  console.log('     - Mantener status quo');
  console.log('     - Ya se obtuvieron grandes beneficios en Fases 1-3');
  console.log('     - Esta fase es opcional/nice-to-have\n');

  return {
    totalPlayers,
    fieldPairs: results,
    totalCorrections,
    pairsWithCorrections,
  };
}

async function main() {
  try {
    await analyzeCorrectFields();
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

export { analyzeCorrectFields };
