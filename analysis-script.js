// Script para analizar el radar de Messi
const { PrismaClient } = require('@prisma/client');
const { RadarCalculationService } = require('./src/lib/services/RadarCalculationService');

async function analyzeMessiRadar() {
  const prisma = new PrismaClient();
  const radarService = new RadarCalculationService(prisma);
  
  const messiId = "cmfmeeqfb0001zweuke6bhyhp";
  
  try {
    console.log("🔍 ANÁLISIS DEL RADAR DE MESSI");
    console.log("================================");
    
    // 1. Verificar que Messi existe
    const messi = await prisma.jugador.findUnique({
      where: { id_player: messiId },
      include: {
        atributos: true,
        playerStats3m: true
      }
    });
    
    if (!messi) {
      console.log("❌ Messi no encontrado en la base de datos");
      return;
    }
    
    console.log("✅ Jugador encontrado:");
    console.log(`   Nombre: ${messi.player_name}`);
    console.log(`   Posición: ${messi.position_player}`);
    console.log(`   Edad: ${messi.age}`);
    console.log(`   Rating: ${messi.player_rating}`);
    console.log(`   Tiene atributos: ${messi.atributos ? 'Sí' : 'No'}`);
    console.log(`   Tiene stats: ${messi.playerStats3m ? 'Sí' : 'No'}`);
    
    if (!messi.atributos) {
      console.log("❌ Messi no tiene datos de atributos");
      return;
    }
    
    // 2. Calcular radar básico
    console.log("\n🧮 CALCULANDO RADAR BÁSICO");
    console.log("===========================");
    
    const radarData = await radarService.calculatePlayerRadar(messiId);
    
    console.log(`✅ Radar calculado con ${radarData.length} categorías:`);
    radarData.forEach(category => {
      console.log(`   ${category.category}: ${category.playerValue} (completitud: ${category.dataCompleteness}%)`);
    });
    
    // 3. Probar radar con comparación (sin filtros)
    console.log("\n🔄 CALCULANDO RADAR CON COMPARACIÓN (SIN FILTROS)");
    console.log("==================================================");
    
    const comparisonData = await radarService.calculatePlayerRadarWithComparison(messiId, {});
    
    console.log(`✅ Radar con comparación calculado:`);
    comparisonData.forEach(category => {
      console.log(`   ${category.category}:`);
      console.log(`     Valor jugador: ${category.playerValue}`);
      console.log(`     Promedio comparación: ${category.comparisonAverage || 'N/A'}`);
      console.log(`     Percentil: ${category.percentile || 'N/A'}%`);
      console.log(`     Ranking: ${category.rank || 'N/A'}/${category.totalPlayers || 'N/A'}`);
    });
    
    // 4. Probar con filtros (solo extremos)
    console.log("\n🎯 PROBANDO CON FILTROS (EXTREMOS)");
    console.log("===================================");
    
    const filteredData = await radarService.calculatePlayerRadarWithComparison(messiId, {
      position: 'RW'
    });
    
    console.log(`✅ Radar filtrado por posición RW:`);
    filteredData.forEach(category => {
      console.log(`   ${category.category}: ${category.playerValue} (percentil: ${category.percentile || 'N/A'}%, rank: ${category.rank || 'N/A'}/${category.totalPlayers || 'N/A'})`);
    });
    
    // 5. Verificar coherencia de datos
    console.log("\n🔍 VERIFICANDO COHERENCIA DE DATOS");
    console.log("===================================");
    
    // Comparar valores básicos vs con comparación
    let coherenceIssues = 0;
    for (let i = 0; i < radarData.length; i++) {
      const basic = radarData[i];
      const comparison = comparisonData[i];
      
      if (basic.category !== comparison.category) {
        console.log(`❌ Orden de categorías inconsistente: ${basic.category} vs ${comparison.category}`);
        coherenceIssues++;
      }
      
      if (Math.abs(basic.playerValue - comparison.playerValue) > 0.01) {
        console.log(`❌ Valor del jugador inconsistente en ${basic.category}: ${basic.playerValue} vs ${comparison.playerValue}`);
        coherenceIssues++;
      }
    }
    
    if (coherenceIssues === 0) {
      console.log("✅ Coherencia de datos: CORRECTA");
    } else {
      console.log(`❌ Encontrados ${coherenceIssues} problemas de coherencia`);
    }
    
    // 6. Analizar atributos fuente
    console.log("\n📊 ANÁLISIS DE ATRIBUTOS FUENTE");
    console.log("================================");
    
    console.log("Atributos FMI de Messi:");
    const attrs = messi.atributos;
    const importantAttrs = [
      'finishing_fmi', 'dribbling_fmi', 'pace_fmi', 'passing_fmi', 
      'vision_fmi', 'technique_fmi', 'composure_fmi'
    ];
    
    importantAttrs.forEach(attr => {
      if (attrs[attr] !== null && attrs[attr] !== undefined) {
        console.log(`   ${attr}: ${attrs[attr]}`);
      } else {
        console.log(`   ${attr}: FALTANTE`);
      }
    });
    
    if (messi.playerStats3m) {
      console.log("\nEstadísticas 3M de Messi:");
      const stats = messi.playerStats3m;
      const importantStats = [
        'goals_p90_3m', 'assists_p90_3m', 'shots_p90_3m', 
        'passes_p90_3m', 'accurate_passes_percent_3m'
      ];
      
      importantStats.forEach(stat => {
        if (stats[stat] !== null && stats[stat] !== undefined) {
          console.log(`   ${stat}: ${stats[stat]}`);
        } else {
          console.log(`   ${stat}: FALTANTE`);
        }
      });
    }
    
  } catch (error) {
    console.error("❌ Error durante el análisis:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeMessiRadar();