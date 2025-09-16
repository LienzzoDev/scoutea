const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyNewRadarCategories() {
  console.log('🎯 Verificando nuevas categorías del radar...\n');

  try {
    // 1. Verificar todas las categorías disponibles
    const allCategories = await prisma.radarMetrics.findMany({
      select: {
        category: true
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc'
      }
    });

    console.log(`📊 Categorías disponibles (${allCategories.length}):`);
    allCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.category}`);
    });

    // 2. Verificar datos para Lionel Messi
    const messiId = 'cmfmeeqfb0001zweuke6bhyhp';
    const messiRadar = await prisma.radarMetrics.findMany({
      where: {
        playerId: messiId,
        period: '2023-24'
      },
      orderBy: {
        category: 'asc'
      }
    });

    console.log(`\n⭐ Datos de Lionel Messi (${messiRadar.length} categorías):`);
    messiRadar.forEach(radar => {
      console.log(`   ${radar.category}: ${radar.playerValue} (${radar.percentile}%)`);
    });

    // 3. Verificar que tenemos exactamente las 9 categorías esperadas
    const expectedCategories = [
      'Def Stopped Ball',
      'Def Transition', 
      'Evitation',
      'Finishing',
      'Maintenance',
      'Off Stopped Ball',
      'Off Transition',
      'Progression',
      'Recovery'
    ];

    console.log('\n✅ Verificación de categorías esperadas:');
    expectedCategories.forEach(expected => {
      const found = allCategories.find(cat => cat.category === expected);
      console.log(`   ${found ? '✅' : '❌'} ${expected}`);
    });

    // 4. Contar jugadores por categoría
    const categoryStats = await prisma.radarMetrics.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      _avg: {
        playerValue: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    console.log('\n📈 Estadísticas por categoría:');
    categoryStats.forEach(stat => {
      console.log(`   ${stat.category}: ${stat._count.category} jugadores, promedio ${Math.round(stat._avg.playerValue * 10) / 10}`);
    });

    console.log('\n🎉 Verificación completada!');
    console.log('\n💡 Para probar el radar actualizado:');
    console.log('   1. Reinicia el servidor de desarrollo');
    console.log('   2. Ve a http://localhost:3000/test-radar');
    console.log('   3. O navega a cualquier jugador → Stats → Radar');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNewRadarCategories()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });