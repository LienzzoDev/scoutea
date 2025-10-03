import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const prisma = new PrismaClient();

async function verifyScoutEconomicChanges() {
  console.log('🔍 Verificando cambios económicos de scouts...');
  
  try {
    // Obtener scouts con historial económico
    const scouts = await prisma.scout.findMany({
      where: {
        OR: [
          { roi_change_percent: { not: null } },
          { max_profit_report_change_percent: { not: null } },
          { net_profits_change_percent: { not: null } },
          { total_investment_change_percent: { not: null } }
        ]
      },
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        // ROI
        roi: true,
        previous_roi: true,
        roi_change_percent: true,
        roi_last_updated: true,
        // Max Profit Report
        max_profit_report: true,
        previous_max_profit_report: true,
        max_profit_report_change_percent: true,
        max_profit_report_last_updated: true,
        // Net Profits
        net_profits: true,
        previous_net_profits: true,
        net_profits_change_percent: true,
        // Total Investment
        total_investment: true,
        previous_total_investment: true,
        total_investment_change_percent: true
      },
      orderBy: {
        roi_change_percent: 'desc'
      }
    });
    
    console.log(`\n📊 Encontrados ${scouts.length} scouts con historial económico`);
    console.log('=====================================');
    
    scouts.forEach((scout, index) => {
      const scoutName = scout.scout_name || scout.name || `Scout ${scout.id_scout}`;
      
      console.log(`\n${index + 1}. ${scoutName}`);
      
      // ROI
      if (scout.roi !== null && scout.previous_roi !== null && scout.roi_change_percent !== null) {
        const arrow = scout.roi_change_percent > 0 ? '📈' : scout.roi_change_percent < 0 ? '📉' : '➡️';
        console.log(`   ROI: ${formatROI(scout.previous_roi)} → ${formatROI(scout.roi)} ${arrow} (${scout.roi_change_percent > 0 ? '+' : ''}${scout.roi_change_percent}pp)`);
      }
      
      // Max Profit Report
      if (scout.max_profit_report !== null && scout.previous_max_profit_report !== null && scout.max_profit_report_change_percent !== null) {
        const arrow = scout.max_profit_report_change_percent > 0 ? '📈' : scout.max_profit_report_change_percent < 0 ? '📉' : '➡️';
        console.log(`   Max Profit: ${formatValue(scout.previous_max_profit_report)} → ${formatValue(scout.max_profit_report)} ${arrow} (${scout.max_profit_report_change_percent > 0 ? '+' : ''}${scout.max_profit_report_change_percent}%)`);
      }
      
      // Net Profits (si existe)
      if (scout.net_profits !== null && scout.previous_net_profits !== null && scout.net_profits_change_percent !== null) {
        const arrow = scout.net_profits_change_percent > 0 ? '📈' : scout.net_profits_change_percent < 0 ? '📉' : '➡️';
        console.log(`   Net Profits: ${formatValue(scout.previous_net_profits)} → ${formatValue(scout.net_profits)} ${arrow} (${scout.net_profits_change_percent > 0 ? '+' : ''}${scout.net_profits_change_percent}%)`);
      }
      
      // Total Investment (si existe)
      if (scout.total_investment !== null && scout.previous_total_investment !== null && scout.total_investment_change_percent !== null) {
        const arrow = scout.total_investment_change_percent > 0 ? '📈' : scout.total_investment_change_percent < 0 ? '📉' : '➡️';
        console.log(`   Investment: ${formatValue(scout.previous_total_investment)} → ${formatValue(scout.total_investment)} ${arrow} (${scout.total_investment_change_percent > 0 ? '+' : ''}${scout.total_investment_change_percent}%)`);
      }
    });
    
    // Estadísticas generales
    const totalScouts = await prisma.scout.count();
    const scoutsWithROIHistory = scouts.filter(s => s.roi_change_percent !== null).length;
    const scoutsWithMaxProfitHistory = scouts.filter(s => s.max_profit_report_change_percent !== null).length;
    const scoutsWithNetProfitsHistory = scouts.filter(s => s.net_profits_change_percent !== null).length;
    const scoutsWithInvestmentHistory = scouts.filter(s => s.total_investment_change_percent !== null).length;
    
    // Calcular promedios
    const avgROIChange = scoutsWithROIHistory > 0 
      ? scouts.filter(s => s.roi_change_percent !== null).reduce((sum, s) => sum + (s.roi_change_percent || 0), 0) / scoutsWithROIHistory
      : 0;
    
    const avgMaxProfitChange = scoutsWithMaxProfitHistory > 0
      ? scouts.filter(s => s.max_profit_report_change_percent !== null).reduce((sum, s) => sum + (s.max_profit_report_change_percent || 0), 0) / scoutsWithMaxProfitHistory
      : 0;
    
    console.log('\n📈 Estadísticas Generales:');
    console.log('==========================');
    console.log(`Total scouts: ${totalScouts}`);
    console.log(`Scouts con historial ROI: ${scoutsWithROIHistory} (${((scoutsWithROIHistory / totalScouts) * 100).toFixed(1)}%)`);
    console.log(`Scouts con historial Max Profit: ${scoutsWithMaxProfitHistory} (${((scoutsWithMaxProfitHistory / totalScouts) * 100).toFixed(1)}%)`);
    console.log(`Scouts con historial Net Profits: ${scoutsWithNetProfitsHistory} (${((scoutsWithNetProfitsHistory / totalScouts) * 100).toFixed(1)}%)`);
    console.log(`Scouts con historial Investment: ${scoutsWithInvestmentHistory} (${((scoutsWithInvestmentHistory / totalScouts) * 100).toFixed(1)}%)`);
    console.log(`Cambio promedio ROI: ${avgROIChange > 0 ? '+' : ''}${avgROIChange.toFixed(1)}pp`);
    console.log(`Cambio promedio Max Profit: ${avgMaxProfitChange > 0 ? '+' : ''}${avgMaxProfitChange.toFixed(1)}%`);
    
    // Top performers por ROI
    const topROIPerformers = scouts
      .filter(s => s.roi_change_percent !== null && s.roi_change_percent > 0)
      .sort((a, b) => (b.roi_change_percent || 0) - (a.roi_change_percent || 0))
      .slice(0, 3);
    
    if (topROIPerformers.length > 0) {
      console.log('\n🏆 Top 3 Mejores ROI:');
      console.log('====================');
      topROIPerformers.forEach((scout, index) => {
        const scoutName = scout.scout_name || scout.name || 'Scout sin nombre';
        const change = scout.roi_change_percent || 0;
        console.log(`${index + 1}. ${scoutName}: ${formatROI(scout.previous_roi)} → ${formatROI(scout.roi)} (+${change}pp)`);
      });
    }
    
    // Top performers por Max Profit
    const topProfitPerformers = scouts
      .filter(s => s.max_profit_report_change_percent !== null && s.max_profit_report_change_percent > 0)
      .sort((a, b) => (b.max_profit_report_change_percent || 0) - (a.max_profit_report_change_percent || 0))
      .slice(0, 3);
    
    if (topProfitPerformers.length > 0) {
      console.log('\n💰 Top 3 Mejores Max Profit:');
      console.log('============================');
      topProfitPerformers.forEach((scout, index) => {
        const scoutName = scout.scout_name || scout.name || 'Scout sin nombre';
        const change = scout.max_profit_report_change_percent || 0;
        console.log(`${index + 1}. ${scoutName}: ${formatValue(scout.previous_max_profit_report)} → ${formatValue(scout.max_profit_report)} (+${change}%)`);
      });
    }
    
    // Verificar algunos cálculos
    console.log('\n🔍 Verificación de Cálculos (ROI):');
    console.log('==================================');
    let correctCalculations = 0;
    let totalCalculations = 0;
    
    for (const scout of scouts.slice(0, 3)) {
      if (scout.roi !== null && scout.previous_roi !== null && scout.roi_change_percent !== null) {
        const calculatedChange = scout.roi - scout.previous_roi;
        const storedChange = scout.roi_change_percent;
        const isCorrect = Math.abs(calculatedChange - storedChange) < 0.1;
        
        const scoutName = scout.scout_name || scout.name || 'Scout sin nombre';
        console.log(`${scoutName}:`);
        console.log(`  Calculado: ${calculatedChange.toFixed(1)}pp`);
        console.log(`  Almacenado: ${storedChange.toFixed(1)}pp`);
        console.log(`  ✅ ${isCorrect ? 'Correcto' : '❌ Incorrecto'}`);
        
        if (isCorrect) correctCalculations++;
        totalCalculations++;
      }
    }
    
    if (totalCalculations > 0) {
      console.log(`\nPrecisión de cálculos: ${correctCalculations}/${totalCalculations} (${((correctCalculations / totalCalculations) * 100).toFixed(1)}%)`);
    }
    
  } catch (error) {
    console.error('❌ Error al verificar cambios económicos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función helper para formatear valores monetarios
function formatValue(value?: number | null): string {
  if (!value) return "€0";
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Función helper para formatear ROI
function formatROI(value?: number | null): string {
  if (!value) return "0%";
  return `${value.toFixed(1)}%`;
}

// Ejecutar el script
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyScoutEconomicChanges()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en la verificación:', error);
      process.exit(1);
    });
}

export { verifyScoutEconomicChanges };