#!/usr/bin/env tsx

import { prisma } from "@/lib/db";

async function migrateReportIds() {
  console.log("🔄 Iniciando migración de IDs de reportes a formato secuencial\n");
  console.log("Formato objetivo: REP-YYYY-NNNNN\n");
  console.log("=".repeat(60));

  // 1. Obtener todos los reportes ordenados por fecha
  const allReports = await prisma.reporte.findMany({
    select: {
      id_report: true,
      report_date: true,
      createdAt: true,
    },
    orderBy: [
      { report_date: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  console.log(`\n📊 Total de reportes a migrar: ${allReports.length}`);

  // 2. Agrupar por año
  const reportsByYear = new Map<number, typeof allReports>();

  for (const report of allReports) {
    const date = report.report_date || report.createdAt;
    const year = date.getFullYear();

    if (!reportsByYear.has(year)) {
      reportsByYear.set(year, []);
    }
    reportsByYear.get(year)!.push(report);
  }

  console.log("\n📅 Distribución por año:");
  for (const [year, reports] of Array.from(reportsByYear.entries()).sort((a, b) => a[0] - b[0])) {
    console.log(`   ${year}: ${reports.length} reportes`);
  }

  console.log("\n🔄 Iniciando migración...\n");

  let totalMigrated = 0;
  const migrations: Array<{ oldId: string; newId: string }> = [];

  // 3. Migrar por año
  for (const [year, reports] of Array.from(reportsByYear.entries()).sort((a, b) => a[0] - b[0])) {
    console.log(`\n📆 Migrando reportes de ${year}...`);

    // Inicializar contador para este año
    await prisma.sequenceCounter.upsert({
      where: {
        entity_type_year: {
          entity_type: 'reporte',
          year: year,
        },
      },
      create: {
        entity_type: 'reporte',
        year: year,
        last_number: 0,
      },
      update: {
        last_number: 0,
      },
    });

    // Migrar cada reporte
    for (const report of reports) {
      // Incrementar contador
      const counter = await prisma.sequenceCounter.update({
        where: {
          entity_type_year: {
            entity_type: 'reporte',
            year: year,
          },
        },
        data: {
          last_number: {
            increment: 1,
          },
        },
      });

      const newId = `REP-${year}-${counter.last_number.toString().padStart(5, '0')}`;

      // Actualizar reporte con nuevo ID
      await prisma.reporte.update({
        where: {
          id_report: report.id_report,
        },
        data: {
          id_report: newId,
        },
      });

      migrations.push({
        oldId: report.id_report,
        newId: newId,
      });

      totalMigrated++;

      if (totalMigrated % 10 === 0) {
        console.log(`   ✅ Migrados ${totalMigrated}/${allReports.length} reportes...`);
      }
    }

    console.log(`   ✅ ${year}: ${reports.length} reportes migrados`);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n✅ Migración completada: ${totalMigrated} reportes actualizados\n`);

  // Mostrar algunos ejemplos
  console.log("📋 Ejemplos de migración (primeros 5):");
  migrations.slice(0, 5).forEach(({ oldId, newId }, i) => {
    console.log(`   ${i + 1}. ${oldId} → ${newId}`);
  });

  console.log("\n📋 Ejemplos de migración (últimos 5):");
  migrations.slice(-5).forEach(({ oldId, newId }, i) => {
    console.log(`   ${migrations.length - 4 + i}. ${oldId} → ${newId}`);
  });

  // Verificación
  console.log("\n🔍 Verificando migración...");

  const newFormatCount = await prisma.reporte.count({
    where: {
      id_report: {
        startsWith: 'REP-',
      },
    },
  });

  const oldFormatCount = await prisma.reporte.count({
    where: {
      id_report: {
        not: {
          startsWith: 'REP-',
        },
      },
    },
  });

  console.log(`   ✅ Reportes con nuevo formato (REP-YYYY-NNNNN): ${newFormatCount}`);
  console.log(`   ⚠️  Reportes con formato antiguo: ${oldFormatCount}`);

  if (oldFormatCount === 0) {
    console.log("\n🎉 ¡Migración exitosa! Todos los reportes tienen el nuevo formato.\n");
  } else {
    console.log("\n⚠️  Advertencia: Algunos reportes mantienen el formato antiguo.\n");
  }

  await prisma.$disconnect();
}

migrateReportIds().catch((error) => {
  console.error("❌ Error durante la migración:", error);
  process.exit(1);
});
