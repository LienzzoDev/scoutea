const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPlayerStats3m() {
  console.log('📊 Insertando datos de ejemplo en player_stats_3m...\n');

  try {
    // 1. Obtener jugadores existentes
    const jugadores = await prisma.jugador.findMany({
      select: {
        id_player: true,
        player_name: true,
        position_player: true,
        age: true,
        player_rating: true
      },
      take: 8
    });

    if (jugadores.length === 0) {
      console.log('❌ No hay jugadores en la base de datos');
      return;
    }

    console.log(`👥 Insertando estadísticas para ${jugadores.length} jugadores...`);

    // 2. Generar datos para cada jugador
    for (const jugador of jugadores) {
      console.log(`   📊 Generando stats para ${jugador.player_name} (${jugador.position_player})`);
      
      const statsData = generatePlayerStats3m(jugador);
      
      await prisma.playerStats3m.upsert({
        where: { id_player: jugador.id_player },
        update: statsData,
        create: {
          id_player: jugador.id_player,
          ...statsData
        }
      });
    }

    // 3. Mostrar estadísticas finales
    const totalStats = await prisma.playerStats3m.count();
    console.log(`\n🎉 Completado! ${totalStats} registros de estadísticas insertados`);

    // 4. Mostrar ejemplos
    const ejemplos = await prisma.playerStats3m.findMany({
      take: 3,
      include: {
        player: {
          select: {
            player_name: true,
            position_player: true
          }
        }
      }
    });

    console.log('\n📋 Ejemplos insertados:');
    ejemplos.forEach(stat => {
      console.log(`- ${stat.player.player_name} (${stat.player.position_player}):`);
      console.log(`  Goals p90: ${stat.goals_p90_3m} | Assists p90: ${stat.assists_p90_3m}`);
      console.log(`  Matches: ${stat.matches_played_tot_3m} | Minutes: ${stat.minutes_played_tot_3m}`);
    });

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function generatePlayerStats3m(jugador) {
  const rating = jugador.player_rating || 80;
  const position = jugador.position_player || 'Unknown';
  const age = jugador.age || 25;
  
  // Base multiplier basado en rating
  const baseMultiplier = rating / 100;
  
  // Partidos y minutos (realistas para 3 meses)
  const matches = Math.floor(Math.random() * 15) + 8; // 8-22 partidos
  const minutes = matches * (Math.random() * 30 + 60); // 60-90 min promedio por partido
  
  // Generar estadísticas basadas en posición
  let stats = {
    wyscout_id: Math.floor(Math.random() * 1000000) + 100000,
    stats_evo_3m: (Math.random() * 20 - 10).toFixed(2), // -10 a +10
    
    // Partidos y minutos
    matches_played_tot_3m: matches,
    matches_played_tot_3m_norm: Math.min(100, (matches / 25) * 100).toFixed(2),
    matches_played_tot_3m_rank: Math.floor(Math.random() * 500) + 1,
    minutes_played_tot_3m: Math.floor(minutes),
    minutes_played_tot_3m_norm: Math.min(100, (minutes / 2000) * 100).toFixed(2),
    minutes_played_tot_3m_rank: Math.floor(Math.random() * 500) + 1,
    
    // Tarjetas (menos para mejores jugadores)
    yellow_cards_p90_3m: (Math.random() * 0.5 * (1.2 - baseMultiplier)).toFixed(3),
    yellow_cards_p90_3m_norm: (Math.random() * 100).toFixed(2),
    yellow_cards_p90_rank: Math.floor(Math.random() * 500) + 1,
    yellow_cards_p90_3m_norm_neg: (Math.random() * 100).toFixed(2),
    yellow_cards_tot_3m: Math.floor(Math.random() * 8),
    yellow_cards_tot_3m_norm: (Math.random() * 100).toFixed(2),
    
    red_cards_p90_3m: (Math.random() * 0.1 * (1.2 - baseMultiplier)).toFixed(3),
    red_cards_p90_3m_norm: (Math.random() * 100).toFixed(2),
    red_cards_p90_rank: Math.floor(Math.random() * 500) + 1,
    red_cards_p90_3m_norm_neg: (Math.random() * 100).toFixed(2),
    red_cards_tot_3m: Math.floor(Math.random() * 2),
    red_cards_tot_3m_norm: (Math.random() * 100).toFixed(2),
    
    // Faltas
    fouls_p90_3m: (Math.random() * 3 + 0.5).toFixed(3),
    fouls_p90_3m_norm: (Math.random() * 100).toFixed(2),
    fouls_p90_3m_rank: Math.floor(Math.random() * 500) + 1,
    fouls_p90_3m_norm_neg: (Math.random() * 100).toFixed(2),
    fouls_tot_3m: Math.floor(Math.random() * 40) + 5,
    fouls_tot_3m_norm: (Math.random() * 100).toFixed(2),
  };

  // Estadísticas específicas por posición
  if (position === 'GK') {
    // Estadísticas de portero
    Object.assign(stats, {
      goals_p90_3m: '0.000',
      goals_p90_3m_norm: '0.00',
      goals_p90_3m_rank: 500,
      goals_tot_3m: 0,
      goals_tot_3m_norm: '0.00',
      
      assists_p90_3m: (Math.random() * 0.1).toFixed(3),
      assists_p90_3m_norm: (Math.random() * 20).toFixed(2),
      assists_p90_3m_rank: Math.floor(Math.random() * 100) + 400,
      assists_tot_3m: Math.floor(Math.random() * 2),
      assists_tot_3m_norm: (Math.random() * 20).toFixed(2),
      
      // Específicas de portero
      conceded_goals_p90_3m: (Math.random() * 2 + 0.5).toFixed(3),
      conceded_goals_p90_3m_norm: (Math.random() * 100).toFixed(2),
      conceded_goals_p90_3m_rank: Math.floor(Math.random() * 200) + 1,
      conceded_goals_p90_3m_norm_neg: (Math.random() * 100).toFixed(2),
      conceded_goals_tot_3m: Math.floor(Math.random() * 25) + 5,
      conceded_goals_tot_3m_norm: (Math.random() * 100).toFixed(2),
      
      prevented_goals_p90_3m: (Math.random() * 2 - 1).toFixed(3), // Puede ser negativo
      prevented_goals_p90_3m_norm: (Math.random() * 100).toFixed(2),
      prevented_goals_p90_rank: Math.floor(Math.random() * 200) + 1,
      prevented_goals_tot_3m: (Math.random() * 20 - 10).toFixed(3),
      prevented_goals_tot_3m_norm: (Math.random() * 100).toFixed(2),
      
      shots_against_p90_3m: (Math.random() * 8 + 2).toFixed(3),
      shots_against_p90_3m_norm: (Math.random() * 100).toFixed(2),
      shots_against_p90_3m_rank: Math.floor(Math.random() * 200) + 1,
      shots_against_tot_3m: Math.floor(Math.random() * 100) + 20,
      shots_against_tot_3m_norm: (Math.random() * 100).toFixed(2),
      
      clean_sheets_percent_3m: (Math.random() * 60 + 20).toFixed(2),
      clean_sheets_percent_3m_norm: (Math.random() * 100).toFixed(2),
      clean_sheets_percent_3m_rank: Math.floor(Math.random() * 200) + 1,
      clean_sheets_tot_3m: Math.floor(Math.random() * 12) + 2,
      clean_sheets_tot_3m_norm: (Math.random() * 100).toFixed(2),
      
      save_rate_percent_3m: (Math.random() * 30 + 60).toFixed(2),
      save_rate_percent_3m_norm: (Math.random() * 100).toFixed(2),
      save_rate_percent_3m_rank: Math.floor(Math.random() * 200) + 1,
    });
  } else {
    // Jugadores de campo
    Object.assign(stats, {
      goals_p90_3m: (Math.random() * 1.5 * baseMultiplier).toFixed(3),
      goals_p90_3m_norm: (Math.random() * 100).toFixed(2),
      goals_p90_3m_rank: Math.floor(Math.random() * 500) + 1,
      goals_tot_3m: Math.floor(Math.random() * 20 * baseMultiplier),
      goals_tot_3m_norm: (Math.random() * 100).toFixed(2),
      
      assists_p90_3m: (Math.random() * 1.0 * baseMultiplier).toFixed(3),
      assists_p90_3m_norm: (Math.random() * 100).toFixed(2),
      assists_p90_3m_rank: Math.floor(Math.random() * 500) + 1,
      assists_tot_3m: Math.floor(Math.random() * 15 * baseMultiplier),
      assists_tot_3m_norm: (Math.random() * 100).toFixed(2),
      
      // Disparos
      shots_p90_3m: (Math.random() * 5 * baseMultiplier + 0.5).toFixed(3),
      shots_p90_3m_norm: (Math.random() * 100).toFixed(2),
      shots_p90_3m_rank: Math.floor(Math.random() * 500) + 1,
      shots_tot_3m: Math.floor(Math.random() * 60 * baseMultiplier) + 5,
      shots_tot_3m_norm: (Math.random() * 100).toFixed(2),
      
      effectiveness_percent_3m: (Math.random() * 30 + 5).toFixed(2),
      effectiveness_percent_3m_norm: (Math.random() * 100).toFixed(2),
      effectiveness_percent_3m_rank: Math.floor(Math.random() * 500) + 1,
    });
  }

  // Estadísticas comunes para todos
  Object.assign(stats, {
    // Entradas e intercepciones (más para defensas)
    tackles_p90_3m: (Math.random() * 4 * (position.includes('B') || position === 'DM' ? 1.5 : 0.8)).toFixed(3),
    tackles_p90_3m_norm: (Math.random() * 100).toFixed(2),
    tackles_p90_3m_rank: Math.floor(Math.random() * 500) + 1,
    tackles_tot_3m: Math.floor(Math.random() * 50) + 5,
    tackles_tot_3m_norm: (Math.random() * 100).toFixed(2),
    
    interceptions_p90_3m: (Math.random() * 3 * (position.includes('B') || position === 'DM' ? 1.5 : 0.8)).toFixed(3),
    interceptions_p90_3m_norm: (Math.random() * 100).toFixed(2),
    interceptions_p90_3m_rank: Math.floor(Math.random() * 500) + 1,
    interceptions_tot_3m: Math.floor(Math.random() * 40) + 3,
    interceptions_tot_3m_norm: (Math.random() * 100).toFixed(2),
    
    // Pases
    passes_p90_3m: (Math.random() * 60 + 20).toFixed(3),
    passes_p90_3m_norm: (Math.random() * 100).toFixed(2),
    passes_p90_3m_rank: Math.floor(Math.random() * 500) + 1,
    passes_tot_3m: Math.floor(Math.random() * 1500) + 200,
    passes_tot_3m_norm: (Math.random() * 100).toFixed(2),
    
    forward_passes_p90_3m: (Math.random() * 25 + 5).toFixed(3),
    forward_passes_p90_3m_norm: (Math.random() * 100).toFixed(2),
    forward_passes_p90_3m_rank: Math.floor(Math.random() * 500) + 1,
    forward_passes_tot_3m: Math.floor(Math.random() * 600) + 50,
    forward_passes_tot_3m_norm: (Math.random() * 100).toFixed(2),
    
    crosses_p90_3m: (Math.random() * 8 * (position.includes('W') || position.includes('B') ? 1.5 : 0.5)).toFixed(3),
    crosses_p90_3m_norm: (Math.random() * 100).toFixed(2),
    crosses_p90_3m_rank: Math.floor(Math.random() * 500) + 1,
    crosses_tot_3m: Math.floor(Math.random() * 80),
    crosses_tot_3m_norm: (Math.random() * 100).toFixed(2),
    
    accurate_passes_percent_3m: (Math.random() * 25 + 70).toFixed(2),
    accurate_passes_percent_3m_norm: (Math.random() * 100).toFixed(2),
    accurate_passes_percent_3m_rank: Math.floor(Math.random() * 500) + 1,
    
    // Duelos
    off_duels_p90_3m: (Math.random() * 8 + 2).toFixed(3),
    off_duels_p90_3m_norm: (Math.random() * 100).toFixed(2),
    off_duels_p90_3m_rank: Math.floor(Math.random() * 500) + 1,
    off_duels_tot_3m: Math.floor(Math.random() * 100) + 10,
    off_duels_tot_3m_norm: (Math.random() * 100).toFixed(2),
    off_duels_won_percent_3m: (Math.random() * 40 + 30).toFixed(2),
    off_duels_won_percent_3m_norm: (Math.random() * 100).toFixed(2),
    off_duels_won_percent_3m_rank: Math.floor(Math.random() * 500) + 1,
    
    def_duels_p90_3m: (Math.random() * 6 + 1).toFixed(3),
    def_duels_p90_3m_norm: (Math.random() * 100).toFixed(2),
    def_duels_p90_3m_rank: Math.floor(Math.random() * 500) + 1,
    def_duels_tot_3m: Math.floor(Math.random() * 80) + 5,
    def_duels_tot_3m_norm: (Math.random() * 100).toFixed(2),
    def_duels_won_percent_3m: (Math.random() * 40 + 40).toFixed(2),
    def_duels_won_percent_3m_norm: (Math.random() * 100).toFixed(2),
    def_duels_won_percent_3m_rank: Math.floor(Math.random() * 500) + 1,
    
    aerials_duels_p90_3m: (Math.random() * 5 + 0.5).toFixed(3),
    aerials_duels_p90_3m_norm: (Math.random() * 100).toFixed(2),
    aerials_duels_p90_3m_rank: Math.floor(Math.random() * 500) + 1,
    aerials_duels_tot_3m: Math.floor(Math.random() * 60) + 2,
    aerials_duels_tot_3m_norm: (Math.random() * 100).toFixed(2),
    aerials_duels_won_percent_3m: (Math.random() * 50 + 25).toFixed(2),
    aerials_duels_won_percent_3m_norm: (Math.random() * 100).toFixed(2),
    aerials_duels_won_percent_3m_rank: Math.floor(Math.random() * 500) + 1,
  });

  return stats;
}

// Ejecutar el seed
seedPlayerStats3m()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });