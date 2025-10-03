import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const prisma = new PrismaClient();

async function populateMarketValueHistory() {
  console.log('💰 Iniciando población de historial de valores de mercado...');
  
  try {
    // Obtener todos los jugadores con valor de mercado actual
    const players = await prisma.jugador.findMany({
      where: {
        player_trfm_value: {
          not: null,
          gt: 0
        }
      },
      select: {
        id_player: true,
        player_name: true,
        player_trfm_value: true,
        previous_trfm_value: true,
        trfm_value_change_percent: true
      }
    });
    
    console.log(`📊 Encontrados ${players.length} jugadores con valor de mercado`);
    
    let updatedCount = 0;
    
    for (const player of players) {
      // Solo actualizar si no tiene valor anterior
      if (!player.previous_trfm_value && player.player_trfm_value) {
        const currentValue = player.player_trfm_value;
        
        // Generar un valor anterior realista (entre -30% y +50% del valor actual)
        const changePercent = (Math.random() * 80) - 30; // Entre -30% y +50%
        const previousValue = currentValue / (1 + (changePercent / 100));
        
        // Fecha anterior (entre 3 y 12 meses atrás)
        const monthsAgo = 3 + Math.floor(Math.random() * 9);
        const previousDate = new Date();
        previousDate.setMonth(previousDate.getMonth() - monthsAgo);
        
        // Fecha de última actualización (entre 1 y 30 días atrás)
        const daysAgo = 1 + Math.floor(Math.random() * 30);
        const lastUpdated = new Date();
        lastUpdated.setDate(lastUpdated.getDate() - daysAgo);
        
        await prisma.jugador.update({
          where: { id_player: player.id_player },
          data: {
            previous_trfm_value: Math.round(previousValue),
            previous_trfm_value_date: previousDate,
            trfm_value_change_percent: Math.round(changePercent * 10) / 10, // Redondear a 1 decimal
            trfm_value_last_updated: lastUpdated,
            updatedAt: new Date()
          }
        });
        
        updatedCount++;
        
        console.log(`✅ ${player.player_name}: ${formatValue(Math.round(previousValue))} → ${formatValue(currentValue)} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%)`);
      }
    }
    
    console.log(`🎉 ¡Completado! Se actualizaron ${updatedCount} jugadores de ${players.length} total`);
    
    // Mostrar estadísticas
    const stats = await prisma.jugador.aggregate({
      _count: {
        previous_trfm_value: true,
        trfm_value_change_percent: true
      },
      where: {
        player_trfm_value: {
          not: null,
          gt: 0
        }
      }
    });
    
    // Estadísticas de cambios
    const positiveChanges = await prisma.jugador.count({
      where: {
        trfm_value_change_percent: { gt: 0 }
      }
    });
    
    const negativeChanges = await prisma.jugador.count({
      where: {
        trfm_value_change_percent: { lt: 0 }
      }
    });
    
    const neutralChanges = await prisma.jugador.count({
      where: {
        trfm_value_change_percent: 0
      }
    });
    
    console.log('\n📈 Estadísticas de cambios de valor:');
    console.log(`- Jugadores con historial: ${stats._count.previous_trfm_value}/${players.length}`);
    console.log(`- Cambios positivos: ${positiveChanges} (${((positiveChanges / players.length) * 100).toFixed(1)}%)`);
    console.log(`- Cambios negativos: ${negativeChanges} (${((negativeChanges / players.length) * 100).toFixed(1)}%)`);
    console.log(`- Sin cambios: ${neutralChanges} (${((neutralChanges / players.length) * 100).toFixed(1)}%)`);
    
    // Mostrar algunos ejemplos
    const examples = await prisma.jugador.findMany({
      where: {
        AND: [
          { player_trfm_value: { not: null } },
          { previous_trfm_value: { not: null } },
          { trfm_value_change_percent: { not: null } }
        ]
      },
      select: {
        player_name: true,
        player_trfm_value: true,
        previous_trfm_value: true,
        trfm_value_change_percent: true,
        trfm_value_last_updated: true
      },
      take: 5,
      orderBy: {
        trfm_value_change_percent: 'desc'
      }
    });
    
    console.log('\n🏆 Top 5 jugadores con mayor subida de valor:');
    examples.forEach((player, index) => {
      const change = player.trfm_value_change_percent || 0;
      const arrow = change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️';
      console.log(`${index + 1}. ${player.player_name}: ${formatValue(player.previous_trfm_value)} → ${formatValue(player.player_trfm_value)} ${arrow} ${change > 0 ? '+' : ''}${change}%`);
    });
    
  } catch (error) {
    console.error('❌ Error al poblar historial de valores:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función helper para formatear valores
function formatValue(value?: number | null): string {
  if (!value) return "€0";
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Ejecutar el script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateMarketValueHistory()
    .then(() => {
      console.log('\n✨ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el script:', error);
      process.exit(1);
    });
}

export { populateMarketValueHistory };