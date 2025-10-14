#!/usr/bin/env tsx

import { prisma } from "@/lib/db";
import { generateReportId, generatePlayerId, isValidReportId, isValidPlayerId } from "@/lib/utils/id-generator";

async function testIdSystems() {
  console.log("🧪 PRUEBA COMPLETA DE SISTEMAS DE IDs\n");
  console.log("=".repeat(70));

  // ============================================================================
  // TEST 1: Verificar IDs actuales
  // ============================================================================

  console.log("\n📊 TEST 1: Verificar IDs actuales en la base de datos");
  console.log("=".repeat(70));

  // Jugadores
  const totalPlayers = await prisma.jugador.count();
  const playersNewFormat = await prisma.jugador.count({
    where: { id_player: { startsWith: 'PLY-' } }
  });

  console.log("\n👥 JUGADORES:");
  console.log(`   Total: ${totalPlayers}`);
  console.log(`   Con formato PLY-NNNNN: ${playersNewFormat}/${totalPlayers} (${((playersNewFormat/totalPlayers)*100).toFixed(1)}%)`);

  const samplePlayers = await prisma.jugador.findMany({
    select: { id_player: true, player_name: true },
    take: 3,
    orderBy: { id_player: 'desc' }
  });

  console.log("\n   Muestra de IDs:");
  samplePlayers.forEach(p => {
    const isValid = isValidPlayerId(p.id_player);
    console.log(`   ${isValid ? '✅' : '❌'} ${p.id_player} → ${p.player_name}`);
  });

  // Reportes
  const totalReports = await prisma.reporte.count();
  const reportsNewFormat = await prisma.reporte.count({
    where: { id_report: { startsWith: 'REP-' } }
  });

  console.log("\n\n📋 REPORTES:");
  console.log(`   Total: ${totalReports}`);
  console.log(`   Con formato REP-YYYY-NNNNN: ${reportsNewFormat}/${totalReports} (${((reportsNewFormat/totalReports)*100).toFixed(1)}%)`);

  const sampleReports = await prisma.reporte.findMany({
    select: { id_report: true, report_date: true },
    take: 3,
    orderBy: { id_report: 'desc' }
  });

  console.log("\n   Muestra de IDs:");
  sampleReports.forEach(r => {
    const isValid = isValidReportId(r.id_report);
    console.log(`   ${isValid ? '✅' : '❌'} ${r.id_report} (${r.report_date?.toISOString().split('T')[0] || 'sin fecha'})`);
  });

  // ============================================================================
  // TEST 2: Generar nuevos IDs
  // ============================================================================

  console.log("\n\n📊 TEST 2: Generar nuevos IDs secuenciales");
  console.log("=".repeat(70));

  console.log("\n🔄 Generando IDs de prueba...\n");

  const newPlayerId = await generatePlayerId();
  console.log(`   Nuevo ID de jugador: ${newPlayerId}`);
  console.log(`   ✅ Formato válido: ${isValidPlayerId(newPlayerId)}`);
  console.log(`   📏 Longitud: ${newPlayerId.length} caracteres`);

  const newReportId = await generateReportId();
  console.log(`\n   Nuevo ID de reporte: ${newReportId}`);
  console.log(`   ✅ Formato válido: ${isValidReportId(newReportId)}`);
  console.log(`   📏 Longitud: ${newReportId.length} caracteres`);

  // ============================================================================
  // TEST 3: Verificar contadores
  // ============================================================================

  console.log("\n\n📊 TEST 3: Estado de contadores");
  console.log("=".repeat(70));

  const counters = await prisma.sequenceCounter.findMany({
    orderBy: [
      { entity_type: 'asc' },
      { year: 'desc' }
    ]
  });

  console.log("\n┌─────────────┬────────┬──────────┬──────────────────────┐");
  console.log("│ Entidad     │ Año    │ Último # │ Próximo ID           │");
  console.log("├─────────────┼────────┼──────────┼──────────────────────┤");

  counters.forEach(counter => {
    const yearDisplay = counter.year === 0 ? 'GLOBAL' : counter.year.toString();
    let nextId = '';

    if (counter.entity_type === 'jugador') {
      nextId = `PLY-${(counter.last_number + 1).toString().padStart(5, '0')}`;
    } else if (counter.entity_type === 'reporte') {
      nextId = `REP-${counter.year}-${(counter.last_number + 1).toString().padStart(5, '0')}`;
    }

    console.log(`│ ${counter.entity_type.padEnd(11)} │ ${yearDisplay.padEnd(6)} │ ${counter.last_number.toString().padStart(8)} │ ${nextId.padEnd(20)} │`);
  });

  console.log("└─────────────┴────────┴──────────┴──────────────────────┘");

  // ============================================================================
  // TEST 4: Verificar relaciones
  // ============================================================================

  console.log("\n\n📊 TEST 4: Verificar integridad de relaciones");
  console.log("=".repeat(70));

  // Reportes con jugadores
  const reportsWithPlayers = await prisma.reporte.count({
    where: {
      id_player: { not: null }
    }
  });

  console.log("\n🔗 Relaciones Reporte → Jugador:");
  console.log(`   Reportes con id_player: ${reportsWithPlayers}/${totalReports}`);

  // Sample de relación
  const sampleRelation = await prisma.reporte.findFirst({
    where: { id_player: { not: null } },
    include: {
      player: {
        select: { id_player: true, player_name: true }
      }
    }
  });

  if (sampleRelation) {
    console.log(`\n   Ejemplo de relación:`);
    console.log(`   Reporte: ${sampleRelation.id_report}`);
    console.log(`   → Jugador: ${sampleRelation.player?.id_player} (${sampleRelation.player?.player_name})`);
  }

  // PlayerRoles
  const playerRolesCount = await prisma.playerRole.count();
  console.log(`\n🔗 Player Roles:`);
  console.log(`   Total roles: ${playerRolesCount}`);

  // ============================================================================
  // TEST 5: Comparación de formatos
  // ============================================================================

  console.log("\n\n📊 TEST 5: Comparación de formatos");
  console.log("=".repeat(70));

  console.log("\n📏 Longitudes:");
  console.log("   CUID antiguo:    25 caracteres (ej: cmg9bhoc00004zwjsz7bwn7hu)");
  console.log("   PLY-NNNNN:        9 caracteres (ej: PLY-00019)");
  console.log("   REP-YYYY-NNNNN:  15 caracteres (ej: REP-2025-00056)");

  console.log("\n💾 Ahorro de espacio:");
  const oldSize = totalPlayers * 25 + totalReports * 25;
  const newSize = totalPlayers * 9 + totalReports * 15;
  const savings = oldSize - newSize;
  const savingsPercent = ((savings / oldSize) * 100).toFixed(1);

  console.log(`   Tamaño antiguo: ${oldSize} bytes`);
  console.log(`   Tamaño nuevo:   ${newSize} bytes`);
  console.log(`   Ahorro:         ${savings} bytes (${savingsPercent}%)`);

  // ============================================================================
  // RESUMEN FINAL
  // ============================================================================

  console.log("\n\n" + "=".repeat(70));
  console.log("✅ RESUMEN FINAL");
  console.log("=".repeat(70));

  const allPlayerIdsValid = playersNewFormat === totalPlayers;
  const allReportIdsValid = reportsNewFormat === totalReports;

  console.log("\n📊 Estado de Migración:");
  console.log(`   ${allPlayerIdsValid ? '✅' : '⚠️'} Jugadores: ${playersNewFormat}/${totalPlayers} con formato PLY-NNNNN`);
  console.log(`   ${allReportIdsValid ? '✅' : '⚠️'} Reportes:  ${reportsNewFormat}/${totalReports} con formato REP-YYYY-NNNNN`);

  console.log("\n🎯 Próximos IDs:");
  console.log(`   Jugador: ${newPlayerId}`);
  console.log(`   Reporte: ${newReportId}`);

  console.log("\n📋 Contadores:");
  console.log(`   ${counters.length} contadores activos`);
  console.log(`   ${counters.reduce((sum, c) => sum + c.last_number, 0)} IDs generados en total`);

  if (allPlayerIdsValid && allReportIdsValid) {
    console.log("\n🎉 ¡Sistema de IDs secuenciales funcionando perfectamente!");
  } else {
    console.log("\n⚠️  Algunos IDs pendientes de migración");
  }

  console.log("\n" + "=".repeat(70) + "\n");

  await prisma.$disconnect();
}

testIdSystems().catch(console.error);
