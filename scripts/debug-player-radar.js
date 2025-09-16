const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPlayerRadar() {
  console.log('🔍 Debuggeando problema de Radar API...\n');

  const problemPlayerId = 'cmfdpmfsm0000zwxl888d8ph6';

  try {
    // 1. Verificar si el jugador existe
    console.log(`👤 Buscando jugador con ID: ${problemPlayerId}`);
    const player = await prisma.jugador.findUnique({
      where: { id_player: problemPlayerId },
      include: {
        atributos: true,
        radarMetrics: true
      }
    });

    if (!player) {
      console.log('❌ El jugador NO existe en la base de datos');
      
      // Mostrar jugadores disponibles
      console.log('\n📋 Jugadores disponibles:');
      const availablePlayers = await prisma.jugador.findMany({
        select: {
          id_player: true,
          player_name: true,
          position_player: true
        },
        take: 10
      });

      availablePlayers.forEach(p => {
        console.log(`  - ${p.player_name} (${p.position_player}) - ID: ${p.id_player}`);
      });

      return;
    }

    console.log(`✅ Jugador encontrado: ${player.player_name} (${player.position_player})`);

    // 2. Verificar atributos
    if (!player.atributos) {
      console.log('❌ El jugador NO tiene atributos FMI');
    } else {
      console.log(`✅ Jugador tiene atributos FMI (Total: ${player.atributos.total_fmi_pts} pts)`);
    }

    // 3. Verificar RadarMetrics
    console.log(`\n🎯 RadarMetrics encontrados: ${player.radarMetrics.length}`);
    if (player.radarMetrics.length === 0) {
      console.log('❌ El jugador NO tiene datos de radar');
      
      // Generar datos de radar para este jugador
      console.log('\n🔧 Generando datos de radar...');
      
      if (player.atributos) {
        const radarCategories = generateRadarFromAtributos(player.atributos);
        
        for (const radar of radarCategories) {
          await prisma.radarMetrics.create({
            data: {
              playerId: player.id_player,
              position: player.position_player || 'Unknown',
              category: radar.category,
              playerValue: radar.playerValue,
              positionAverage: radar.positionAverage,
              percentile: radar.percentile,
              period: '2023-24'
            }
          });
        }
        
        console.log(`✅ Generados ${radarCategories.length} RadarMetrics para ${player.player_name}`);
      } else {
        console.log('❌ No se pueden generar datos de radar sin atributos FMI');
      }
    } else {
      console.log('✅ El jugador tiene datos de radar:');
      player.radarMetrics.forEach(r => {
        console.log(`  - ${r.category}: ${r.playerValue} (${r.percentile}%)`);
      });
    }

    // 4. Probar la API manualmente
    console.log('\n🧪 Simulando llamada a la API...');
    
    const radarData = await prisma.radarMetrics.findMany({
      where: {
        playerId: problemPlayerId,
        period: '2023-24'
      },
      orderBy: {
        category: 'asc'
      }
    });

    if (radarData.length === 0) {
      console.log('❌ API devolvería 404 - No radar data found');
    } else {
      console.log(`✅ API devolvería datos exitosamente (${radarData.length} categorías)`);
    }

  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función auxiliar para generar radar desde atributos
function generateRadarFromAtributos(atributos) {
  const categories = [];
  
  // Attacking
  const attacking = calculateAverage([
    atributos.finishing_fmi,
    atributos.dribbling_fmi,
    atributos.off_the_ball_fmi,
    atributos.long_shots_fmi
  ]);
  categories.push({
    category: 'Attacking',
    playerValue: attacking,
    positionAverage: attacking * 0.7,
    percentile: (attacking / 100) * 100
  });
  
  // Defending
  const defending = calculateAverage([
    atributos.tackling_fmi,
    atributos.marking_fmi,
    atributos.positioning_fmi,
    atributos.anticipation_fmi
  ]);
  categories.push({
    category: 'Defending',
    playerValue: defending,
    positionAverage: defending * 0.8,
    percentile: (defending / 100) * 100
  });
  
  // Passing
  const passing = calculateAverage([
    atributos.passing_fmi,
    atributos.vision_fmi,
    atributos.crossing_fmi,
    atributos.technique_fmi
  ]);
  categories.push({
    category: 'Passing',
    playerValue: passing,
    positionAverage: passing * 0.75,
    percentile: (passing / 100) * 100
  });
  
  // Physical
  const physical = calculateAverage([
    atributos.pace_fmi,
    atributos.acceleration_fmi,
    atributos.strength_fmi,
    atributos.stamina_fmi
  ]);
  categories.push({
    category: 'Physical',
    playerValue: physical,
    positionAverage: physical * 0.85,
    percentile: (physical / 100) * 100
  });
  
  // Mental
  const mental = calculateAverage([
    atributos.composure_fmi,
    atributos.decisions_fmi,
    atributos.concentration_fmi,
    atributos.determination_fmi
  ]);
  categories.push({
    category: 'Mental',
    playerValue: mental,
    positionAverage: mental * 0.8,
    percentile: (mental / 100) * 100
  });
  
  return categories;
}

function calculateAverage(values) {
  const validValues = values.filter(v => v != null && v > 0);
  if (validValues.length === 0) return 50;
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
}

// Ejecutar debug
debugPlayerRadar()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });