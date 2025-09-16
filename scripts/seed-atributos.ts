import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAtributos() {
  console.log('🌱 Iniciando seed de atributos...');

  try {
    // Obtener algunos jugadores existentes
    const jugadores = await prisma.jugador.findMany({
      take: 10,
      select: {
        id_player: true,
        player_name: true,
        position_player: true
      }
    });

    if (jugadores.length === 0) {
      console.log('❌ No hay jugadores en la base de datos. Creando jugadores de ejemplo...');
      
      // Crear jugadores de ejemplo
      const jugadoresEjemplo = await Promise.all([
        prisma.jugador.create({
          data: {
            player_name: 'Lionel Messi',
            position_player: 'RW',
            age: 36,
            nationality_1: 'Argentina',
            team_name: 'Inter Miami',
            team_country: 'USA',
            player_rating: 95.5,
            player_elo: 2800,
            height: 170,
            foot: 'Left'
          }
        }),
        prisma.jugador.create({
          data: {
            player_name: 'Erling Haaland',
            position_player: 'ST',
            age: 23,
            nationality_1: 'Norway',
            team_name: 'Manchester City',
            team_country: 'England',
            player_rating: 92.8,
            player_elo: 2650,
            height: 194,
            foot: 'Left'
          }
        }),
        prisma.jugador.create({
          data: {
            player_name: 'Thibaut Courtois',
            position_player: 'GK',
            age: 31,
            nationality_1: 'Belgium',
            team_name: 'Real Madrid',
            team_country: 'Spain',
            player_rating: 89.2,
            player_elo: 2450,
            height: 199,
            foot: 'Left'
          }
        }),
        prisma.jugador.create({
          data: {
            player_name: 'Luka Modric',
            position_player: 'CM',
            age: 38,
            nationality_1: 'Croatia',
            team_name: 'Real Madrid',
            team_country: 'Spain',
            player_rating: 88.5,
            player_elo: 2420,
            height: 172,
            foot: 'Right'
          }
        }),
        prisma.jugador.create({
          data: {
            player_name: 'Virgil van Dijk',
            position_player: 'CB',
            age: 32,
            nationality_1: 'Netherlands',
            team_name: 'Liverpool',
            team_country: 'England',
            player_rating: 90.1,
            player_elo: 2520,
            height: 193,
            foot: 'Right'
          }
        })
      ]);

      console.log(`✅ Creados ${jugadoresEjemplo.length} jugadores de ejemplo`);
      
      // Actualizar la lista de jugadores
      jugadores.push(...jugadoresEjemplo.map(j => ({
        id_player: j.id_player,
        player_name: j.player_name,
        position_player: j.position_player
      })));
    }

    console.log(`📊 Insertando atributos para ${jugadores.length} jugadores...`);

    // Datos de atributos por posición
    const atributosPorJugador = [
      // Lionel Messi - Extremo derecho/Mediapunta
      {
        id_player: jugadores[0].id_player,
        id_fmi: 10001,
        total_fmi_pts: 1950,
        total_fmi_pts_norm: 98,
        
        // Habilidades técnicas excepcionales
        dribbling_fmi: 99,
        technique_fmi: 98,
        vision_fmi: 97,
        passing_fmi: 95,
        finishing_fmi: 94,
        first_touch_fmi: 98,
        free_kick_taking_fmi: 96,
        long_shots_fmi: 92,
        
        // Físico (limitaciones por edad)
        acceleration_fmi: 75,
        pace_fmi: 78,
        agility_fmi: 88,
        balance_fmi: 95,
        stamina_fmi: 82,
        
        // Mental excepcional
        composure_fmi: 99,
        decisions_fmi: 96,
        flair_fmi: 99,
        anticipation_fmi: 94,
        
        // Aptitudes posicionales
        attacking_mid_right_fmi: 98,
        rw_level: 5,
        attacking_mid_central_fmi: 96,
        am_level: 5,
        striker_fmi: 88,
        st_level: 4,
        
        // Arquetipos
        creativity: 99,
        creativity_level: 5,
        ball_control: 98,
        ball_control_level: 5,
        finishing_archetype: 94,
        finishing_level: 5,
        
        // Roles de extremo
        wide_att_unlocker: 98,
        wide_att_unlocker_percent: 85,
        wide_att_threat: 95,
        wide_att_threat_percent: 75,
        
        // Dominancia de pie izquierdo
        left_foot_fmi: 99,
        right_foot_fmi: 65,
        left_foot_dominance: 95,
        left_foot_dominance_level: 5,
        
        // Tendencias ofensivas
        positional_att_tendency: 85,
        positional_att_tendency_percent: 70,
        influence_off_tendency: 95,
        influence_off_tendency_percent: 90
      },
      
      // Erling Haaland - Delantero centro
      {
        id_player: jugadores[1].id_player,
        id_fmi: 10002,
        total_fmi_pts: 1820,
        total_fmi_pts_norm: 91,
        
        // Habilidades técnicas de delantero
        finishing_fmi: 96,
        heading_fmi: 88,
        first_touch_fmi: 85,
        off_the_ball_fmi: 94,
        technique_fmi: 82,
        
        // Físico excepcional
        pace_fmi: 94,
        acceleration_fmi: 92,
        strength_fmi: 90,
        jumping_fmi: 88,
        stamina_fmi: 85,
        natural_fitness_fmi: 92,
        
        // Mental sólido
        composure_fmi: 88,
        determination_fmi: 92,
        anticipation_fmi: 90,
        aggression_fmi: 85,
        
        // Aptitudes posicionales
        striker_fmi: 96,
        st_level: 5,
        attacking_mid_central_fmi: 78,
        am_level: 3,
        
        // Arquetipos
        sprinter: 94,
        sprinter_level: 5,
        bomberman: 88,
        bomberman_level: 4,
        finishing_archetype: 96,
        finishing_level: 5,
        aerial_play: 88,
        aerial_play_level: 4,
        
        // Roles de delantero
        central_att_finisher: 96,
        central_att_finisher_percent: 80,
        central_att_target: 85,
        central_att_target_percent: 60,
        
        // Dominancia de pie izquierdo
        left_foot_fmi: 92,
        right_foot_fmi: 70,
        left_foot_dominance: 88,
        left_foot_dominance_level: 4,
        
        // Tendencias directas
        direct_att_tendency: 90,
        direct_att_tendency_percent: 75,
        influence_off_tendency: 92,
        influence_off_tendency_percent: 85
      },
      
      // Thibaut Courtois - Portero
      {
        id_player: jugadores[2].id_player,
        id_fmi: 10003,
        total_fmi_pts: 1780,
        total_fmi_pts_norm: 89,
        
        // Atributos de portero
        reflexes_fmi: 94,
        handling_fmi: 92,
        aerial_ability_fmi: 96,
        command_of_area_fmi: 90,
        one_on_ones_fmi: 88,
        kicking_fmi: 85,
        throwing_fmi: 82,
        rushing_out_fmi: 78,
        communication_fmi: 88,
        
        // Físico de portero
        agility_fmi: 85,
        jumping_fmi: 92,
        strength_fmi: 88,
        balance_fmi: 86,
        
        // Mental de portero
        anticipation_fmi: 92,
        bravery_fmi: 94,
        composure_fmi: 90,
        concentration_fmi: 89,
        decisions_fmi: 88,
        
        // Aptitudes posicionales
        goalkeeper_fmi: 94,
        gk_level: 5,
        
        // Roles de portero
        gk_dominator: 90,
        gk_dominator_percent: 70,
        gk_reactive: 88,
        gk_reactive_percent: 60,
        gk_initiator: 75,
        gk_initiator_percent: 30,
        
        // Arquetipos
        the_rock: 92,
        the_rock_level: 5,
        goal_saving: 94,
        goal_saving_level: 5,
        air_flyer: 96,
        air_flyer_level: 5,
        
        // Dominancia de pie izquierdo
        left_foot_fmi: 88,
        right_foot_fmi: 60,
        left_foot_dominance: 85,
        left_foot_dominance_level: 4
      },
      
      // Luka Modric - Mediocentro
      {
        id_player: jugadores[3].id_player,
        id_fmi: 10004,
        total_fmi_pts: 1850,
        total_fmi_pts_norm: 93,
        
        // Habilidades técnicas de mediocentro
        passing_fmi: 96,
        vision_fmi: 95,
        technique_fmi: 94,
        first_touch_fmi: 93,
        long_shots_fmi: 85,
        tackling_fmi: 78,
        
        // Físico adaptado a la edad
        pace_fmi: 70,
        acceleration_fmi: 72,
        stamina_fmi: 88,
        agility_fmi: 85,
        balance_fmi: 92,
        
        // Mental excepcional
        decisions_fmi: 96,
        composure_fmi: 94,
        work_rate_fmi: 92,
        team_work_fmi: 94,
        leadership_fmi: 90,
        intelligence: 97,
        intelligence_level: 5,
        
        // Aptitudes posicionales
        midfielder_central_fmi: 96,
        cm_level: 5,
        defensive_midfielder_fmi: 85,
        dm_level: 4,
        attacking_mid_central_fmi: 88,
        am_level: 4,
        
        // Roles de mediocentro
        deep_mid_distributor: 95,
        deep_mid_distributor_percent: 80,
        deep_mid_box_to_box: 85,
        deep_mid_box_to_box_percent: 60,
        
        // Arquetipos
        game_pace: 96,
        game_pace_level: 5,
        keeping_the_ball: 94,
        keeping_the_ball_level: 5,
        progression: 92,
        progression_level: 5,
        
        // Dominancia de pie derecho
        right_foot_fmi: 94,
        left_foot_fmi: 75,
        right_foot_dominance: 90,
        right_foot_dominance_level: 5,
        
        // Tendencias posicionales
        positional_att_tendency: 90,
        positional_att_tendency_percent: 80,
        influence_off_tendency: 85,
        influence_off_tendency_percent: 70,
        influence_def_tendency: 75,
        influence_def_tendency_percent: 30
      },
      
      // Virgil van Dijk - Defensa central
      {
        id_player: jugadores[4].id_player,
        id_fmi: 10005,
        total_fmi_pts: 1820,
        total_fmi_pts_norm: 91,
        
        // Habilidades técnicas defensivas
        tackling_fmi: 92,
        marking_fmi: 94,
        positioning_fmi: 96,
        heading_fmi: 94,
        passing_fmi: 88,
        technique_fmi: 85,
        
        // Físico de central
        strength_fmi: 92,
        jumping_fmi: 94,
        pace_fmi: 82,
        acceleration_fmi: 80,
        balance_fmi: 88,
        
        // Mental defensivo
        anticipation_fmi: 95,
        bravery_fmi: 94,
        composure_fmi: 92,
        concentration_fmi: 94,
        decisions_fmi: 90,
        leadership_fmi: 92,
        
        // Aptitudes posicionales
        defender_central_fmi: 96,
        cb_level: 5,
        defensive_midfielder_fmi: 82,
        dm_level: 4,
        
        // Roles de defensa central
        central_def_anchor: 94,
        central_def_anchor_percent: 75,
        central_def_spreader: 85,
        central_def_spreader_percent: 60,
        
        // Arquetipos
        the_rock: 96,
        the_rock_level: 5,
        air_flyer: 94,
        air_flyer_level: 5,
        defensive_shape: 95,
        defensive_shape_level: 5,
        ball_recovery: 88,
        ball_recovery_level: 4,
        
        // Dominancia de pie derecho
        right_foot_fmi: 88,
        left_foot_fmi: 70,
        right_foot_dominance: 85,
        right_foot_dominance_level: 4,
        
        // Tendencias defensivas
        high_block_def_tendency: 85,
        high_block_def_tendency_percent: 70,
        influence_def_tendency: 92,
        influence_def_tendency_percent: 80
      }
    ];

    // Insertar atributos para cada jugador
    for (let i = 0; i < Math.min(jugadores.length, atributosPorJugador.length); i++) {
      const jugador = jugadores[i];
      const atributos = atributosPorJugador[i];
      
      console.log(`📊 Insertando atributos para ${jugador.player_name} (${jugador.position_player})`);
      
      await prisma.atributos.upsert({
        where: { id_player: jugador.id_player },
        update: atributos,
        create: {
          ...atributos,
          id_player: jugador.id_player
        }
      });
    }

    // Insertar datos adicionales para completar ejemplos
    const atributosAdicionales = [
      // Ejemplo de extremo izquierdo
      {
        id_player: 'sample_lw_001',
        id_fmi: 10006,
        total_fmi_pts: 1650,
        total_fmi_pts_norm: 83,
        
        // Habilidades de extremo
        dribbling_fmi: 88,
        crossing_fmi: 85,
        pace_fmi: 90,
        acceleration_fmi: 89,
        technique_fmi: 82,
        
        // Roles de extremo
        wide_att_outlet: 85,
        wide_att_outlet_percent: 70,
        wide_att_unlocker: 88,
        wide_att_unlocker_percent: 75,
        
        // Arquetipos
        sprinter: 90,
        sprinter_level: 5,
        creativity: 85,
        creativity_level: 4,
        
        // Aptitudes posicionales
        attacking_mid_left_fmi: 88,
        lw_level: 4,
        midfielder_left_fmi: 75,
        lm_level: 3
      },
      
      // Ejemplo de lateral derecho
      {
        id_player: 'sample_rb_001',
        id_fmi: 10007,
        total_fmi_pts: 1580,
        total_fmi_pts_norm: 79,
        
        // Habilidades de lateral
        tackling_fmi: 85,
        crossing_fmi: 80,
        positioning_fmi: 88,
        stamina_fmi: 90,
        pace_fmi: 85,
        
        // Roles de lateral
        wide_def_overlapper: 88,
        wide_def_overlapper_percent: 75,
        wide_def_progressor: 82,
        wide_def_progressor_percent: 60,
        
        // Arquetipos
        marathonian: 90,
        marathonian_level: 5,
        progression: 85,
        progression_level: 4,
        
        // Aptitudes posicionales
        defender_right_fmi: 88,
        rb_level: 4,
        wing_back_right_fmi: 85,
        rwb_level: 4
      }
    ];

    // Crear jugadores adicionales si es necesario
    for (const attr of atributosAdicionales) {
      try {
        await prisma.atributos.create({
          data: attr
        });
        console.log(`✅ Atributos insertados para jugador ${attr.id_player}`);
      } catch (error) {
        console.log(`⚠️  Saltando jugador ${attr.id_player} (puede que no exista)`);
      }
    }

    console.log('🎉 Seed de atributos completado exitosamente!');
    
    // Mostrar estadísticas
    const totalAtributos = await prisma.atributos.count();
    console.log(`📈 Total de registros de atributos: ${totalAtributos}`);
    
    // Mostrar algunos ejemplos
    const ejemplos = await prisma.atributos.findMany({
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
    ejemplos.forEach(attr => {
      console.log(`- ${attr.player.player_name} (${attr.player.position_player}): ${attr.total_fmi_pts} pts FMI`);
    });

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
if (require.main === module) {
  seedAtributos()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedAtributos;