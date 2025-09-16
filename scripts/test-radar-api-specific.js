const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRadarAPISpecific() {
  console.log('🎯 Probando lógica específica de Radar API...\n');

  const testPlayerId = 'cmfmeeqfb0001zweuke6bhyhp'; // Lionel Messi

  try {
    // 1. Obtener datos de radar del jugador
    console.log('📊 Paso 1: Obtener RadarMetrics del jugador...');
    const radarData = await prisma.radarMetrics.findMany({
      where: {
        playerId: testPlayerId,
        period: '2023-24'
      },
      orderBy: {
        category: 'asc'
      }
    });
    console.log(`✅ RadarMetrics encontrados: ${radarData.length}`);

    if (radarData.length === 0) {
      console.log('❌ No hay datos de radar para este jugador');
      return;
    }

    // 2. Obtener información del jugador
    console.log('\n👤 Paso 2: Obtener información del jugador...');
    const player = await prisma.jugador.findUnique({
      where: { id_player: testPlayerId },
      select: {
        player_name: true,
        position_player: true,
        age: true,
        nationality_1: true,
        team_name: true,
        player_rating: true
      }
    });
    console.log(`✅ Jugador: ${player?.player_name} (${player?.position_player})`);

    // 3. Probar el enfoque simplificado
    console.log('\n🔍 Paso 3: Probar enfoque simplificado...');
    const allPlayersInPosition = await prisma.jugador.findMany({
      where: {
        position_player: player?.position_player
      },
      include: {
        atributos: true,
        radarMetrics: {
          where: {
            period: '2023-24'
          }
        }
      }
    });
    console.log(`✅ Jugadores en posición ${player?.position_player}: ${allPlayersInPosition.length}`);

    // Filtrar los que tienen atributos
    const playersWithAtributos = allPlayersInPosition.filter(p => p.atributos !== null);
    console.log(`✅ Jugadores con atributos: ${playersWithAtributos.length}`);

    // 4. Simular el cálculo de rankings
    console.log('\n📈 Paso 4: Simular cálculo de rankings...');
    const enrichedRadarData = radarData.map(radar => {
      const categoryValues = playersWithAtributos
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

    console.log('✅ Rankings calculados exitosamente:');
    enrichedRadarData.forEach(data => {
      console.log(`   ${data.category}: Rank ${data.rank}/${data.totalPlayers} (${data.percentile}%)`);
    });

    // 5. Simular respuesta de API
    const apiResponse = {
      player: player,
      radarData: enrichedRadarData,
      metadata: {
        period: '2023-24',
        totalCategories: radarData.length,
        positionComparison: playersWithAtributos.length
      }
    };

    console.log('\n🎉 Simulación de API exitosa!');
    console.log(`📦 Respuesta generada con ${apiResponse.radarData.length} categorías`);

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRadarAPISpecific()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });