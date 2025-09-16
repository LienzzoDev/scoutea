const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAtributosOnly() {
  console.log('🔍 Verificando datos basados solo en atributos...\n');

  try {
    // Verificar jugadores con atributos
    const jugadoresConAtributos = await prisma.jugador.findMany({
      include: {
        atributos: true,
        radarMetrics: true,
        beeswarmData: true,
        lollipopData: true
      }
    });

    console.log(`👥 Jugadores con datos completos: ${jugadoresConAtributos.length}`);
    console.log('=====================================');

    jugadoresConAtributos.forEach(jugador => {
      console.log(`\n🏃‍♂️ ${jugador.player_name} (${jugador.position_player})`);
      console.log(`   📊 Rating: ${jugador.player_rating} | Elo: ${jugador.player_elo}`);
      
      if (jugador.atributos) {
        console.log(`   🎯 FMI Total: ${jugador.atributos.total_fmi_pts} pts (${jugador.atributos.total_fmi_pts_norm}% norm)`);
        
        // Mostrar atributos clave según posición
        if (jugador.position_player === 'GK') {
          console.log(`   🥅 Portero: Reflexes ${jugador.atributos.reflexes_fmi} | Handling ${jugador.atributos.handling_fmi} | Aerial ${jugador.atributos.aerial_ability_fmi}`);
        } else if (['ST', 'RW', 'LW'].includes(jugador.position_player)) {
          console.log(`   ⚽ Atacante: Finishing ${jugador.atributos.finishing_fmi} | Dribbling ${jugador.atributos.dribbling_fmi} | Pace ${jugador.atributos.pace_fmi}`);
        } else if (['CM', 'AM', 'DM'].includes(jugador.position_player)) {
          console.log(`   🎭 Centrocampista: Passing ${jugador.atributos.passing_fmi} | Vision ${jugador.atributos.vision_fmi} | Technique ${jugador.atributos.technique_fmi}`);
        } else if (['CB', 'RB', 'LB'].includes(jugador.position_player)) {
          console.log(`   🛡️ Defensor: Tackling ${jugador.atributos.tackling_fmi} | Marking ${jugador.atributos.marking_fmi} | Positioning ${jugador.atributos.positioning_fmi}`);
        }
      }
      
      console.log(`   📈 Datos generados: Radar ${jugador.radarMetrics.length} | Beeswarm ${jugador.beeswarmData.length} | Lollipop ${jugador.lollipopData.length}`);
    });

    // Verificar datos de radar por categorías
    console.log('\n🎯 RADAR METRICS POR CATEGORÍA');
    console.log('===============================');
    const radarPorCategoria = await prisma.radarMetrics.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      _avg: {
        playerValue: true,
        percentile: true
      }
    });

    radarPorCategoria.forEach(cat => {
      console.log(`${cat.category}: ${cat._count.category} registros | Promedio: ${Math.round(cat._avg.playerValue * 10) / 10} | Percentil: ${Math.round(cat._avg.percentile * 10) / 10}%`);
    });

    // Verificar datos de beeswarm por métrica
    console.log('\n🐝 BEESWARM DATA POR MÉTRICA');
    console.log('============================');
    const beeswarmPorMetrica = await prisma.beeswarmData.groupBy({
      by: ['metric'],
      _count: {
        metric: true
      },
      _avg: {
        value: true
      },
      _max: {
        value: true
      },
      _min: {
        value: true
      }
    });

    beeswarmPorMetrica.forEach(met => {
      console.log(`${met.metric}: ${met._count.metric} registros | Rango: ${Math.round(met._min.value * 10) / 10} - ${Math.round(met._max.value * 10) / 10} | Promedio: ${Math.round(met._avg.value * 10) / 10}`);
    });

    // Verificar datos de lollipop por categoría
    console.log('\n🍭 LOLLIPOP DATA POR CATEGORÍA');
    console.log('==============================');
    const lollipopPorCategoria = await prisma.lollipopData.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      _avg: {
        value: true,
        percentile: true
      }
    });

    lollipopPorCategoria.forEach(cat => {
      console.log(`${cat.category}: ${cat._count.category} registros | Valor promedio: ${Math.round(cat._avg.value * 10) / 10} | Percentil promedio: ${Math.round(cat._avg.percentile * 10) / 10}%`);
    });

    // Ejemplo de cómo los atributos se convierten en métricas
    console.log('\n🔄 EJEMPLO DE CONVERSIÓN ATRIBUTOS → MÉTRICAS');
    console.log('==============================================');
    const messi = await prisma.jugador.findFirst({
      where: { player_name: 'Lionel Messi' },
      include: {
        atributos: true,
        beeswarmData: true
      }
    });

    if (messi && messi.atributos) {
      console.log(`\n⭐ ${messi.player_name}:`);
      console.log(`   Finishing FMI: ${messi.atributos.finishing_fmi} → Goals: ${messi.beeswarmData.find(b => b.metric === 'Goals')?.value || 'N/A'}`);
      console.log(`   Vision FMI: ${messi.atributos.vision_fmi} → Assists: ${messi.beeswarmData.find(b => b.metric === 'Assists')?.value || 'N/A'}`);
      console.log(`   Passing FMI: ${messi.atributos.passing_fmi} → Passes: ${messi.beeswarmData.find(b => b.metric === 'Passes')?.value || 'N/A'}`);
      console.log(`   Dribbling FMI: ${messi.atributos.dribbling_fmi} → Dribbles: ${messi.beeswarmData.find(b => b.metric === 'Dribbles')?.value || 'N/A'}`);
    }

    // Resumen final
    const stats = await Promise.all([
      prisma.jugador.count(),
      prisma.atributos.count(),
      prisma.radarMetrics.count(),
      prisma.beeswarmData.count(),
      prisma.lollipopData.count()
    ]);

    console.log('\n🎉 RESUMEN FINAL');
    console.log('================');
    console.log(`👥 Jugadores: ${stats[0]}`);
    console.log(`📊 Atributos: ${stats[1]}`);
    console.log(`🎯 RadarMetrics: ${stats[2]}`);
    console.log(`🐝 BeeswarmData: ${stats[3]}`);
    console.log(`🍭 LollipopData: ${stats[4]}`);

    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    console.log('===========================');
    console.log('🎯 Radar Charts: Basados en promedios de atributos FMI por categoría');
    console.log('🐝 Beeswarm Charts: Métricas calculadas desde atributos específicos');
    console.log('🍭 Lollipop Charts: Rankings generados desde valores de atributos');
    console.log('📊 Fuente única: Tabla atributos con 280+ campos FMI');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la verificación
verifyAtributosOnly()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });