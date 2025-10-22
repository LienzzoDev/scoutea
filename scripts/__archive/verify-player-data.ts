import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyPlayerData() {
  console.log('🔍 Verificando datos de jugadores...');
  
  try {
    // Obtener algunos jugadores para verificar
    const players = await prisma.jugador.findMany({
      take: 5,
      select: {
        id_player: true,
        player_name: true,
        age: true,
        date_of_birth: true,
        position_player: true,
        foot: true,
        height: true,
        nationality_1: true,
        nationality_2: true,
        team_name: true,
        team_country: true,
        team_competition: true,
        competition_country: true,
        agency: true,
        contract_end: true,
        on_loan: true,
        team_level: true,
        competition_tier: true,
        competition_level: true
      }
    });
    
    console.log('\n📋 Muestra de jugadores actualizados:');
    console.log('=====================================');
    
    players.forEach((player, index) => {
      console.log(`\n${index + 1}. ${player.player_name}`);
      console.log(`   - Edad: ${player.age} años`);
      console.log(`   - Fecha nacimiento: ${player.date_of_birth?.toLocaleDateString('es-ES') || 'N/A'}`);
      console.log(`   - Posición: ${player.position_player || 'N/A'}`);
      console.log(`   - Pie: ${player.foot || 'N/A'}`);
      console.log(`   - Altura: ${player.height ? `${player.height} cm` : 'N/A'}`);
      console.log(`   - Nacionalidad: ${player.nationality_1 || 'N/A'}`);
      console.log(`   - Segunda nacionalidad: ${player.nationality_2 || 'No aplica'}`);
      console.log(`   - Equipo: ${player.team_name || 'N/A'}`);
      console.log(`   - País equipo: ${player.team_country || 'N/A'}`);
      console.log(`   - Competición: ${player.team_competition || 'N/A'}`);
      console.log(`   - País competición: ${player.competition_country || 'N/A'}`);
      console.log(`   - Agencia: ${player.agency || 'N/A'}`);
      console.log(`   - Fin contrato: ${player.contract_end?.toLocaleDateString('es-ES') || 'N/A'}`);
      console.log(`   - En préstamo: ${player.on_loan === true ? 'Sí' : player.on_loan === false ? 'No' : 'N/A'}`);
      console.log(`   - Nivel equipo: ${player.team_level || 'N/A'}`);
      console.log(`   - Tier competición: ${player.competition_tier || 'N/A'}`);
      console.log(`   - Nivel competición: ${player.competition_level || 'N/A'}`);
    });
    
    // Estadísticas generales
    const totalPlayers = await prisma.jugador.count();
    const playersWithAllData = await prisma.jugador.count({
      where: {
        AND: [
          { date_of_birth: { not: null } },
          { age: { not: null } },
          { position_player: { not: null } },
          { foot: { not: null } },
          { height: { not: null } },
          { nationality_1: { not: null } },
          { team_country: { not: null } },
          { team_competition: { not: null } },
          { competition_country: { not: null } },
          { agency: { not: null } },
          { contract_end: { not: null } },
          { team_level: { not: null } },
          { competition_tier: { not: null } },
          { competition_level: { not: null } }
        ]
      }
    });
    
    console.log('\n📊 Estadísticas generales:');
    console.log('==========================');
    console.log(`Total de jugadores: ${totalPlayers}`);
    console.log(`Jugadores con datos completos: ${playersWithAllData}`);
    console.log(`Porcentaje de completitud: ${((playersWithAllData / totalPlayers) * 100).toFixed(1)}%`);
    
    // Verificar campos específicos que antes mostraban N/A
    const fieldsToCheck = [
      { field: 'date_of_birth', name: 'Fecha de nacimiento' },
      { field: 'age', name: 'Edad' },
      { field: 'position_player', name: 'Posición' },
      { field: 'foot', name: 'Pie preferido' },
      { field: 'height', name: 'Altura' },
      { field: 'nationality_1', name: 'Nacionalidad' },
      { field: 'team_country', name: 'País del equipo' },
      { field: 'team_competition', name: 'Competición' },
      { field: 'agency', name: 'Agencia' },
      { field: 'contract_end', name: 'Fin de contrato' }
    ];
    
    console.log('\n🎯 Campos que antes mostraban N/A:');
    console.log('==================================');
    
    for (const { field, name } of fieldsToCheck) {
      const count = await prisma.jugador.count({
        where: {
          [field]: { not: null }
        }
      });
      const percentage = ((count / totalPlayers) * 100).toFixed(1);
      console.log(`${name}: ${count}/${totalPlayers} (${percentage}%)`);
    }
    
  } catch (error) {
    console.error('❌ Error al verificar datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyPlayerData()
    .then(() => {
      console.log('\n✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en la verificación:', error);
      process.exit(1);
    });
}

export { verifyPlayerData };