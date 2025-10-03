import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const prisma = new PrismaClient();

async function verifyMarketValueChanges() {
  console.log('🔍 Verificando cambios de valor de mercado...');
  
  try {
    // Obtener jugadores con historial de valores
    const players = await prisma.jugador.findMany({
      where: {
        AND: [
          { player_trfm_value: { not: null } },
          { previous_trfm_value: { not: null } },
          { trfm_value_change_percent: { not: null } }
        ]
      },
      select: {
        id_player: true,
        player_name: true,
        player_trfm_value: true,
        previous_trfm_value: true,
        trfm_value_change_percent: true,
        previous_trfm_value_date: true,
        trfm_value_last_updated: true
      },
      orderBy: {
        trfm_value_change_percent: 'desc'
      }
    });
    
    console.log(`\n📊 Encontrados ${players.length} jugadores con historial de valores`);
    console.log('=====================================');
    
    players.forEach((player, index) => {
      const current = player.player_trfm_value || 0;
      const previous = player.previous_trfm_value || 0;
      const change = player.trfm_value_change_percent || 0;
      
      const arrow = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
      const changeColor = change > 0 ? '🟢' : change < 0 ? '🔴' : '🟡';
      
      console.log(`\n${index + 1}. ${player.player_name} ${arrow}`);
      console.log(`   Valor anterior: ${formatValue(previous)} (${player.previous_trfm_value_date?.toLocaleDateString('es-ES') || 'N/A'})`);
      console.log(`   Valor actual: ${formatValue(current)} (${player.trfm_value_last_updated?.toLocaleDateString('es-ES') || 'N/A'})`);
      console.log(`   Cambio: ${changeColor} ${change > 0 ? '+' : ''}${change}%`);
    });
    
    // Estadísticas generales
    const totalPlayers = await prisma.jugador.count({
      where: {
        player_trfm_value: { not: null }
      }
    });
    
    const playersWithHistory = players.length;
    const positiveChanges = players.filter(p => (p.trfm_value_change_percent || 0) > 0).length;
    const negativeChanges = players.filter(p => (p.trfm_value_change_percent || 0) < 0).length;
    const neutralChanges = players.filter(p => (p.trfm_value_change_percent || 0) === 0).length;
    
    // Calcular promedios
    const avgChange = players.reduce((sum, p) => sum + (p.trfm_value_change_percent || 0), 0) / players.length;
    const avgCurrentValue = players.reduce((sum, p) => sum + (p.player_trfm_value || 0), 0) / players.length;
    const avgPreviousValue = players.reduce((sum, p) => sum + (p.previous_trfm_value || 0), 0) / players.length;
    
    console.log('\n📈 Estadísticas Generales:');
    console.log('==========================');
    console.log(`Total jugadores con valor: ${totalPlayers}`);
    console.log(`Jugadores con historial: ${playersWithHistory} (${((playersWithHistory / totalPlayers) * 100).toFixed(1)}%)`);
    console.log(`Cambios positivos: ${positiveChanges} (${((positiveChanges / playersWithHistory) * 100).toFixed(1)}%)`);
    console.log(`Cambios negativos: ${negativeChanges} (${((negativeChanges / playersWithHistory) * 100).toFixed(1)}%)`);
    console.log(`Sin cambios: ${neutralChanges} (${((neutralChanges / playersWithHistory) * 100).toFixed(1)}%)`);
    console.log(`Cambio promedio: ${avgChange > 0 ? '+' : ''}${avgChange.toFixed(1)}%`);
    console.log(`Valor promedio anterior: ${formatValue(avgPreviousValue)}`);
    console.log(`Valor promedio actual: ${formatValue(avgCurrentValue)}`);
    
    // Top y bottom performers
    const topGainers = players.filter(p => (p.trfm_value_change_percent || 0) > 0).slice(0, 3);
    const topLosers = players.filter(p => (p.trfm_value_change_percent || 0) < 0).slice(-3).reverse();
    
    if (topGainers.length > 0) {
      console.log('\n🏆 Top 3 Mayores Subidas:');
      console.log('=========================');
      topGainers.forEach((player, index) => {
        const change = player.trfm_value_change_percent || 0;
        console.log(`${index + 1}. ${player.player_name}: +${change}% (${formatValue(player.previous_trfm_value)} → ${formatValue(player.player_trfm_value)})`);
      });
    }
    
    if (topLosers.length > 0) {
      console.log('\n📉 Top 3 Mayores Bajadas:');
      console.log('=========================');
      topLosers.forEach((player, index) => {
        const change = player.trfm_value_change_percent || 0;
        console.log(`${index + 1}. ${player.player_name}: ${change}% (${formatValue(player.previous_trfm_value)} → ${formatValue(player.player_trfm_value)})`);
      });
    }
    
    // Verificar que los cálculos son correctos
    console.log('\n🔍 Verificación de Cálculos:');
    console.log('============================');
    let correctCalculations = 0;
    let totalCalculations = 0;
    
    for (const player of players.slice(0, 3)) { // Verificar solo los primeros 3
      const current = player.player_trfm_value || 0;
      const previous = player.previous_trfm_value || 0;
      const storedChange = player.trfm_value_change_percent || 0;
      
      if (previous > 0) {
        const calculatedChange = ((current - previous) / previous) * 100;
        const isCorrect = Math.abs(calculatedChange - storedChange) < 0.1; // Tolerancia de 0.1%
        
        console.log(`${player.player_name}:`);
        console.log(`  Calculado: ${calculatedChange.toFixed(1)}%`);
        console.log(`  Almacenado: ${storedChange.toFixed(1)}%`);
        console.log(`  ✅ ${isCorrect ? 'Correcto' : '❌ Incorrecto'}`);
        
        if (isCorrect) correctCalculations++;
        totalCalculations++;
      }
    }
    
    console.log(`\nPrecisión de cálculos: ${correctCalculations}/${totalCalculations} (${((correctCalculations / totalCalculations) * 100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('❌ Error al verificar cambios de valor:', error);
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
  verifyMarketValueChanges()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en la verificación:', error);
      process.exit(1);
    });
}

export { verifyMarketValueChanges };