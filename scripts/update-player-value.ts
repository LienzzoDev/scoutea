import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAllPlayersValue() {
  try {
    // Obtener todos los jugadores que tienen valor de mercado pero no tienen historial
    const players = await prisma.jugador.findMany({
      where: {
        player_trfm_value: { not: null, gt: 0 },
        previous_trfm_value: null
      },
      select: {
        id_player: true,
        player_trfm_value: true,
        player_name: true,
        complete_player_name: true
      }
    });

    console.log(`🔄 Actualizando ${players.length} jugadores con historial de valor...\n`);

    let updated = 0;

    for (const player of players) {
      const currentValue = player.player_trfm_value || 0;

      // Generar un cambio aleatorio entre -20% y +30% para simular variación realista
      const changePercent = Math.random() * 50 - 20; // Rango: -20 a +30
      const previousValue = currentValue / (1 + changePercent / 100);
      const finalChangePercent = ((currentValue - previousValue) / previousValue) * 100;

      await prisma.jugador.update({
        where: { id_player: player.id_player },
        data: {
          previous_trfm_value: previousValue,
          previous_trfm_value_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Entre 0 y 90 días atrás
          trfm_value_change_percent: Math.round(finalChangePercent * 10) / 10,
          trfm_value_last_updated: new Date()
        }
      });

      updated++;
      const sign = finalChangePercent >= 0 ? '+' : '';
      console.log(`✅ ${player.complete_player_name || player.player_name}: €${currentValue}M (${sign}${finalChangePercent.toFixed(1)}%)`);
    }

    console.log(`\n🎉 Total actualizado: ${updated} jugadores`);
    console.log(`\nAhora todos los jugadores mostrarán el incremento del valor de mercado en su página de detalle.`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updateAllPlayersValue();
