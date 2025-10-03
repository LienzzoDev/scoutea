import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Datos de ejemplo para poblar campos faltantes
const SAMPLE_DATA = {
  // Posiciones comunes en fútbol
  positions: [
    'Portero', 'Defensa Central', 'Lateral Derecho', 'Lateral Izquierdo',
    'Mediocentro Defensivo', 'Mediocentro', 'Mediocentro Ofensivo',
    'Extremo Derecho', 'Extremo Izquierdo', 'Delantero Centro', 'Segundo Delantero'
  ],
  
  // Pies preferidos
  feet: ['Derecho', 'Izquierdo', 'Ambidiestro'],
  
  // Nacionalidades comunes
  nationalities: [
    'España', 'Francia', 'Brasil', 'Argentina', 'Alemania', 'Italia',
    'Portugal', 'Inglaterra', 'Holanda', 'Bélgica', 'Colombia', 'México',
    'Uruguay', 'Chile', 'Croacia', 'Polonia', 'Dinamarca', 'Suecia'
  ],
  
  // Agencias comunes
  agencies: [
    'CAA Sports', 'Wasserman', 'ICM Partners', 'Stellar Group',
    'Base Soccer', 'Promoesport', 'You First Sports', 'Gestifute',
    'Sports Entertainment Group', 'Bahia International', 'Key Sports Management'
  ],
  
  // Países de equipos
  teamCountries: [
    'España', 'Inglaterra', 'Italia', 'Alemania', 'Francia', 'Portugal',
    'Holanda', 'Brasil', 'Argentina', 'México', 'Estados Unidos', 'Bélgica'
  ],
  
  // Competiciones por país
  competitions: {
    'España': 'La Liga',
    'Inglaterra': 'Premier League',
    'Italia': 'Serie A',
    'Alemania': 'Bundesliga',
    'Francia': 'Ligue 1',
    'Portugal': 'Primeira Liga',
    'Holanda': 'Eredivisie',
    'Brasil': 'Brasileirão',
    'Argentina': 'Liga Profesional',
    'México': 'Liga MX',
    'Estados Unidos': 'MLS',
    'Bélgica': 'Pro League'
  }
};

// Función para generar una fecha de nacimiento realista
function generateDateOfBirth(age?: number | null): Date {
  const currentYear = new Date().getFullYear();
  const targetAge = age || (16 + Math.floor(Math.random() * 20)); // Entre 16 y 36 años
  const birthYear = currentYear - targetAge;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1; // Evitar problemas con febrero
  
  return new Date(birthYear, month - 1, day);
}

// Función para generar altura realista por posición
function generateHeight(position?: string | null): number {
  const baseHeight = position === 'Portero' ? 185 : 175;
  const variation = Math.floor(Math.random() * 20) - 10; // ±10 cm
  return Math.max(160, Math.min(200, baseHeight + variation));
}

// Función para generar edad basada en fecha de nacimiento
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

// Función para generar fecha de fin de contrato
function generateContractEnd(): Date {
  const currentDate = new Date();
  const yearsToAdd = 1 + Math.floor(Math.random() * 4); // Entre 1 y 5 años
  const contractEnd = new Date(currentDate);
  contractEnd.setFullYear(currentDate.getFullYear() + yearsToAdd);
  contractEnd.setMonth(5); // Junio (mes 5, índice 0)
  contractEnd.setDate(30);
  
  return contractEnd;
}

// Función para obtener un elemento aleatorio de un array
function getRandomElement<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index]!;
}

async function populateMissingPlayerData() {
  console.log('🚀 Iniciando población de datos faltantes de jugadores...');
  
  try {
    // Obtener todos los jugadores
    const players = await prisma.jugador.findMany({
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
        owner_club: true,
        owner_club_country: true,
        team_level: true,
        competition_tier: true,
        competition_level: true
      }
    });
    
    console.log(`📊 Encontrados ${players.length} jugadores para procesar`);
    
    let updatedCount = 0;
    
    for (const player of players) {
      const updates: any = {};
      let hasUpdates = false;
      
      // 1. Fecha de nacimiento y edad
      if (!player.date_of_birth) {
        const dateOfBirth = generateDateOfBirth(player.age);
        updates.date_of_birth = dateOfBirth;
        updates.correct_date_of_birth = dateOfBirth;
        hasUpdates = true;
      }
      
      if (!player.age && (player.date_of_birth || updates.date_of_birth)) {
        const birthDate = updates.date_of_birth || player.date_of_birth;
        updates.age = calculateAge(birthDate);
        hasUpdates = true;
      }
      
      // 2. Posición
      if (!player.position_player) {
        const position = getRandomElement(SAMPLE_DATA.positions);
        updates.position_player = position;
        updates.correct_position_player = position;
        hasUpdates = true;
      }
      
      // 3. Pie preferido
      if (!player.foot) {
        const foot = getRandomElement(SAMPLE_DATA.feet);
        updates.foot = foot;
        updates.correct_foot = foot;
        hasUpdates = true;
      }
      
      // 4. Altura
      if (!player.height) {
        const height = generateHeight(player.position_player || updates.position_player);
        updates.height = height;
        updates.correct_height = height;
        hasUpdates = true;
      }
      
      // 5. Nacionalidad principal
      if (!player.nationality_1) {
        const nationality = getRandomElement(SAMPLE_DATA.nationalities);
        updates.nationality_1 = nationality;
        updates.correct_nationality_1 = nationality;
        hasUpdates = true;
      }
      
      // 6. Segunda nacionalidad (30% de probabilidad)
      if (!player.nationality_2 && Math.random() < 0.3) {
        const availableNationalities = SAMPLE_DATA.nationalities.filter(
          n => n !== (player.nationality_1 || updates.nationality_1)
        );
        const nationality2 = getRandomElement(availableNationalities);
        updates.nationality_2 = nationality2;
        updates.correct_nationality_2 = nationality2;
        hasUpdates = true;
      }
      
      // 7. País del equipo
      if (!player.team_country && player.team_name) {
        const teamCountry = getRandomElement(SAMPLE_DATA.teamCountries);
        updates.team_country = teamCountry;
        hasUpdates = true;
      }
      
      // 8. Competición del equipo
      if (!player.team_competition && (player.team_country || updates.team_country)) {
        const country = updates.team_country || player.team_country;
        const competition = (SAMPLE_DATA.competitions as any)[country] || 'Liga Nacional';
        updates.team_competition = competition;
        hasUpdates = true;
      }
      
      // 9. País de la competición
      if (!player.competition_country && (player.team_country || updates.team_country)) {
        updates.competition_country = updates.team_country || player.team_country;
        hasUpdates = true;
      }
      
      // 10. Agencia (70% de probabilidad)
      if (!player.agency && Math.random() < 0.7) {
        const agency = getRandomElement(SAMPLE_DATA.agencies);
        updates.agency = agency;
        updates.correct_agency = agency;
        hasUpdates = true;
      }
      
      // 11. Fecha de fin de contrato
      if (!player.contract_end) {
        const contractEnd = generateContractEnd();
        updates.contract_end = contractEnd;
        updates.correct_contract_end = contractEnd;
        hasUpdates = true;
      }
      
      // 12. Estado de préstamo (10% de probabilidad)
      if (player.on_loan === null && Math.random() < 0.1) {
        updates.on_loan = true;
        // Si está en préstamo, generar club propietario
        if (!player.owner_club) {
          updates.owner_club = `${player.team_name} (Propietario)`;
          updates.owner_club_country = player.team_country || updates.team_country;
        }
        hasUpdates = true;
      } else if (player.on_loan === null) {
        updates.on_loan = false;
        hasUpdates = true;
      }
      
      // 13. Nivel del equipo (generar valores realistas)
      if (!player.team_level) {
        const levels = ['Elite', 'Primera División', 'Segunda División', 'Tercera División'];
        updates.team_level = getRandomElement(levels);
        hasUpdates = true;
      }
      
      // 14. Tier de competición
      if (!player.competition_tier) {
        const tiers = ['1', '2', '3', '4'];
        updates.competition_tier = getRandomElement(tiers);
        hasUpdates = true;
      }
      
      // 15. Nivel de competición
      if (!player.competition_level) {
        const levels = ['Elite', 'Alto', 'Medio', 'Bajo'];
        updates.competition_level = getRandomElement(levels);
        hasUpdates = true;
      }
      
      // Aplicar actualizaciones si hay cambios
      if (hasUpdates) {
        await prisma.jugador.update({
          where: { id_player: player.id_player },
          data: {
            ...updates,
            updatedAt: new Date()
          }
        });
        
        updatedCount++;
        
        if (updatedCount % 50 === 0) {
          console.log(`✅ Actualizados ${updatedCount} jugadores...`);
        }
      }
    }
    
    console.log(`🎉 ¡Completado! Se actualizaron ${updatedCount} jugadores de ${players.length} total`);
    
    // Mostrar estadísticas de campos poblados
    const stats = await prisma.jugador.aggregate({
      _count: {
        date_of_birth: true,
        age: true,
        position_player: true,
        foot: true,
        height: true,
        nationality_1: true,
        nationality_2: true,
        team_country: true,
        team_competition: true,
        competition_country: true,
        agency: true,
        contract_end: true,
        team_level: true,
        competition_tier: true,
        competition_level: true
      }
    });
    
    console.log('\n📈 Estadísticas de campos poblados:');
    console.log(`- Fecha de nacimiento: ${stats._count.date_of_birth}/${players.length}`);
    console.log(`- Edad: ${stats._count.age}/${players.length}`);
    console.log(`- Posición: ${stats._count.position_player}/${players.length}`);
    console.log(`- Pie preferido: ${stats._count.foot}/${players.length}`);
    console.log(`- Altura: ${stats._count.height}/${players.length}`);
    console.log(`- Nacionalidad 1: ${stats._count.nationality_1}/${players.length}`);
    console.log(`- Nacionalidad 2: ${stats._count.nationality_2}/${players.length}`);
    console.log(`- País del equipo: ${stats._count.team_country}/${players.length}`);
    console.log(`- Competición: ${stats._count.team_competition}/${players.length}`);
    console.log(`- País de competición: ${stats._count.competition_country}/${players.length}`);
    console.log(`- Agencia: ${stats._count.agency}/${players.length}`);
    console.log(`- Fin de contrato: ${stats._count.contract_end}/${players.length}`);
    console.log(`- Nivel del equipo: ${stats._count.team_level}/${players.length}`);
    console.log(`- Tier de competición: ${stats._count.competition_tier}/${players.length}`);
    console.log(`- Nivel de competición: ${stats._count.competition_level}/${players.length}`);
    
  } catch (error) {
    console.error('❌ Error al poblar datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  populateMissingPlayerData()
    .then(() => {
      console.log('✨ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el script:', error);
      process.exit(1);
    });
}

export { populateMissingPlayerData };