import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const prisma = new PrismaClient();

// Rangos para generar valores realistas
const VALUE_RANGES = {
  total_investment: { min: 100000, max: 5000000 },
  net_profits: { min: -500000, max: 3000000 },
  avg_initial_trfm_value: { min: 500000, max: 15000000 },
  min_profit_report: { min: -200000, max: 100000 },
  avg_profit_report: { min: 50000, max: 500000 },
  transfer_team_pts: { min: 10, max: 95 },
  transfer_competition_pts: { min: 15, max: 90 }
};

function generateValue(field: keyof typeof VALUE_RANGES): number {
  const range = VALUE_RANGES[field];
  return Math.round(Math.random() * (range.max - range.min) + range.min);
}

async function populateScoutCurrentValues() {
  console.log('💰 Poblando valores actuales de scouts...');
  
  try {
    const scouts = await prisma.scout.findMany({
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        total_investment: true,
        net_profits: true,
        avg_initial_trfm_value: true,
        min_profit_report: true,
        avg_profit_report: true,
        transfer_team_pts: true,
        transfer_competition_pts: true
      }
    });
    
    console.log(`📊 Procesando ${scouts.length} scouts...`);
    
    let updatedCount = 0;
    
    for (const scout of scouts) {
      const scoutName = scout.scout_name || scout.name || `Scout ${scout.id_scout}`;
      const updates: any = {};
      let hasUpdates = false;
      
      // Poblar campos que están en null
      for (const [fieldName, range] of Object.entries(VALUE_RANGES)) {
        const currentValue = scout[fieldName as keyof typeof scout] as number;
        
        if (currentValue === null || currentValue === undefined) {
          const newValue = generateValue(fieldName as keyof typeof VALUE_RANGES);
          updates[fieldName] = newValue;
          hasUpdates = true;
          
          console.log(`  ✅ ${scoutName} - ${fieldName}: ${formatValue(newValue, getSuffix(fieldName))}`);
        }
      }
      
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
    
    console.log(`🎉 ¡Completado! Se actualizaron ${updatedCount} scouts`);
    
    // Mostrar estadísticas finales
    const stats = await prisma.scout.aggregate({
      _count: {
        total_investment: true,
        net_profits: true,
        avg_initial_trfm_value: true,
        min_profit_report: true,
        avg_profit_report: true,
        transfer_team_pts: true,
        transfer_competition_pts: true
      }
    });
    
    console.log('\n📈 Estadísticas finales:');
    console.log(`- Total Investment: ${stats._count.total_investment}/${scouts.length}`);
    console.log(`- Net Profits: ${stats._count.net_profits}/${scouts.length}`);
    console.log(`- Avg Initial TRFM Value: ${stats._count.avg_initial_trfm_value}/${scouts.length}`);
    console.log(`- Min Profit Report: ${stats._count.min_profit_report}/${scouts.length}`);
    console.log(`- Avg Profit Report: ${stats._count.avg_profit_report}/${scouts.length}`);
    console.log(`- Transfer Team Pts: ${stats._count.transfer_team_pts}/${scouts.length}`);
    console.log(`- Transfer Competition Pts: ${stats._count.transfer_competition_pts}/${scouts.length}`);
    
  } catch (error) {
    console.error('❌ Error poblando valores actuales:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function formatValue(value: number, suffix: string): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value) + suffix;
}

function getSuffix(fieldName: string): string {
  if (fieldName.includes('pts')) return ' pts';
  return ' €';
}

// Ejecutar el script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateScoutCurrentValues()
    .then(() => {
      console.log('\n✨ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el script:', error);
      process.exit(1);
    });
}

export { populateScoutCurrentValues };