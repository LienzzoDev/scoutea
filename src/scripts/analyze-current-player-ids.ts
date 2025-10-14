#!/usr/bin/env tsx

import { prisma } from "@/lib/db";

async function analyzePlayerIds() {
  console.log("🔍 Analizando IDs de jugadores actuales\n");

  const totalPlayers = await prisma.jugador.count();
  console.log(`📊 Total de jugadores: ${totalPlayers}`);

  const samplePlayers = await prisma.jugador.findMany({
    select: {
      id_player: true,
      player_name: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  console.log("\n📋 Muestra de IDs actuales:");
  samplePlayers.forEach((p, i) => {
    console.log(`${i + 1}. ${p.id_player} → ${p.player_name}`);
  });

  // Longitud de IDs actuales
  const avgLength = samplePlayers.reduce((sum, p) => sum + p.id_player.length, 0) / samplePlayers.length;
  console.log(`\n📏 Longitud promedio de ID actual: ${avgLength.toFixed(1)} caracteres`);
  console.log(`📏 Longitud de nuevo formato PLY-NNNNN: 9 caracteres`);

  // Verificar relaciones que usan id_player
  console.log("\n🔗 Verificando relaciones:");

  const reportsCount = await prisma.reporte.count();
  console.log(`   - Reportes: ${reportsCount} (usan id_player como FK)`);

  const radarMetricsCount = await prisma.radarMetrics.count();
  console.log(`   - RadarMetrics: ${radarMetricsCount} (usan playerId como FK)`);

  const playerRolesCount = await prisma.playerRole.count();
  console.log(`   - PlayerRoles: ${playerRolesCount} (usan player_id como FK)`);

  console.log("\n⚠️  Nota: La migración actualizará todas estas foreign keys automáticamente.\n");

  await prisma.$disconnect();
}

analyzePlayerIds().catch(console.error);
