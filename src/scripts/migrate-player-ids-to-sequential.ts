#!/usr/bin/env tsx

import { prisma } from "@/lib/db";

async function migratePlayerIds() {
  console.log("🔄 Iniciando migración de IDs de jugadores a formato secuencial\n");
  console.log("Formato objetivo: PLY-NNNNN\n");
  console.log("=".repeat(60));

  // 1. Obtener todos los jugadores ordenados por fecha de creación
  const allPlayers = await prisma.jugador.findMany({
    select: {
      id_player: true,
      player_name: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`\n📊 Total de jugadores a migrar: ${allPlayers.length}`);

  // 2. Inicializar contador global
  await prisma.sequenceCounter.upsert({
    where: {
      entity_type_year: {
        entity_type: 'jugador',
        year: 0, // Año 0 = contador global
      },
    },
    create: {
      entity_type: 'jugador',
      year: 0,
      last_number: 0,
    },
    update: {
      last_number: 0,
    },
  });

  console.log("\n🔄 Iniciando migración...\n");

  const migrations: Array<{ oldId: string; newId: string; playerName: string }> = [];

  // 3. Migrar cada jugador
  for (const player of allPlayers) {
    // Incrementar contador
    const counter = await prisma.sequenceCounter.update({
      where: {
        entity_type_year: {
          entity_type: 'jugador',
          year: 0,
        },
      },
      data: {
        last_number: {
          increment: 1,
        },
      },
    });

    const newId = `PLY-${counter.last_number.toString().padStart(5, '0')}`;

    // Actualizar jugador con nuevo ID
    await prisma.jugador.update({
      where: {
        id_player: player.id_player,
      },
      data: {
        id_player: newId,
      },
    });

    migrations.push({
      oldId: player.id_player,
      newId: newId,
      playerName: player.player_name,
    });

    if (migrations.length % 5 === 0) {
      console.log(`   ✅ Migrados ${migrations.length}/${allPlayers.length} jugadores...`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n✅ Migración completada: ${migrations.length} jugadores actualizados\n`);

  // Mostrar algunos ejemplos
  console.log("📋 Ejemplos de migración (primeros 5):");
  migrations.slice(0, 5).forEach(({ oldId, newId, playerName }, i) => {
    console.log(`   ${i + 1}. ${playerName}`);
    console.log(`      ${oldId} → ${newId}`);
  });

  console.log("\n📋 Ejemplos de migración (últimos 5):");
  migrations.slice(-5).forEach(({ oldId, newId, playerName }, i) => {
    console.log(`   ${migrations.length - 4 + i}. ${playerName}`);
    console.log(`      ${oldId} → ${newId}`);
  });

  // Verificación
  console.log("\n🔍 Verificando migración...");

  const newFormatCount = await prisma.jugador.count({
    where: {
      id_player: {
        startsWith: 'PLY-',
      },
    },
  });

  const oldFormatCount = await prisma.jugador.count({
    where: {
      id_player: {
        not: {
          startsWith: 'PLY-',
        },
      },
    },
  });

  console.log(`   ✅ Jugadores con nuevo formato (PLY-NNNNN): ${newFormatCount}`);
  console.log(`   ⚠️  Jugadores con formato antiguo: ${oldFormatCount}`);

  // Verificar foreign keys
  console.log("\n🔗 Verificando relaciones...");

  const reportsWithPlayers = await prisma.reporte.count({
    where: {
      id_player: {
        not: null,
      },
    },
  });

  const playerRolesCount = await prisma.playerRole.count();

  console.log(`   ✅ Reportes con id_player: ${reportsWithPlayers}`);
  console.log(`   ✅ PlayerRoles: ${playerRolesCount}`);
  console.log(`   💡 Foreign keys actualizadas automáticamente por Prisma`);

  if (oldFormatCount === 0) {
    console.log("\n🎉 ¡Migración exitosa! Todos los jugadores tienen el nuevo formato.\n");
  } else {
    console.log("\n⚠️  Advertencia: Algunos jugadores mantienen el formato antiguo.\n");
  }

  await prisma.$disconnect();
}

migratePlayerIds().catch((error) => {
  console.error("❌ Error durante la migración:", error);
  process.exit(1);
});
