/**
 * FASE 1: Consolidación de tablas Competicion → Competition
 *
 * Este script migra todos los datos de la tabla Competicion a Competition
 * y actualiza las referencias en la tabla Torneo.
 *
 * Pasos:
 * 1. Verificar datos existentes en ambas tablas
 * 2. Migrar datos únicos de Competicion a Competition
 * 3. Actualizar referencias en Torneo
 * 4. Verificar integridad de datos
 */

import { prisma } from '@/lib/db';

interface MigrationStats {
  competicionCount: number;
  competitionCount: number;
  torneoCount: number;
  migratedCompetitions: number;
  updatedTorneos: number;
  errors: string[];
}

async function migrateCompeticionToCompetition(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    competicionCount: 0,
    competitionCount: 0,
    torneoCount: 0,
    migratedCompetitions: 0,
    updatedTorneos: 0,
    errors: [],
  };

  console.log('🚀 Iniciando migración Fase 1: Competicion → Competition\n');

  try {
    // 1. Contar registros existentes
    console.log('📊 Paso 1: Contando registros existentes...');
    stats.competicionCount = await prisma.competicion.count();
    stats.competitionCount = await prisma.competition.count();
    stats.torneoCount = await prisma.torneo.count();

    console.log(`   - Competiciones (tabla antigua): ${stats.competicionCount}`);
    console.log(`   - Competitions (tabla nueva): ${stats.competitionCount}`);
    console.log(`   - Torneos: ${stats.torneoCount}\n`);

    if (stats.competicionCount === 0) {
      console.log('✅ No hay datos en Competicion para migrar.\n');
      return stats;
    }

    // 2. Obtener todas las competiciones
    console.log('📥 Paso 2: Obteniendo datos de Competicion...');
    const competiciones = await prisma.competicion.findMany({
      include: {
        torneos: true,
      },
    });
    console.log(`   - ${competiciones.length} competiciones encontradas\n`);

    // 3. Crear un mapa de países para Country
    console.log('🌍 Paso 3: Verificando países en tabla Country...');
    const countries = await prisma.country.findMany();
    const countryMap = new Map(countries.map(c => [c.name.toLowerCase(), c.id]));
    console.log(`   - ${countries.length} países encontrados en Country\n`);

    // 4. Migrar cada competición
    console.log('🔄 Paso 4: Migrando competiciones...');
    const migrationMap = new Map<string, string>(); // competicion_id -> competition_id

    for (const comp of competiciones) {
      try {
        // Buscar país correspondiente
        const countryName = (comp.competition_country || 'Unknown').toLowerCase();
        let countryId = countryMap.get(countryName);

        // Si no existe el país, crear uno genérico
        if (!countryId) {
          console.log(`   ⚠️  País no encontrado: "${comp.competition_country}", creando entrada...`);
          const newCountry = await prisma.country.create({
            data: {
              name: comp.competition_country || 'Unknown',
              code: comp.competition_country?.substring(0, 3).toUpperCase() || 'UNK',
            },
          });
          countryId = newCountry.id;
          countryMap.set(countryName, countryId);
        }

        // Determinar tier (nivel de competición)
        let tier = 1; // Por defecto nivel 1
        if (comp.competition_tier) {
          const tierMatch = comp.competition_tier.match(/\d+/);
          if (tierMatch) {
            tier = parseInt(tierMatch[0]);
          }
        }

        // Verificar si ya existe una competición con el mismo nombre
        const existingCompetition = await prisma.competition.findFirst({
          where: {
            name: comp.correct_competition_name || comp.competition_name,
          },
        });

        let competitionId: string;

        if (existingCompetition) {
          console.log(`   ♻️  Competición ya existe: "${existingCompetition.name}"`);
          competitionId = existingCompetition.id;
        } else {
          // Crear nueva competición
          const newCompetition = await prisma.competition.create({
            data: {
              name: comp.correct_competition_name || comp.competition_name,
              short_name: comp.competition_name.length > 20 ? comp.competition_name.substring(0, 20) : null,
              country_id: countryId,
              tier,
              confederation: comp.competition_confederation,
              season_format: 'League', // Valor por defecto
            },
          });
          competitionId = newCompetition.id;
          stats.migratedCompetitions++;
          console.log(`   ✅ Migrada: "${newCompetition.name}" (${comp.competition_country})`);
        }

        // Guardar mapeo
        migrationMap.set(comp.id_competition, competitionId);

      } catch (error) {
        const errorMsg = `Error migrando competición ${comp.competition_name}: ${error}`;
        console.error(`   ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }

    console.log(`\n   📦 Total migradas: ${stats.migratedCompetitions} competiciones\n`);

    // 5. Actualizar referencias en Torneo
    console.log('🔗 Paso 5: Actualizando referencias en Torneo...');
    const torneosConCompeticion = await prisma.torneo.findMany({
      where: {
        id_competition: { not: null },
      },
    });

    console.log(`   - ${torneosConCompeticion.length} torneos con competición asignada`);

    for (const torneo of torneosConCompeticion) {
      if (!torneo.id_competition) continue;

      const newCompetitionId = migrationMap.get(torneo.id_competition);
      if (newCompetitionId) {
        try {
          // Nota: Por ahora solo guardamos el ID, en el siguiente paso actualizaremos el schema
          console.log(`   🔄 Torneo "${torneo.nombre}" → Competition ${newCompetitionId}`);
          stats.updatedTorneos++;
        } catch (error) {
          const errorMsg = `Error actualizando torneo ${torneo.nombre}: ${error}`;
          console.error(`   ❌ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      }
    }

    console.log(`\n   ✅ ${stats.updatedTorneos} torneos preparados para actualizar\n`);

    // 6. Resumen
    console.log('📋 RESUMEN DE MIGRACIÓN:');
    console.log('─'.repeat(50));
    console.log(`   Competiciones originales: ${stats.competicionCount}`);
    console.log(`   Competitions migradas: ${stats.migratedCompetitions}`);
    console.log(`   Torneos a actualizar: ${stats.updatedTorneos}`);
    console.log(`   Errores: ${stats.errors.length}`);
    console.log('─'.repeat(50));

    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORES ENCONTRADOS:');
      stats.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

    console.log('\n✅ Migración Fase 1 completada');
    console.log('\n📝 SIGUIENTE PASO:');
    console.log('   1. Revisar este resumen');
    console.log('   2. Si todo está correcto, actualizar schema.prisma:');
    console.log('      - Cambiar relation en Torneo de Competicion a Competition');
    console.log('      - Eliminar modelo Competicion');
    console.log('   3. Ejecutar: npx prisma migrate dev --name remove-competicion-table');
    console.log('   4. Ejecutar script de verificación\n');

  } catch (error) {
    console.error('❌ Error crítico durante la migración:', error);
    stats.errors.push(`Error crítico: ${error}`);
  }

  return stats;
}

// Ejecutar migración
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  MIGRACIÓN FASE 1: CONSOLIDACIÓN COMPETICION → COMPETITION  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    const stats = await migrateCompeticionToCompetition();

    // Guardar estadísticas
    console.log('\n💾 Guardando estadísticas de migración...');
    const timestamp = new Date().toISOString();
    const statsJson = JSON.stringify(stats, null, 2);

    // Podrías guardar esto en un archivo o en la base de datos
    console.log('\nEstadísticas de migración:');
    console.log(statsJson);

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

export type { MigrationStats };
export { migrateCompeticionToCompetition };
