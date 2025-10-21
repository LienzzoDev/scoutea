import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTeamNamesPrefix() {
  console.log('🔍 Buscando equipos con prefijo "1."...\n');

  // Primero, obtener todos los equipos con el prefijo "1."
  const teamsWithPrefix = await prisma.equipo.findMany({
    where: {
      team_name: {
        startsWith: '1.',
      },
    },
    select: {
      id_team: true,
      team_name: true,
    },
  });

  console.log(`📊 Se encontraron ${teamsWithPrefix.length} equipos con prefijo "1."\n`);

  if (teamsWithPrefix.length === 0) {
    console.log('✅ No hay equipos que necesiten actualización.');
    return;
  }

  // Mostrar algunos ejemplos
  console.log('Ejemplos de equipos que se van a actualizar:');
  teamsWithPrefix.slice(0, 5).forEach((team) => {
    const newName = team.team_name.replace(/^1\./, '').trim();
    console.log(`  "${team.team_name}" → "${newName}"`);
  });
  console.log('');

  // Realizar las actualizaciones
  console.log('🔧 Actualizando nombres de equipos...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const team of teamsWithPrefix) {
    try {
      const newName = team.team_name.replace(/^1\./, '').trim();

      await prisma.equipo.update({
        where: { id_team: team.id_team },
        data: { team_name: newName },
      });

      successCount++;
      console.log(`✓ Actualizado: "${team.team_name}" → "${newName}"`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Error al actualizar "${team.team_name}":`, error);
    }
  }

  console.log('\n📈 Resumen de la actualización:');
  console.log(`  ✅ Actualizados exitosamente: ${successCount}`);
  console.log(`  ❌ Errores: ${errorCount}`);

  // Verificar que no queden equipos con el prefijo
  const remainingTeamsWithPrefix = await prisma.equipo.count({
    where: {
      team_name: {
        startsWith: '1.',
      },
    },
  });

  console.log(`\n🔍 Verificación final: ${remainingTeamsWithPrefix} equipos restantes con prefijo "1."\n`);

  if (remainingTeamsWithPrefix === 0) {
    console.log('✅ ¡Todos los equipos han sido actualizados correctamente!');
  } else {
    console.log('⚠️  Algunos equipos todavía tienen el prefijo "1."');
  }
}

fixTeamNamesPrefix()
  .catch((e) => {
    console.error('❌ Error en el script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });