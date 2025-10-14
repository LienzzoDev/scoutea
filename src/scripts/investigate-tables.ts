#!/usr/bin/env tsx

import { prisma } from "@/lib/db";

async function investigateTables() {
  console.log("🔍 INVESTIGACIÓN DE TABLAS: sequence_counters y radar_metrics\n");
  console.log("=".repeat(70));

  // ============================================================================
  // INVESTIGAR SEQUENCE_COUNTERS
  // ============================================================================

  console.log("\n📊 TABLA: sequence_counters");
  console.log("=".repeat(70));

  const allCounters = await prisma.sequenceCounter.findMany({
    orderBy: [
      { entity_type: 'asc' },
      { year: 'desc' },
    ],
  });

  console.log(`\n📈 Total de contadores: ${allCounters.length}`);
  console.log("\n📋 Contadores actuales:\n");

  allCounters.forEach(counter => {
    const yearDisplay = counter.year === 0 ? 'GLOBAL' : counter.year.toString();
    console.log(`   ${counter.entity_type.padEnd(15)} | Año: ${yearDisplay.padEnd(6)} | Último: ${counter.last_number.toString().padStart(5)}`);
  });

  // Estadísticas por tipo
  console.log("\n📊 Estadísticas por tipo de entidad:");
  const countersByType = allCounters.reduce((acc, c) => {
    if (!acc[c.entity_type]) {
      acc[c.entity_type] = { count: 0, total: 0 };
    }
    acc[c.entity_type].count++;
    acc[c.entity_type].total += c.last_number;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  Object.entries(countersByType).forEach(([type, stats]) => {
    console.log(`   ${type}:`);
    console.log(`     - Contadores: ${stats.count}`);
    console.log(`     - Total IDs generados: ${stats.total}`);
  });

  // ============================================================================
  // INVESTIGAR RADAR_METRICS
  // ============================================================================

  console.log("\n\n📊 TABLA: radar_metrics");
  console.log("=".repeat(70));

  const totalMetrics = await prisma.radarMetrics.count();
  console.log(`\n📈 Total de métricas: ${totalMetrics}`);

  if (totalMetrics === 0) {
    console.log("\n⚠️  La tabla está vacía (sin métricas registradas)");
  } else {
    // Ver sample de métricas
    const sampleMetrics = await prisma.radarMetrics.findMany({
      take: 5,
      orderBy: {
        calculatedAt: 'desc',
      },
      include: {
        player: {
          select: {
            id_player: true,
            player_name: true,
          },
        },
      },
    });

    console.log("\n📋 Muestra de métricas (últimas 5):");
    sampleMetrics.forEach((m, i) => {
      console.log(`\n   ${i + 1}. Jugador: ${m.player?.player_name || 'N/A'} (${m.player?.id_player})`);
      console.log(`      Categoría: ${m.category}`);
      console.log(`      Valor: ${m.playerValue.toFixed(2)}`);
      console.log(`      Percentil: ${m.percentile?.toFixed(1) || 'N/A'}%`);
      console.log(`      Período: ${m.period}`);
      console.log(`      Calculado: ${m.calculatedAt.toISOString().split('T')[0]}`);
    });

    // Análisis por categoría
    const metricsByCategory = await prisma.$queryRaw<Array<{ category: string; count: bigint }>>`
      SELECT category, COUNT(*)::bigint as count
      FROM radar_metrics
      GROUP BY category
      ORDER BY count DESC;
    `;

    console.log("\n📊 Métricas por categoría:");
    metricsByCategory.forEach(({ category, count }) => {
      console.log(`   ${category}: ${count} métricas`);
    });

    // Análisis por período
    const metricsByPeriod = await prisma.$queryRaw<Array<{ period: string; count: bigint }>>`
      SELECT period, COUNT(*)::bigint as count
      FROM radar_metrics
      GROUP BY period
      ORDER BY count DESC;
    `;

    console.log("\n📊 Métricas por período:");
    metricsByPeriod.forEach(({ period, count }) => {
      console.log(`   ${period}: ${count} métricas`);
    });

    // Jugadores con métricas
    const playersWithMetrics = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT "playerId")::bigint as count
      FROM radar_metrics;
    `;

    console.log(`\n👥 Jugadores con métricas: ${playersWithMetrics[0].count}`);

    // Completitud de datos
    const avgCompleteness = await prisma.radarMetrics.aggregate({
      _avg: {
        dataCompleteness: true,
      },
    });

    console.log(`\n📊 Completitud promedio de datos: ${(avgCompleteness._avg.dataCompleteness || 0).toFixed(1)}%`);
  }

  // ============================================================================
  // ANALIZAR RELACIONES
  // ============================================================================

  console.log("\n\n🔗 ANÁLISIS DE RELACIONES");
  console.log("=".repeat(70));

  // Verificar jugadores sin métricas
  const totalPlayers = await prisma.jugador.count();
  const playersWithMetrics = await prisma.jugador.count({
    where: {
      radarMetrics: {
        some: {},
      },
    },
  });

  console.log(`\n👥 Jugadores totales: ${totalPlayers}`);
  console.log(`👥 Jugadores con métricas radar: ${playersWithMetrics}`);
  console.log(`👥 Jugadores sin métricas: ${totalPlayers - playersWithMetrics}`);

  if (playersWithMetrics > 0) {
    const coverage = ((playersWithMetrics / totalPlayers) * 100).toFixed(1);
    console.log(`📊 Cobertura de métricas: ${coverage}%`);
  }

  // ============================================================================
  // VERIFICAR ESTRUCTURA DE RADAR_METRICS
  // ============================================================================

  console.log("\n\n📐 ESTRUCTURA DE radar_metrics");
  console.log("=".repeat(70));

  console.log(`
  Campos disponibles:
    - id               : Identificador único
    - playerId         : FK a jugadores
    - category         : Categoría de la métrica (ej: "attacking", "defending")
    - playerValue      : Valor del jugador en esta categoría
    - percentile       : Percentil respecto a otros jugadores
    - period           : Período de la métrica (ej: "2024-2025")
    - calculatedAt     : Fecha de cálculo
    - comparisonAverage: Promedio de comparación
    - dataCompleteness : % de datos completos
    - rank             : Ranking en esta categoría
    - sourceAttributes : JSON con atributos fuente
    - totalPlayers     : Total de jugadores comparados
  `);

  console.log("\n" + "=".repeat(70));
  console.log("\n✅ Investigación completada\n");

  await prisma.$disconnect();
}

investigateTables().catch(console.error);
