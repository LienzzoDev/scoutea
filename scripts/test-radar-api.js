const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRadarAPI() {
  console.log('🧪 Probando datos para Radar API...\n');

  try {
    // 1. Verificar que tenemos jugadores
    const jugadores = await prisma.jugador.findMany({
      select: {
        id_player: true,
        player_name: true,
        position_player: true
      },
      take: 5
    });

    console.log(`👥 Jugadores encontrados: ${jugadores.length}`);
    jugadores.forEach(j => {
      console.log(`  - ${j.player_name} (${j.position_player}) - ID: ${j.id_player}`);
    });

    if (jugadores.length === 0) {
      console.log('❌ No hay jugadores en la base de datos');
      return;
    }

    // 2. Verificar RadarMetrics para el primer jugador
    const primerJugador = jugadores[0];
    console.log(`\n🎯 Verificando RadarMetrics para ${primerJugador.player_name}:`);

    const radarData = await prisma.radarMetrics.findMany({
      where: {
        playerId: primerJugador.id_player,
        period: '2023-24'
      },
      orderBy: {
        category: 'asc'
      }
    });

    console.log(`📊 RadarMetrics encontrados: ${radarData.length}`);
    radarData.forEach(r => {
      console.log(`  - ${r.category}: ${r.playerValue} (${r.percentile}%)`);
    });

    // 3. Simular la lógica de la API
    if (radarData.length === 0) {
      console.log('❌ No hay datos de radar para este jugador');
      return;
    }

    // 4. Obtener información del jugador
    const player = await prisma.jugador.findUnique({
      where: { id_player: primerJugador.id_player },
      select: {
        player_name: true,
        position_player: true,
        age: true,
        nationality_1: true,
        team_name: true,
        player_rating: true
      }
    });

    console.log(`\n👤 Información del jugador:`);
    console.log(`  - Nombre: ${player?.player_name}`);
    console.log(`  - Posición: ${player?.position_player}`);
    console.log(`  - Edad: ${player?.age}`);
    console.log(`  - Nacionalidad: ${player?.nationality_1}`);
    console.log(`  - Equipo: ${player?.team_name}`);
    console.log(`  - Rating: ${player?.player_rating}`);

    // 5. Calcular ranking dentro de su posición
    const playersInPosition = await prisma.jugador.findMany({
      where: {
        position_player: player?.position_player,
        atributos: {
          isNot: null
        }
      },
      include: {
        radarMetrics: {
          where: {
            period: '2023-24'
          }
        }
      }
    });

    console.log(`\n📈 Jugadores en la misma posición (${player?.position_player}): ${playersInPosition.length}`);

    // 6. Simular respuesta de la API
    const enrichedRadarData = radarData.map(radar => {
      const categoryValues = playersInPosition
        .map(p => p.radarMetrics.find(r => r.category === radar.category))
        .filter(r => r !== undefined)
        .map(r => r.playerValue)
        .sort((a, b) => b - a);

      const rank = categoryValues.findIndex(value => value <= radar.playerValue) + 1;

      return {
        category: radar.category,
        playerValue: radar.playerValue,
        positionAverage: radar.positionAverage,
        percentile: radar.percentile,
        rank: rank,
        totalPlayers: categoryValues.length,
        maxValue: Math.max(...categoryValues),
        minValue: Math.min(...categoryValues)
      };
    });

    console.log(`\n🎯 Datos enriquecidos para la API:`);
    enrichedRadarData.forEach(data => {
      console.log(`  - ${data.category}: Valor ${data.playerValue}, Rank ${data.rank}/${data.totalPlayers}, Percentil ${data.percentile}%`);
    });

    // 7. Simular respuesta completa
    const apiResponse = {
      player: player,
      radarData: enrichedRadarData,
      metadata: {
        period: '2023-24',
        totalCategories: radarData.length,
        positionComparison: playersInPosition.length
      }
    };

    console.log(`\n✅ Respuesta de API simulada exitosamente`);
    console.log(`📋 Estructura de respuesta:`);
    console.log(`  - player: ✓`);
    console.log(`  - radarData: ${apiResponse.radarData.length} categorías`);
    console.log(`  - metadata: ✓`);

    // 8. Probar filtros para comparación
    console.log(`\n🔍 Probando filtros de comparación...`);
    
    const filterOptions = await prisma.jugador.findMany({
      where: {
        atributos: {
          isNot: null
        }
      },
      select: {
        position_player: true,
        nationality_1: true,
        team_country: true,
        age: true,
        player_rating: true
      }
    });

    const positions = [...new Set(filterOptions.map(p => p.position_player).filter(Boolean))];
    const nationalities = [...new Set(filterOptions.map(p => p.nationality_1).filter(Boolean))];
    const competitions = [...new Set(filterOptions.map(p => p.team_country).filter(Boolean))];

    console.log(`  - Posiciones disponibles: ${positions.join(', ')}`);
    console.log(`  - Nacionalidades disponibles: ${nationalities.join(', ')}`);
    console.log(`  - Competiciones disponibles: ${competitions.join(', ')}`);

    console.log(`\n🎉 Prueba completada exitosamente!`);
    console.log(`\n📝 Para probar la API en el navegador:`);
    console.log(`   GET /api/players/${primerJugador.id_player}/radar`);
    console.log(`   GET /api/players/radar/filters`);

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testRadarAPI()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });