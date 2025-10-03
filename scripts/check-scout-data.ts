import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const prisma = new PrismaClient();

async function checkScoutData() {
  console.log('🔍 Verificando datos de scouts...');
  
  try {
    // Buscar el scout Thomas Mueller
    const scout = await prisma.scout.findFirst({
      where: {
        OR: [
          { scout_name: { contains: 'Thomas', mode: 'insensitive' } },
          { name: { contains: 'Thomas', mode: 'insensitive' } }
        ]
      },
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        country: true,
        age: true,
        roi: true,
        previous_roi: true,
        roi_change_percent: true,
        max_profit_report: true,
        previous_max_profit_report: true,
        max_profit_report_change_percent: true,
        total_investment: true,
        net_profits: true,
        avg_initial_trfm_value: true,
        transfer_team_pts: true,
        transfer_competition_pts: true
      }
    });
    
    if (!scout) {
      console.log('❌ No se encontró el scout Thomas Mueller');
      return;
    }
    
    console.log('\n📊 Datos del scout encontrado:');
    console.log('==============================');
    console.log(`ID: ${scout.id_scout}`);
    console.log(`Nombre: ${scout.scout_name || scout.name}`);
    console.log(`País: ${scout.country}`);
    console.log(`Edad: ${scout.age}`);
    
    console.log('\n💰 Datos económicos:');
    console.log('====================');
    console.log(`ROI actual: ${scout.roi}%`);
    console.log(`ROI anterior: ${scout.previous_roi}%`);
    console.log(`Cambio ROI: ${scout.roi_change_percent}pp`);
    console.log(`Max Profit actual: ${scout.max_profit_report} €`);
    console.log(`Max Profit anterior: ${scout.previous_max_profit_report} €`);
    console.log(`Cambio Max Profit: ${scout.max_profit_report_change_percent}%`);
    console.log(`Total Investment: ${scout.total_investment} €`);
    console.log(`Net Profits: ${scout.net_profits} €`);
    console.log(`Avg Initial TRFM Value: ${scout.avg_initial_trfm_value} €`);
    console.log(`Transfer Team Pts: ${scout.transfer_team_pts} pts`);
    console.log(`Transfer Competition Pts: ${scout.transfer_competition_pts} pts`);
    
    // Verificar si tiene datos de historial
    const hasHistory = scout.previous_roi !== null || scout.previous_max_profit_report !== null;
    console.log(`\n📈 Tiene historial: ${hasHistory ? 'Sí' : 'No'}`);
    
    // Listar todos los scouts disponibles
    console.log('\n📋 Todos los scouts disponibles:');
    console.log('================================');
    const allScouts = await prisma.scout.findMany({
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
        country: true,
        roi: true,
        max_profit_report: true
      },
      take: 10
    });
    
    allScouts.forEach((s, index) => {
      console.log(`${index + 1}. ${s.scout_name || s.name} (${s.country}) - ROI: ${s.roi}%, Max Profit: ${s.max_profit_report} €`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (import.meta.url === `file://${process.argv[1]}`) {
  checkScoutData()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en la verificación:', error);
      process.exit(1);
    });
}

export { checkScoutData };