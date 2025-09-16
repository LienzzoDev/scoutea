const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPlayerLoading() {
  console.log('🧪 Probando carga de jugador específico...\n');

  // Usar el ID de Lionel Messi
  const testPlayerId = 'cmfmeeqfb0001zweuke6bhyhp';

  try {
    console.log(`📋 Probando con ID: ${testPlayerId}`);

    // Simular la llamada que hace el hook
    console.log('🌐 Simulando llamada HTTP...');
    
    const startTime = Date.now();
    
    // Verificar que el jugador existe en la BD
    const player = await prisma.jugador.findUnique({
      where: { id_player: testPlayerId },
      include: {
        atributos: true,
        radarMetrics: true,
        beeswarmData: true,
        lollipopData: true
      }
    });

    const dbTime = Date.now() - startTime;
    console.log(`⏱️  Tiempo de consulta BD: ${dbTime}ms`);

    if (!player) {
      console.log('❌ Jugador no encontrado en BD');
      return;
    }

    console.log(`✅ Jugador encontrado: ${player.player_name}`);
    console.log(`📊 Datos incluidos:`);
    console.log(`   - Atributos: ${player.atributos ? 'Sí' : 'No'}`);
    console.log(`   - RadarMetrics: ${player.radarMetrics.length}`);
    console.log(`   - BeeswarmData: ${player.beeswarmData.length}`);
    console.log(`   - LollipopData: ${player.lollipopData.length}`);

    // Simular la respuesta de la API
    console.log('\n🔧 Simulando respuesta de API...');
    const apiResponse = {
      id_player: player.id_player,
      player_name: player.player_name,
      position_player: player.position_player,
      age: player.age,
      nationality_1: player.nationality_1,
      team_name: player.team_name,
      player_rating: player.player_rating,
      // Incluir datos relacionados
      atributos: player.atributos,
      radarMetrics: player.radarMetrics,
      beeswarmData: player.beeswarmData,
      lollipopData: player.lollipopData
    };

    console.log(`📦 Tamaño de respuesta: ${JSON.stringify(apiResponse).length} caracteres`);
    console.log(`✅ API response simulada exitosamente`);

    // Probar la URL real
    console.log('\n🌐 URL para probar en el navegador:');
    console.log(`   http://localhost:3000/api/players/${testPlayerId}`);
    console.log(`   http://localhost:3000/member/player/${testPlayerId}`);

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPlayerLoading()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });