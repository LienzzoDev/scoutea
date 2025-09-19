/**
 * Script para analizar a fondo el radar de jugadores
 */

import { PrismaClient } from '@prisma/client';

import { RadarCalculationService } from '../lib/services/RadarCalculationService';

const prisma = new PrismaClient();

async function analyzePlayerRadar(playerId: string, playerName: string) {
  console.log(`\n🔍 ANÁLISIS EXHAUSTIVO DEL RADAR: ${playerName}`);
  console.log("=".repeat(50));
  
  const radarService = new RadarCalculationService(prisma);
  
  try {
    // 1. Verificar existencia del jugador
    const player = await prisma.jugador.findUnique({
      where: { id_player: playerId },
      include: {
        atributos: true,
        playerStats3m: true
      }
    });
    
    if (!player) {
      console.log(`❌ Jugador ${playerId} no encontrado`);
      return;
    }
    
    console.log(`✅ Jugador: ${player.player_name}`);
    console.log(`   Posición: ${player.position_player}`);
    console.log(`   Edad: ${player.age}`);
    console.log(`   Rating: ${player.player_rating}`);
    console.log(`   Nacionalidad: ${player.nationality_1}`);
    console.log(`   Equipo: ${player.team_name}`);
    console.log(`   Competición: ${player.team_competition}`);
    
    // 2. Verificar datos disponibles
    console.log(`\n📊 DISPONIBILIDAD DE DATOS:`);
    console.log(`   Atributos FMI: ${player.atributos ? '✅ Disponibles' : '❌ Faltantes'}`);
    console.log(`   Estadísticas 3M: ${player.playerStats3m ? '✅ Disponibles' : '❌ Faltantes'}`);
    
    if (!player.atributos) {
      console.log(`❌ No se puede calcular radar sin atributos FMI`);
      return;
    }
    
    // 3. Calcular radar básico (sin comparación)
    console.log(`\n🧮 RADAR BÁSICO (SIN COMPARACIÓN):`);
    const basicRadar = await radarService.calculatePlayerRadar(playerId);
    
    basicRadar.forEach(category => {
      console.log(`   ${category.category.padEnd(20)}: ${category.playerValue.toFixed(2).padStart(6)} (completitud: ${category.dataCompleteness.toFixed(1)}%)`);
    });
    
    // 4. Calcular radar con comparación global (sin filtros)
    console.log(`\n🌍 RADAR CON COMPARACIÓN GLOBAL (TODOS LOS JUGADORES):`);
    const globalComparison = await radarService.calculatePlayerRadarWithComparison(playerId, {});
    
    globalComparison.forEach(category => {
      const percentile = category.percentile || 0;
      const rank = category.rank || 0;
      const total = category.totalPlayers || 0;
      const avg = category.comparisonAverage || 0;
      
      console.log(`   ${category.category.padEnd(20)}: ${category.playerValue.toFixed(2).padStart(6)} | Percentil: ${percentile.toFixed(1).padStart(5)}% | Rank: ${rank.toString().padStart(3)}/${total} | Promedio: ${avg.toFixed(2)}`);
    });
    
    // 5. Probar con filtros específicos
    console.log(`\n🎯 RADAR CON FILTROS (MISMA POSICIÓN):`);
    const positionFiltered = await radarService.calculatePlayerRadarWithComparison(playerId, {
      position: player.position_player
    });
    
    positionFiltered.forEach(category => {
      const percentile = category.percentile || 0;
      const rank = category.rank || 0;
      const total = category.totalPlayers || 0;
      
      console.log(`   ${category.category.padEnd(20)}: ${category.playerValue.toFixed(2).padStart(6)} | Percentil: ${percentile.toFixed(1).padStart(5)}% | Rank: ${rank.toString().padStart(3)}/${total}`);
    });
    
    // 6. Verificar coherencia entre cálculos
    console.log(`\n🔍 VERIFICACIÓN DE COHERENCIA:`);
    let coherenceIssues = 0;
    
    for (let i = 0; i < basicRadar.length; i++) {
      const basic = basicRadar[i];
      const global = globalComparison[i];
      const filtered = positionFiltered[i];
      
      // Verificar que las categorías estén en el mismo orden
      if (basic.category !== global.category || basic.category !== filtered.category) {
        console.log(`❌ Orden inconsistente de categorías: ${basic.category} | ${global.category} | ${filtered.category}`);
        coherenceIssues++;
      }
      
      // Verificar que el valor del jugador sea consistente
      if (Math.abs(basic.playerValue - global.playerValue) > 0.01 || 
          Math.abs(basic.playerValue - filtered.playerValue) > 0.01) {
        console.log(`❌ Valor del jugador inconsistente en ${basic.category}: ${basic.playerValue} | ${global.playerValue} | ${filtered.playerValue}`);
        coherenceIssues++;
      }
      
      // Verificar que los percentiles sean lógicos
      if (global.percentile && filtered.percentile) {
        // El percentil en grupo filtrado debería poder ser diferente al global
        if (global.percentile < 0 || global.percentile > 100 || filtered.percentile < 0 || filtered.percentile > 100) {
          console.log(`❌ Percentiles fuera de rango en ${basic.category}: Global=${global.percentile}%, Filtrado=${filtered.percentile}%`);
          coherenceIssues++;
        }
      }
    }
    
    if (coherenceIssues === 0) {
      console.log(`✅ Coherencia: CORRECTA - No se encontraron inconsistencias`);
    } else {
      console.log(`❌ Coherencia: PROBLEMAS - ${coherenceIssues} inconsistencias encontradas`);
    }
    
    // 7. Analizar atributos fuente para una categoría específica
    console.log(`\n🔬 ANÁLISIS DETALLADO - CATEGORÍA "FINALIZACIÓN":`);
    const finalizacion = basicRadar.find(cat => cat.category === 'Finalización');
    if (finalizacion) {
      console.log(`   Valor calculado: ${finalizacion.playerValue}`);
      console.log(`   Completitud: ${finalizacion.dataCompleteness}%`);
      console.log(`   Atributos fuente: ${finalizacion.sourceAttributes.join(', ')}`);
      
      // Mostrar valores de atributos fuente
      finalizacion.sourceAttributes.forEach(attr => {
        if (attr.includes('_fmi')) {
          const value = player.atributos?.[attr as keyof typeof player.atributos];
          console.log(`     ${attr}: ${value || 'FALTANTE'}`);
        } else if (player.playerStats3m) {
          const value = player.playerStats3m[attr as keyof typeof player.playerStats3m];
          console.log(`     ${attr}: ${value || 'FALTANTE'}`);
        }
      });
    }
    
    // 8. Verificar rangos de valores
    console.log(`\n📏 VERIFICACIÓN DE RANGOS:`);
    let rangeIssues = 0;
    
    basicRadar.forEach(category => {
      if (category.playerValue < 0 || category.playerValue > 100) {
        console.log(`❌ Valor fuera de rango en ${category.category}: ${category.playerValue}`);
        rangeIssues++;
      }
      
      if (category.dataCompleteness < 0 || category.dataCompleteness > 100) {
        console.log(`❌ Completitud fuera de rango en ${category.category}: ${category.dataCompleteness}%`);
        rangeIssues++;
      }
    });
    
    if (rangeIssues === 0) {
      console.log(`✅ Rangos: CORRECTOS - Todos los valores están dentro de rangos esperados`);
    } else {
      console.log(`❌ Rangos: PROBLEMAS - ${rangeIssues} valores fuera de rango`);
    }
    
  } catch (error) {
    console.error(`❌ Error durante el análisis:`, error);
  }
}

async function main() {
  console.log("🚀 INICIANDO ANÁLISIS EXHAUSTIVO DEL SISTEMA DE RADAR");
  console.log("=".repeat(60));
  
  // Lista de jugadores de prueba
  const testPlayers = [
    { id: "cmfmeeqfb0001zweuke6bhyhp", name: "Lionel Messi" },
    { id: "cmfmeeqgg0005zweuz9xrsvg0", name: "Erling Haaland" },
    { id: "cmfmeeqgb0002zweuhotgu0so", name: "Luka Modric" },
    { id: "cmfmeeqgf0004zweu8ncmex9l", name: "Virgil van Dijk" }
  ];
  
  for (const player of testPlayers) {
    await analyzePlayerRadar(player.id, player.name);
  }
  
  console.log(`\n🏁 ANÁLISIS COMPLETADO`);
  console.log("=".repeat(60));
  
  await prisma.$disconnect();
}

main().catch(console.error);