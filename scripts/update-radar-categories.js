const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateRadarCategories() {
  console.log('🎯 Actualizando categorías del radar a versión táctica avanzada...\n');

  try {
    // 1. Limpiar RadarMetrics existentes
    console.log('🧹 Limpiando RadarMetrics existentes...');
    await prisma.radarMetrics.deleteMany({});
    console.log('✅ RadarMetrics limpiados');

    // 2. Obtener jugadores con atributos
    const jugadoresConAtributos = await prisma.jugador.findMany({
      include: {
        atributos: true
      },
      where: {
        atributos: {
          isNot: null
        }
      }
    });

    console.log(`📊 Procesando ${jugadoresConAtributos.length} jugadores...`);

    // 3. Generar nuevos RadarMetrics con categorías tácticas
    for (const jugador of jugadoresConAtributos) {
      console.log(`   🏃‍♂️ Procesando ${jugador.player_name}...`);
      
      const radarCategories = generateTacticalRadarFromAtributos(jugador.atributos);
      
      for (const radar of radarCategories) {
        await prisma.radarMetrics.create({
          data: {
            playerId: jugador.id_player,
            position: jugador.position_player || 'Unknown',
            category: radar.category,
            playerValue: radar.playerValue,
            positionAverage: radar.positionAverage,
            percentile: radar.percentile,
            period: '2023-24'
          }
        });
      }
    }

    // 4. Mostrar estadísticas finales
    const totalRadarMetrics = await prisma.radarMetrics.count();
    console.log(`\n🎉 Actualización completada!`);
    console.log(`📊 Total RadarMetrics generados: ${totalRadarMetrics}`);

    // 5. Mostrar ejemplo de las nuevas categorías
    const ejemploRadar = await prisma.radarMetrics.findMany({
      where: {
        playerId: jugadoresConAtributos[0].id_player
      },
      orderBy: {
        category: 'asc'
      }
    });

    console.log(`\n📋 Nuevas categorías para ${jugadoresConAtributos[0].player_name}:`);
    ejemploRadar.forEach(radar => {
      console.log(`   - ${radar.category}: ${radar.playerValue} (${radar.percentile}%)`);
    });

  } catch (error) {
    console.error('❌ Error durante la actualización:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función para generar categorías tácticas avanzadas
function generateTacticalRadarFromAtributos(atributos) {
  const categories = [];
  
  // Off Transition (Transición ofensiva)
  const offTransition = calculateAverage([
    atributos.pace_fmi,
    atributos.acceleration_fmi,
    atributos.dribbling_fmi,
    atributos.off_the_ball_fmi,
    atributos.decisions_fmi
  ]);
  categories.push({
    category: 'Off Transition',
    playerValue: offTransition,
    positionAverage: offTransition * 0.75,
    percentile: (offTransition / 100) * 100
  });
  
  // Maintenance (Mantenimiento/Posesión)
  const maintenance = calculateAverage([
    atributos.passing_fmi,
    atributos.technique_fmi,
    atributos.composure_fmi,
    atributos.first_touch_fmi,
    atributos.vision_fmi
  ]);
  categories.push({
    category: 'Maintenance',
    playerValue: maintenance,
    positionAverage: maintenance * 0.8,
    percentile: (maintenance / 100) * 100
  });
  
  // Progression (Progresión)
  const progression = calculateAverage([
    atributos.passing_fmi,
    atributos.vision_fmi,
    atributos.dribbling_fmi,
    atributos.crossing_fmi,
    atributos.long_shots_fmi
  ]);
  categories.push({
    category: 'Progression',
    playerValue: progression,
    positionAverage: progression * 0.75,
    percentile: (progression / 100) * 100
  });
  
  // Finishing (Finalización)
  const finishing = calculateAverage([
    atributos.finishing_fmi,
    atributos.composure_fmi,
    atributos.technique_fmi,
    atributos.long_shots_fmi,
    atributos.heading_fmi
  ]);
  categories.push({
    category: 'Finishing',
    playerValue: finishing,
    positionAverage: finishing * 0.7,
    percentile: (finishing / 100) * 100
  });
  
  // Off Stopped Ball (Balón parado ofensivo)
  const offStoppedBall = calculateAverage([
    atributos.free_kick_taking_fmi,
    atributos.corners_fmi,
    atributos.penalty_taking_fmi,
    atributos.crossing_fmi,
    atributos.technique_fmi
  ]);
  categories.push({
    category: 'Off Stopped Ball',
    playerValue: offStoppedBall,
    positionAverage: offStoppedBall * 0.8,
    percentile: (offStoppedBall / 100) * 100
  });
  
  // Def Transition (Transición defensiva)
  const defTransition = calculateAverage([
    atributos.tackling_fmi,
    atributos.anticipation_fmi,
    atributos.positioning_fmi,
    atributos.pace_fmi,
    atributos.work_rate_fmi
  ]);
  categories.push({
    category: 'Def Transition',
    playerValue: defTransition,
    positionAverage: defTransition * 0.8,
    percentile: (defTransition / 100) * 100
  });
  
  // Recovery (Recuperación)
  const recovery = calculateAverage([
    atributos.tackling_fmi,
    atributos.anticipation_fmi,
    atributos.work_rate_fmi,
    atributos.stamina_fmi,
    atributos.aggression_fmi
  ]);
  categories.push({
    category: 'Recovery',
    playerValue: recovery,
    positionAverage: recovery * 0.85,
    percentile: (recovery / 100) * 100
  });
  
  // Evitation (Evitación/Salida de presión)
  const evitation = calculateAverage([
    atributos.dribbling_fmi,
    atributos.composure_fmi,
    atributos.balance_fmi,
    atributos.agility_fmi,
    atributos.first_touch_fmi
  ]);
  categories.push({
    category: 'Evitation',
    playerValue: evitation,
    positionAverage: evitation * 0.75,
    percentile: (evitation / 100) * 100
  });
  
  // Def Stopped Ball (Balón parado defensivo)
  const defStoppedBall = calculateAverage([
    atributos.heading_fmi,
    atributos.jumping_fmi,
    atributos.marking_fmi,
    atributos.positioning_fmi,
    atributos.strength_fmi
  ]);
  categories.push({
    category: 'Def Stopped Ball',
    playerValue: defStoppedBall,
    positionAverage: defStoppedBall * 0.8,
    percentile: (defStoppedBall / 100) * 100
  });
  
  return categories;
}

// Función auxiliar
function calculateAverage(values) {
  const validValues = values.filter(v => v != null && v > 0);
  if (validValues.length === 0) return 50;
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
}

// Ejecutar la actualización
updateRadarCategories()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });