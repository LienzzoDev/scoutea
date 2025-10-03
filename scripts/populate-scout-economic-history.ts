import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const prisma = new PrismaClient();

// Campos económicos a poblar con sus rangos típicos
const ECONOMIC_FIELDS = {
  total_investment: { min: 50000, max: 5000000, suffix: ' €' },
  net_profits: { min: -500000, max: 2000000, suffix: ' €' },
  roi: { min: -50, max: 150, suffix: '%' },
  avg_initial_trfm_value: { min: 100000, max: 10000000, suffix: ' €' },
  max_profit_report: { min: 10000, max: 1000000, suffix: ' €' },
  min_profit_report: { min: -100000, max: 50000, suffix: ' €' },
  avg_profit_report: { min: -10000, max: 200000, suffix: ' €' },
  transfer_team_pts: { min: 0, max: 100, suffix: ' pts' },
  transfer_competition_pts: { min: 0, max: 100, suffix: ' pts' }
};

// Función para generar un valor realista dentro del rango
function generateValue(field: keyof typeof ECONOMIC_FIELDS, currentValue?: number | null): number {
  const config = ECONOMIC_FIELDS[field];
  
  if (currentValue && currentValue !== 0) {
    // Si hay un valor actual, generar un valor anterior basado en un cambio realista
    const changePercent = (Math.random() * 60) - 30; // Entre -30% y +30%
    const previousValue = currentValue / (1 + (changePercent / 100));
    return Math.max(config.min, Math.min(config.max, Math.round(previousValue)));
  } else {
    // Si no hay valor actual, generar uno aleatorio en el rango
    return Math.round(Math.random() * (config.max - config.min) + config.min);
  }
}

// Función para generar fecha anterior
function generatePreviousDate(): Date {
  const monthsAgo = 1 + Math.floor(Math.random() * 12); // Entre 1 y 12 meses atrás
  const previousDate = new Date();
  previousDate.setMonth(previousDate.getMonth() - monthsAgo);
  return previousDate;
}

// Función para generar fecha de última actualización
function generateLastUpdated(): Date {
  const daysAgo = 1 + Math.floor(Math.random() * 30); // Entre 1 y 30 días atrás
  const lastUpdated = new Date();
  lastUpdated.setDate(lastUpdated.getDate() - daysAgo);
  return lastUpdated;
}

async function populateScoutEconomicHistory() {
  console.log('💰 Iniciando población de historial económico de scouts...');
  
  try {
    // Obtener todos los scouts
    const scouts = await prisma.scout.findMany({
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        total_investment: true,
        net_profits: true,
        roi: true,
        avg_initial_trfm_value: true,
        max_profit_report: true,
        min_profit_report: true,
        avg_profit_report: true,
        transfer_team_pts: true,
        transfer_competition_pts: true,
        // Campos de historial existentes
        previous_total_investment: true,
        previous_net_profits: true,
        previous_roi: true
      }
    });
    
    console.log(`📊 Encontrados ${scouts.length} scouts para procesar`);
    
    let updatedCount = 0;
    
    for (const scout of scouts) {
      const scoutName = scout.scout_name || scout.name || `Scout ${scout.id_scout}`;
      const updates: any = {};
      let hasUpdates = false;
      
      // Procesar cada campo económico
      for (const [fieldName, fieldConfig] of Object.entries(ECONOMIC_FIELDS)) {
        const currentValue = scout[fieldName as keyof typeof scout] as number;
        const previousFieldName = `previous_${fieldName}`;
        const existingPrevious = scout[previousFieldName as keyof typeof scout] as number;
        
        // Solo actualizar si no tiene historial previo
        if (!existingPrevious && currentValue !== null && currentValue !== undefined) {
          // Generar valor anterior
          const previousValue = generateValue(fieldName as keyof typeof ECONOMIC_FIELDS, currentValue);
          const previousDate = generatePreviousDate();
          const lastUpdated = generateLastUpdated();
          
          // Calcular porcentaje de cambio
          let changePercent: number;
          if (fieldName === 'roi') {
            // Para ROI, calcular diferencia en puntos porcentuales
            changePercent = currentValue - previousValue;
          } else {
            // Para otros campos, calcular porcentaje de cambio
            changePercent = previousValue !== 0 
              ? ((currentValue - previousValue) / Math.abs(previousValue)) * 100
              : 0;
          }
          changePercent = Math.round(changePercent * 10) / 10;
          
          // Añadir a las actualizaciones
          updates[`previous_${fieldName}`] = previousValue;
          updates[`previous_${fieldName}_date`] = previousDate;
          updates[`${fieldName}_change_percent`] = changePercent;
          updates[`${fieldName}_last_updated`] = lastUpdated;
          
          hasUpdates = true;
          
          console.log(`  📈 ${scoutName} - ${fieldName}: ${formatValue(previousValue, fieldConfig.suffix)} → ${formatValue(currentValue, fieldConfig.suffix)} (${changePercent > 0 ? '+' : ''}${changePercent}${fieldName === 'roi' ? 'pp' : '%'})`);
        }
      }
      
      // Aplicar actualizaciones si hay cambios
      if (hasUpdates) {
        await prisma.scout.update({
          where: { id_scout: scout.id_scout },
          data: {
            ...updates,
            updatedAt: new Date()
          }
        });
        
        updatedCount++;
      }
    }
    
    console.log(`🎉 ¡Completado! Se actualizaron ${updatedCount} scouts de ${scouts.length} total`);
    
    // Mostrar estadísticas
    const stats = await prisma.scout.aggregate({
      _count: {
        previous_total_investment: true,
        previous_net_profits: true,
        previous_roi: true,
        previous_avg_initial_trfm_value: true,
        previous_max_profit_report: true,
        previous_avg_profit_report: true,
        previous_transfer_team_pts: true,
        previous_transfer_competition_pts: true
      }
    });
    
    console.log('\n📈 Estadísticas de campos poblados:');
    console.log(`- Inversión total: ${stats._count.previous_total_investment}/${scouts.length}`);
    console.log(`- Beneficio neto: ${stats._count.previous_net_profits}/${scouts.length}`);
    console.log(`- ROI: ${stats._count.previous_roi}/${scouts.length}`);
    console.log(`- Valor TRFM inicial promedio: ${stats._count.previous_avg_initial_trfm_value}/${scouts.length}`);
    console.log(`- Máximo beneficio por reporte: ${stats._count.previous_max_profit_report}/${scouts.length}`);
    console.log(`- Beneficio promedio por reporte: ${stats._count.previous_avg_profit_report}/${scouts.length}`);
    console.log(`- Puntos de transferencia de equipo: ${stats._count.previous_transfer_team_pts}/${scouts.length}`);
    console.log(`- Puntos de transferencia de competición: ${stats._count.previous_transfer_competition_pts}/${scouts.length}`);
    
    // Mostrar algunos ejemplos de cambios
    const examples = await prisma.scout.findMany({
      where: {
        AND: [
          { net_profits: { not: null } },
          { previous_net_profits: { not: null } },
          { net_profits_change_percent: { not: null } }
        ]
      },
      select: {
        scout_name: true,
        name: true,
        net_profits: true,
        previous_net_profits: true,
        net_profits_change_percent: true,
        roi: true,
        previous_roi: true,
        roi_change_percent: true
      },
      take: 5,
      orderBy: {
        net_profits_change_percent: 'desc'
      }
    });
    
    if (examples.length > 0) {
      console.log('\n🏆 Top 5 scouts con mayor mejora en beneficios:');
      examples.forEach((scout, index) => {
        const scoutName = scout.scout_name || scout.name || 'Scout sin nombre';
        const profitChange = scout.net_profits_change_percent || 0;
        const roiChange = scout.roi_change_percent || 0;
        const arrow = profitChange > 0 ? '↗️' : profitChange < 0 ? '↘️' : '➡️';
        
        console.log(`${index + 1}. ${scoutName}:`);
        console.log(`   Beneficio: ${formatValue(scout.previous_net_profits)} → ${formatValue(scout.net_profits)} ${arrow} ${profitChange > 0 ? '+' : ''}${profitChange}%`);
        console.log(`   ROI: ${formatValue(scout.previous_roi, '%')} → ${formatValue(scout.roi, '%')} (${roiChange > 0 ? '+' : ''}${roiChange}pp)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error al poblar historial económico:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función helper para formatear valores
function formatValue(value?: number | null, suffix: string = ' €'): string {
  if (!value) return "€0";
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value) + suffix;
}

// Ejecutar el script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateScoutEconomicHistory()
    .then(() => {
      console.log('\n✨ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el script:', error);
      process.exit(1);
    });
}

export { populateScoutEconomicHistory };