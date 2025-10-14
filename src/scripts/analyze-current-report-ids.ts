#!/usr/bin/env tsx

import { prisma } from "@/lib/db";

async function analyzeReportIds() {
  console.log("🔍 Analizando IDs de reportes actuales\n");

  const totalReports = await prisma.reporte.count();
  console.log(`📊 Total de reportes: ${totalReports}`);

  const sampleReports = await prisma.reporte.findMany({
    select: {
      id_report: true,
      report_date: true,
      report_status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  console.log("\n📋 Muestra de IDs actuales:");
  sampleReports.forEach((r, i) => {
    console.log(`${i + 1}. ${r.id_report} (${r.report_date?.toISOString().split('T')[0] || 'sin fecha'})`);
  });

  // Analizar distribución por año
  const reportsByYear = await prisma.$queryRaw<Array<{ year: string; count: bigint }>>`
    SELECT
      EXTRACT(YEAR FROM COALESCE(report_date, "createdAt"))::text as year,
      COUNT(*)::bigint as count
    FROM reportes
    GROUP BY year
    ORDER BY year DESC;
  `;

  console.log("\n📅 Reportes por año:");
  reportsByYear.forEach(({ year, count }) => {
    console.log(`   ${year}: ${count} reportes`);
  });

  // Longitud de IDs actuales
  const avgLength = sampleReports.reduce((sum, r) => sum + r.id_report.length, 0) / sampleReports.length;
  console.log(`\n📏 Longitud promedio de ID actual: ${avgLength.toFixed(1)} caracteres`);
  console.log(`📏 Longitud de nuevo formato REP-YYYY-NNNNN: 15 caracteres`);

  await prisma.$disconnect();
}

analyzeReportIds().catch(console.error);
