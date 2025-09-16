const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function regenerateChartData() {
  console.log('🔄 Regenerando datos de visualización desde atributos...\n');

  try {
    // 1. Limpiar datos de visualización existentes
    console.log('🧹 Limpiando datos de visualización existentes...');
    await prisma.lollipopData.deleteMany({});
    await prisma.beeswarmData.deleteMany({});
    await prisma.radarMetrics.deleteMany({});
    console.log('✅ Datos de visualización limpiados');

    // 2. Obtener todos los jugadores con atributos
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

    if (jugadoresConAtributos.length === 0) {
      console.log('❌ No se encontraron jugadores con atributos');
      return;
    }

    console.log(`📊 Regenerando datos para ${jugadoresConAtributos.length} jugadores...`);

    // 3. Regenerar datos para cada jugador
    for (const jugador of jugadoresConAtributos) {
      console.log(`   🏃‍♂️ Procesando ${jugador.player_name}...`);

      // RadarMetrics
      const radarCategories = generateRadarFromAtributos(jugador.atributos);
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

      // BeeswarmData
      const beeswarmMetrics = generateBeeswarmFromAtributos(jugador.atributos, jugador);
      for (const bee of beeswarmMetrics) {
        await prisma.beeswarmData.create({
          data: {
            metric: bee.metric,
            playerId: jugador.id_player,
            playerName: jugador.player_name,
            value: bee.value,
            position: jugador.position_player || 'Unknown',
            age: jugador.age || 25,
            nationality: jugador.nationality_1 || 'Unknown',
            competition: getCompetitionFromTeam(jugador.team_name),
            trfmValue: (jugador.player_rating || 80) * 1000000,
            isSelected: false,
            period: '2023-24'
          }
        });
      }

      // LollipopData
      const lollipopMetrics = generateLollipopFromAtributos(jugador.atributos, jugador);
      for (const lol of lollipopMetrics) {
        await prisma.lollipopData.create({
          data: {
            playerId: jugador.id_player,
            metricName: lol.metricName,
            value: lol.value,
            rank: lol.rank,
            totalPlayers: 500,
            percentile: lol.percentile,
            category: lol.category,
            period: '2023-24',
            position: jugador.position_player || 'Unknown'
          }
        });
      }
    }

    // 4. Mostrar estadísticas finales
    const stats = await Promise.all([
      prisma.radarMetrics.count(),
      prisma.beeswarmData.count(),
      prisma.lollipopData.count()
    ]);

    console.log('\n🎉 REGENERACIÓN COMPLETADA!');
    console.log('===========================');
    console.log(`🎯 RadarMetrics: ${stats[0]} registros`);
    console.log(`🐝 BeeswarmData: ${stats[1]} registros`);
    console.log(`🍭 LollipopData: ${stats[2]} registros`);
    console.log(`\n✅ Datos regenerados para ${jugadoresConAtributos.length} jugadores`);

  } catch (error) {
    console.error('❌ Error durante la regeneración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Funciones auxiliares (copiadas del script principal)
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

function generateBeeswarmFromAtributos(atributos, jugador) {
  const metrics = [];
  
  // Goals (basado en finishing)
  const goals = (atributos.finishing_fmi || 50) * 0.3;
  metrics.push({ metric: 'Goals', value: Math.round(goals * 10) / 10 });
  
  // Assists (basado en vision y passing)
  const assists = calculateAverage([atributos.vision_fmi, atributos.passing_fmi]) * 0.2;
  metrics.push({ metric: 'Assists', value: Math.round(assists * 10) / 10 });
  
  // Passes (basado en passing)
  const passes = (atributos.passing_fmi || 50) * 20;
  metrics.push({ metric: 'Passes', value: Math.round(passes) });
  
  // Tackles (basado en tackling)
  const tackles = (atributos.tackling_fmi || 30) * 1.5;
  metrics.push({ metric: 'Tackles', value: Math.round(tackles * 10) / 10 });
  
  // Dribbles (basado en dribbling)
  const dribbles = (atributos.dribbling_fmi || 40) * 2;
  metrics.push({ metric: 'Dribbles', value: Math.round(dribbles * 10) / 10 });
  
  // xG (basado en finishing y off_the_ball)
  const xg = calculateAverage([atributos.finishing_fmi, atributos.off_the_ball_fmi]) * 0.25;
  metrics.push({ metric: 'xG', value: Math.round(xg * 10) / 10 });
  
  return metrics;
}

function generateLollipopFromAtributos(atributos, jugador) {
  const metrics = [];
  const categories = ['Attacking', 'Defending', 'Passing', 'Physical'];
  
  categories.forEach(category => {
    let categoryMetrics = [];
    
    switch (category) {
      case 'Attacking':
        categoryMetrics = [
          { name: 'Goals', value: (atributos.finishing_fmi || 50) * 0.3 },
          { name: 'Assists', value: calculateAverage([atributos.vision_fmi, atributos.passing_fmi]) * 0.2 },
          { name: 'Shots', value: (atributos.long_shots_fmi || 50) * 1.5 },
          { name: 'xG', value: calculateAverage([atributos.finishing_fmi, atributos.off_the_ball_fmi]) * 0.25 },
          { name: 'Key Passes', value: (atributos.vision_fmi || 50) * 0.8 }
        ];
        break;
      case 'Defending':
        categoryMetrics = [
          { name: 'Tackles', value: (atributos.tackling_fmi || 30) * 1.5 },
          { name: 'Interceptions', value: (atributos.anticipation_fmi || 40) * 1.2 },
          { name: 'Clearances', value: (atributos.heading_fmi || 30) * 2 },
          { name: 'Blocks', value: (atributos.positioning_fmi || 40) * 0.8 },
          { name: 'Duels Won', value: calculateAverage([atributos.strength_fmi, atributos.aggression_fmi]) * 1.8 }
        ];
        break;
      case 'Passing':
        categoryMetrics = [
          { name: 'Passes', value: (atributos.passing_fmi || 50) * 20 },
          { name: 'Pass Accuracy', value: Math.min(95, (atributos.technique_fmi || 70) * 0.9 + 15) },
          { name: 'Long Passes', value: (atributos.passing_fmi || 50) * 1.5 },
          { name: 'Through Balls', value: (atributos.vision_fmi || 50) * 0.3 },
          { name: 'Crosses', value: (atributos.crossing_fmi || 40) * 1.2 }
        ];
        break;
      case 'Physical':
        categoryMetrics = [
          { name: 'Distance Covered', value: (atributos.stamina_fmi || 70) * 0.12 + 8 },
          { name: 'Sprints', value: (atributos.pace_fmi || 60) * 0.8 },
          { name: 'Aerial Duels', value: (atributos.jumping_fmi || 50) * 1.5 },
          { name: 'Top Speed', value: (atributos.pace_fmi || 60) * 0.3 + 25 },
          { name: 'Stamina', value: Math.min(95, (atributos.stamina_fmi || 70) * 0.9 + 15) }
        ];
        break;
    }
    
    categoryMetrics.forEach(metric => {
      const value = Math.round(metric.value * 10) / 10;
      const rank = Math.floor(Math.random() * 100) + 1;
      const percentile = ((500 - rank) / 500) * 100;
      
      metrics.push({
        metricName: metric.name,
        value: value,
        rank: rank,
        percentile: Math.round(percentile * 10) / 10,
        category: category
      });
    });
  });
  
  return metrics;
}

// Funciones auxiliares
function calculateAverage(values) {
  const validValues = values.filter(v => v != null && v > 0);
  if (validValues.length === 0) return 50;
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
}

function getCompetitionFromTeam(teamName) {
  const competitions = {
    'Real Madrid': 'La Liga',
    'FC Barcelona': 'La Liga',
    'Manchester City': 'Premier League',
    'Liverpool': 'Premier League',
    'Inter Miami': 'MLS'
  };
  return competitions[teamName] || 'Premier League';
}

// Ejecutar la regeneración
regenerateChartData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });