#!/usr/bin/env tsx

import { generateReportId, isValidReportId, parseReportId, getNextReportNumber } from "@/lib/utils/id-generator";
import { prisma } from "@/lib/db";

async function testReportIdGenerator() {
  console.log("🧪 Probando generador de IDs de reportes\n");
  console.log("=".repeat(60));

  // TEST 1: Ver siguiente número disponible
  console.log("\n📊 TEST 1: Siguiente número disponible");
  const nextNumber = await getNextReportNumber(2025);
  console.log(`   Siguiente número para 2025: ${nextNumber}`);
  console.log(`   Próximo ID será: REP-2025-${nextNumber.toString().padStart(5, '0')}`);

  // TEST 2: Validación de IDs
  console.log("\n✅ TEST 2: Validación de formato");
  const testCases = [
    { id: 'REP-2025-00056', expected: true },
    { id: 'REP-2024-00001', expected: true },
    { id: 'INVALID-ID', expected: false },
    { id: 'REP-2025-123', expected: false }, // No tiene 5 dígitos
    { id: 'REP-25-00001', expected: false },  // Año no tiene 4 dígitos
  ];

  testCases.forEach(({ id, expected }) => {
    const result = isValidReportId(id);
    const status = result === expected ? '✅' : '❌';
    console.log(`   ${status} ${id}: ${result} (esperado: ${expected})`);
  });

  // TEST 3: Parsing de IDs
  console.log("\n🔍 TEST 3: Extracción de información");
  const sampleIds = ['REP-2025-00056', 'REP-2024-00001'];
  sampleIds.forEach(id => {
    const parsed = parseReportId(id);
    if (parsed) {
      console.log(`   ${id} → Año: ${parsed.year}, Secuencia: ${parsed.sequence}`);
    }
  });

  // TEST 4: Ver últimos reportes creados
  console.log("\n📋 TEST 4: Últimos reportes en la BD");
  const latestReports = await prisma.reporte.findMany({
    select: {
      id_report: true,
      report_date: true,
      createdAt: true,
    },
    orderBy: {
      id_report: 'desc',
    },
    take: 5,
  });

  console.log("   Últimos 5 reportes:");
  latestReports.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.id_report} (${r.report_date?.toISOString().split('T')[0]})`);
  });

  // TEST 5: Contar reportes por año
  console.log("\n📊 TEST 5: Reportes por año (formato nuevo)");
  const reports2024 = await prisma.reporte.count({
    where: { id_report: { startsWith: 'REP-2024-' } }
  });
  const reports2025 = await prisma.reporte.count({
    where: { id_report: { startsWith: 'REP-2025-' } }
  });
  const totalNew = reports2024 + reports2025;

  console.log(`   2024: ${reports2024} reportes`);
  console.log(`   2025: ${reports2025} reportes`);
  console.log(`   Total: ${totalNew} reportes con nuevo formato`);

  // TEST 6: Verificar contadores
  console.log("\n🔢 TEST 6: Estado de contadores");
  const counters = await prisma.sequenceCounter.findMany({
    where: { entity_type: 'reporte' },
    orderBy: { year: 'desc' },
  });

  counters.forEach(counter => {
    console.log(`   ${counter.year}: último número = ${counter.last_number}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Todos los tests completados\n");

  await prisma.$disconnect();
}

testReportIdGenerator().catch(console.error);
