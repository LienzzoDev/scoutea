const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyStats3mTable() {
  console.log('🔍 Verificando tabla player_stats_3m...\n');

  try {
    // 1. Verificar que la tabla existe
    const count = await prisma.playerStats3m.count();
    console.log(`✅ Tabla player_stats_3m existe: ${count} registros`);

    // 2. Insertar un registro de prueba
    const testPlayer = await prisma.jugador.findFirst({
      select: { id_player: true, player_name: true }
    });

    if (testPlayer) {
      console.log(`📊 Insertando datos de prueba para ${testPlayer.player_name}...`);
      
      await prisma.playerStats3m.upsert({
        where: { id_player: testPlayer.id_player },
        update: {
          goals_p90_3m: 0.85,
          assists_p90_3m: 0.45,
          matches_played_tot_3m: 15,
          minutes_played_tot_3m: 1200
        },
        create: {
          id_player: testPlayer.id_player,
          goals_p90_3m: 0.85,
          assists_p90_3m: 0.45,
          matches_played_tot_3m: 15,
          minutes_played_tot_3m: 1200,
          goals_p90_3m_norm: 75.5,
          assists_p90_3m_norm: 68.2
        }
      });

      console.log('✅ Datos de prueba insertados');
    }

    // 3. Verificar la estructura
    const testRecord = await prisma.playerStats3m.findFirst({
      include: {
        player: {
          select: {
            player_name: true,
            position_player: true
          }
        }
      }
    });

    if (testRecord) {
      console.log('\n📋 Registro de ejemplo:');
      console.log(`- Jugador: ${testRecord.player.player_name}`);
      console.log(`- Goals p90: ${testRecord.goals_p90_3m}`);
      console.log(`- Assists p90: ${testRecord.assists_p90_3m}`);
      console.log(`- Partidos: ${testRecord.matches_played_tot_3m}`);
      console.log(`- Minutos: ${testRecord.minutes_played_tot_3m}`);
    }

    console.log('\n🎉 Tabla player_stats_3m verificada exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStats3mTable()
  .catch(console.error);