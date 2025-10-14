#!/usr/bin/env tsx

import { prisma } from "@/lib/db";

async function analyzeAllTables() {
  console.log("🔍 ANÁLISIS COMPLETO DE LA BASE DE DATOS\n");
  console.log("=".repeat(80));

  // Obtener lista de todas las tablas
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;

  console.log(`\n📊 Total de tablas encontradas: ${tables.length}\n`);

  // Analizar cada tabla
  for (const table of tables) {
    const tableName = table.tablename;

    console.log("\n" + "━".repeat(80));
    console.log(`📋 TABLA: ${tableName}`);
    console.log("━".repeat(80));

    try {
      // Contar registros
      const count = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*)::bigint as count FROM "${tableName}";`
      );
      const recordCount = Number(count[0].count);

      console.log(`\n📊 Registros: ${recordCount}`);

      // Obtener estructura de columnas
      const columns = await prisma.$queryRaw<Array<{
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
      }>>`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      console.log(`\n📐 Estructura (${columns.length} columnas):`);

      // Agrupar por tipo
      const typeGroups: Record<string, string[]> = {};
      columns.forEach(col => {
        const type = col.data_type;
        if (!typeGroups[type]) typeGroups[type] = [];
        typeGroups[type].push(col.column_name);
      });

      Object.entries(typeGroups).forEach(([type, cols]) => {
        console.log(`   ${type}: ${cols.length} columnas`);
      });

      // Contar nullables
      const nullableCount = columns.filter(c => c.is_nullable === 'YES').length;
      const requiredCount = columns.filter(c => c.is_nullable === 'NO').length;
      console.log(`\n   Requeridas: ${requiredCount} | Opcionales: ${nullableCount}`);

      // Detectar foreign keys
      const foreignKeys = await prisma.$queryRaw<Array<{
        column_name: string;
        foreign_table: string;
        foreign_column: string;
      }>>`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table,
          ccu.column_name AS foreign_column
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = ${tableName};
      `;

      if (foreignKeys.length > 0) {
        console.log(`\n🔗 Foreign Keys (${foreignKeys.length}):`);
        foreignKeys.forEach(fk => {
          console.log(`   ${fk.column_name} → ${fk.foreign_table}.${fk.foreign_column}`);
        });
      }

      // Detectar índices
      const indexes = await prisma.$queryRaw<Array<{
        indexname: string;
        indexdef: string;
      }>>`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = ${tableName}
        AND indexname NOT LIKE '%_pkey';
      `;

      if (indexes.length > 0) {
        console.log(`\n📑 Índices (${indexes.length}):`);
        indexes.slice(0, 5).forEach(idx => {
          console.log(`   ${idx.indexname}`);
        });
        if (indexes.length > 5) {
          console.log(`   ... y ${indexes.length - 5} más`);
        }
      }

      // Muestra de datos (si hay registros)
      if (recordCount > 0 && recordCount < 10000) {
        const sample = await prisma.$queryRawUnsafe(
          `SELECT * FROM "${tableName}" LIMIT 1;`
        );

        if (Array.isArray(sample) && sample.length > 0) {
          console.log(`\n📋 Campos en muestra de datos:`);
          const sampleKeys = Object.keys(sample[0]);
          console.log(`   ${sampleKeys.slice(0, 10).join(', ')}`);
          if (sampleKeys.length > 10) {
            console.log(`   ... y ${sampleKeys.length - 10} campos más`);
          }
        }
      }

    } catch (error) {
      console.log(`\n⚠️  Error analizando tabla: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  console.log("\n\n" + "=".repeat(80));
  console.log("✅ ANÁLISIS COMPLETADO");
  console.log("=".repeat(80));
  console.log(`\nTotal de tablas analizadas: ${tables.length}\n`);

  await prisma.$disconnect();
}

analyzeAllTables().catch(console.error);
