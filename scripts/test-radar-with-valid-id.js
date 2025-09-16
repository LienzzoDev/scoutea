const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRadarWithValidId() {
  console.log('🧪 Probando Radar API con ID válido...\n');

  try {
    // Obtener un jugador válido
    const validPlayer = await prisma.jugador.findFirst({
      where: {
        atributos: {
          isNot: null
        }
      },
      include: {
        radarMetrics: true
      }
    });

    if (!validPlayer) {
      console.log('❌ No hay jugadores con atributos');
      return;
    }

    console.log(`✅ Usando jugador válido: ${validPlayer.player_name}`);
    console.log(`📋 ID: ${validPlayer.id_player}`);
    console.log(`🎯 RadarMetrics: ${validPlayer.radarMetrics.length}`);

    // Simular la llamada a la API
    console.log('\n🌐 Simulando llamada HTTP...');
    
    const testUrl = `http://localhost:3000/api/players/${validPlayer.id_player}/radar`;
    console.log(`📡 URL de prueba: ${testUrl}`);

    // También mostrar la URL para filters
    const filtersUrl = `http://localhost:3000/api/players/radar/filters`;
    console.log(`🔧 URL de filtros: ${filtersUrl}`);

    // Crear un ejemplo de cómo debería funcionar en el frontend
    console.log('\n💻 Ejemplo para el frontend:');
    console.log(`
// En el componente React:
const playerId = "${validPlayer.id_player}"; // ID válido
const response = await fetch(\`/api/players/\${playerId}/radar\`);
const data = await response.json();
console.log('Radar data:', data);
    `);

    // Mostrar todos los IDs válidos para referencia
    console.log('\n📋 Todos los IDs válidos disponibles:');
    const allPlayers = await prisma.jugador.findMany({
      select: {
        id_player: true,
        player_name: true,
        position_player: true
      }
    });

    allPlayers.forEach(p => {
      console.log(`  - ${p.player_name} (${p.position_player}): ${p.id_player}`);
    });

    console.log('\n✅ Prueba completada. Usa cualquiera de estos IDs para probar la API.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRadarWithValidId()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });