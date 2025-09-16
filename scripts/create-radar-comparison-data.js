const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createRadarComparisonData() {
  console.log('🎯 Creando datos de comparación para Radar Chart...\n');

  try {
    // 1. Obtener todos los jugadores con atributos
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

    // 2. Calcular promedios por posición
    const promediosPorPosicion = calcularPromediosPorPosicion(jugadoresConAtributos);
    
    console.log('\n📈 Promedios por posición:');
    Object.entries(promediosPorPosicion).forEach(([posicion, datos]) => {
      console.log(`${posicion}: ${datos.count} jugadores`);
    });

    // 3. Limpiar y regenerar RadarMetrics con datos comparativos
    console.log('\n🔄 Regenerando RadarMetrics con datos comparativos...');
    await prisma.radarMetrics.deleteMany({});

    for (const jugador of jugadoresConAtributos) {
      const radarData = generateRadarComparisonData(
        jugador, 
        jugadoresConAtributos, 
        promediosPorPosicion
      );

      for (const radar of radarData) {
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

      console.log(`   ✅ ${jugador.player_name} - Radar data generado`);
    }

    // 4. Crear datos de ejemplo para comparaciones específicas
    console.log('\n🔍 Creando ejemplos de comparación...');
    
    // Ejemplo: Comparar Messi vs otros extremos
    const messi = jugadoresConAtributos.find(j => j.player_name === 'Lionel Messi');
    const extremos = jugadoresConAtributos.filter(j => 
      ['RW', 'LW', 'RM', 'LM'].includes(j.position_player)
    );

    if (messi && extremos.length > 1) {
      console.log(`\n⭐ Ejemplo: ${messi.player_name} vs otros extremos:`);
      const comparison = comparePlayerWithGroup(messi, extremos);
      
      Object.entries(comparison).forEach(([category, data]) => {
        console.log(`   ${category}: ${data.playerValue} (Percentil: ${data.percentile}%)`);
      });
    }

    // 5. Mostrar estadísticas finales
    const totalRadarMetrics = await prisma.radarMetrics.count();
    console.log(`\n🎉 Completado! ${totalRadarMetrics} RadarMetrics generados`);

    // 6. Crear función de utilidad para obtener datos de comparación
    await createRadarUtilityFunctions();

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function calcularPromediosPorPosicion(jugadores) {
  const promedios = {};

  jugadores.forEach(jugador => {
    const posicion = jugador.position_player || 'Unknown';
    
    if (!promedios[posicion]) {
      promedios[posicion] = {
        count: 0,
        attacking: [],
        defending: [],
        passing: [],
        physical: [],
        mental: []
      };
    }

    const attr = jugador.atributos;
    promedios[posicion].count++;

    // Calcular valores por categoría
    promedios[posicion].attacking.push(calculateAverage([
      attr.finishing_fmi,
      attr.dribbling_fmi,
      attr.off_the_ball_fmi,
      attr.long_shots_fmi
    ]));

    promedios[posicion].defending.push(calculateAverage([
      attr.tackling_fmi,
      attr.marking_fmi,
      attr.positioning_fmi,
      attr.anticipation_fmi
    ]));

    promedios[posicion].passing.push(calculateAverage([
      attr.passing_fmi,
      attr.vision_fmi,
      attr.crossing_fmi,
      attr.technique_fmi
    ]));

    promedios[posicion].physical.push(calculateAverage([
      attr.pace_fmi,
      attr.acceleration_fmi,
      attr.strength_fmi,
      attr.stamina_fmi
    ]));

    promedios[posicion].mental.push(calculateAverage([
      attr.composure_fmi,
      attr.decisions_fmi,
      attr.concentration_fmi,
      attr.determination_fmi
    ]));
  });

  // Calcular promedios finales
  Object.keys(promedios).forEach(posicion => {
    const data = promedios[posicion];
    promedios[posicion] = {
      count: data.count,
      attacking: calculateAverage(data.attacking),
      defending: calculateAverage(data.defending),
      passing: calculateAverage(data.passing),
      physical: calculateAverage(data.physical),
      mental: calculateAverage(data.mental)
    };
  });

  return promedios;
}

function generateRadarComparisonData(jugador, todosJugadores, promediosPorPosicion) {
  const attr = jugador.atributos;
  const posicion = jugador.position_player || 'Unknown';
  const promediosPosicion = promediosPorPosicion[posicion] || {};

  const categories = ['Attacking', 'Defending', 'Passing', 'Physical', 'Mental'];
  const radarData = [];

  categories.forEach(category => {
    let playerValue, positionAverage;

    switch (category) {
      case 'Attacking':
        playerValue = calculateAverage([
          attr.finishing_fmi,
          attr.dribbling_fmi,
          attr.off_the_ball_fmi,
          attr.long_shots_fmi
        ]);
        positionAverage = promediosPosicion.attacking || 50;
        break;

      case 'Defending':
        playerValue = calculateAverage([
          attr.tackling_fmi,
          attr.marking_fmi,
          attr.positioning_fmi,
          attr.anticipation_fmi
        ]);
        positionAverage = promediosPosicion.defending || 50;
        break;

      case 'Passing':
        playerValue = calculateAverage([
          attr.passing_fmi,
          attr.vision_fmi,
          attr.crossing_fmi,
          attr.technique_fmi
        ]);
        positionAverage = promediosPosicion.passing || 50;
        break;

      case 'Physical':
        playerValue = calculateAverage([
          attr.pace_fmi,
          attr.acceleration_fmi,
          attr.strength_fmi,
          attr.stamina_fmi
        ]);
        positionAverage = promediosPosicion.physical || 50;
        break;

      case 'Mental':
        playerValue = calculateAverage([
          attr.composure_fmi,
          attr.decisions_fmi,
          attr.concentration_fmi,
          attr.determination_fmi
        ]);
        positionAverage = promediosPosicion.mental || 50;
        break;

      default:
        playerValue = 50;
        positionAverage = 50;
    }

    // Calcular percentil comparando con todos los jugadores de la misma posición
    const jugadoresMismaPosicion = todosJugadores.filter(j => 
      j.position_player === jugador.position_player
    );
    
    const percentile = calculatePercentile(playerValue, jugadoresMismaPosicion, category);

    radarData.push({
      category,
      playerValue: Math.round(playerValue * 10) / 10,
      positionAverage: Math.round(positionAverage * 10) / 10,
      percentile: Math.round(percentile * 10) / 10
    });
  });

  return radarData;
}

function comparePlayerWithGroup(jugador, grupo) {
  const attr = jugador.atributos;
  const categories = ['Attacking', 'Defending', 'Passing', 'Physical', 'Mental'];
  const comparison = {};

  categories.forEach(category => {
    let playerValue;

    switch (category) {
      case 'Attacking':
        playerValue = calculateAverage([
          attr.finishing_fmi,
          attr.dribbling_fmi,
          attr.off_the_ball_fmi,
          attr.long_shots_fmi
        ]);
        break;

      case 'Defending':
        playerValue = calculateAverage([
          attr.tackling_fmi,
          attr.marking_fmi,
          attr.positioning_fmi,
          attr.anticipation_fmi
        ]);
        break;

      case 'Passing':
        playerValue = calculateAverage([
          attr.passing_fmi,
          attr.vision_fmi,
          attr.crossing_fmi,
          attr.technique_fmi
        ]);
        break;

      case 'Physical':
        playerValue = calculateAverage([
          attr.pace_fmi,
          attr.acceleration_fmi,
          attr.strength_fmi,
          attr.stamina_fmi
        ]);
        break;

      case 'Mental':
        playerValue = calculateAverage([
          attr.composure_fmi,
          attr.decisions_fmi,
          attr.concentration_fmi,
          attr.determination_fmi
        ]);
        break;

      default:
        playerValue = 50;
    }

    const percentile = calculatePercentile(playerValue, grupo, category);

    comparison[category] = {
      playerValue: Math.round(playerValue * 10) / 10,
      percentile: Math.round(percentile * 10) / 10,
      groupSize: grupo.length
    };
  });

  return comparison;
}

function calculatePercentile(playerValue, grupo, category) {
  const valores = grupo.map(j => {
    const attr = j.atributos;
    if (!attr) return 50;

    switch (category) {
      case 'Attacking':
        return calculateAverage([
          attr.finishing_fmi,
          attr.dribbling_fmi,
          attr.off_the_ball_fmi,
          attr.long_shots_fmi
        ]);

      case 'Defending':
        return calculateAverage([
          attr.tackling_fmi,
          attr.marking_fmi,
          attr.positioning_fmi,
          attr.anticipation_fmi
        ]);

      case 'Passing':
        return calculateAverage([
          attr.passing_fmi,
          attr.vision_fmi,
          attr.crossing_fmi,
          attr.technique_fmi
        ]);

      case 'Physical':
        return calculateAverage([
          attr.pace_fmi,
          attr.acceleration_fmi,
          attr.strength_fmi,
          attr.stamina_fmi
        ]);

      case 'Mental':
        return calculateAverage([
          attr.composure_fmi,
          attr.decisions_fmi,
          attr.concentration_fmi,
          attr.determination_fmi
        ]);

      default:
        return 50;
    }
  });

  const menoresOIguales = valores.filter(v => v <= playerValue).length;
  return (menoresOIguales / valores.length) * 100;
}

function calculateAverage(values) {
  const validValues = values.filter(v => v != null && v > 0);
  if (validValues.length === 0) return 50;
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
}

async function createRadarUtilityFunctions() {
  console.log('\n📝 Creando funciones de utilidad para el frontend...');
  
  const utilityCode = `
// Funciones de utilidad para RadarChart - Generadas automáticamente
// Usar en el componente PlayerRadar.tsx

export interface RadarComparisonData {
  category: string;
  playerValue: number;
  positionAverage: number;
  percentile: number;
  rank?: number;
  totalPlayers?: number;
}

export interface RadarFilters {
  position?: string;
  age?: { min: number; max: number };
  nationality?: string;
  competition?: string;
  trfmValue?: { min: number; max: number };
}

// Obtener datos de radar para un jugador específico
export async function getPlayerRadarData(playerId: string): Promise<RadarComparisonData[]> {
  // Implementar llamada a API
  const response = await fetch(\`/api/players/\${playerId}/radar\`);
  return response.json();
}

// Comparar jugador con grupo filtrado
export async function comparePlayerWithFilters(
  playerId: string, 
  filters: RadarFilters
): Promise<RadarComparisonData[]> {
  const queryParams = new URLSearchParams();
  if (filters.position) queryParams.append('position', filters.position);
  if (filters.nationality) queryParams.append('nationality', filters.nationality);
  // ... más filtros
  
  const response = await fetch(\`/api/players/\${playerId}/radar/compare?\${queryParams}\`);
  return response.json();
}

// Obtener opciones para filtros
export async function getRadarFilterOptions() {
  const response = await fetch('/api/players/radar/filters');
  return response.json();
}
`;

  // Guardar funciones de utilidad
  require('fs').writeFileSync(
    'src/lib/radar-utils.ts', 
    utilityCode, 
    'utf8'
  );

  console.log('✅ Funciones de utilidad creadas en src/lib/radar-utils.ts');
}

// Ejecutar
createRadarComparisonData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });