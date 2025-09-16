const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAtributosOnly() {
  console.log('🚀 Iniciando seed completo basado solo en atributos...\n');

  try {
    // 1. Limpiar datos existentes
    console.log('🧹 Limpiando datos existentes...');
    await prisma.lollipopData.deleteMany({});
    await prisma.beeswarmData.deleteMany({});
    await prisma.radarMetrics.deleteMany({});
    await prisma.atributos.deleteMany({});
    await prisma.jugador.deleteMany({
      where: {
        player_name: {
          in: ['Lionel Messi', 'Erling Haaland', 'Thibaut Courtois', 'Luka Modric', 'Virgil van Dijk', 'Kylian Mbappé', 'Kevin De Bruyne', 'Pedri González']
        }
      }
    });

    // 2. Crear jugadores de ejemplo con más variedad
    console.log('👥 Creando jugadores de ejemplo...');
    const jugadores = await Promise.all([
      // Extremo derecho - Lionel Messi
      prisma.jugador.create({
        data: {
          player_name: 'Lionel Messi',
          complete_player_name: 'Lionel Andrés Messi Cuccittini',
          position_player: 'RW',
          correct_position_player: 'Right Winger',
          age: 36,
          nationality_1: 'Argentina',
          team_name: 'Inter Miami',
          team_country: 'USA',
          player_rating: 95.5,
          player_elo: 2800,
          height: 170,
          foot: 'Left',
          date_of_birth: new Date('1987-06-24')
        }
      }),
      // Delantero centro - Erling Haaland
      prisma.jugador.create({
        data: {
          player_name: 'Erling Haaland',
          complete_player_name: 'Erling Braut Haaland',
          position_player: 'ST',
          correct_position_player: 'Striker',
          age: 23,
          nationality_1: 'Norway',
          team_name: 'Manchester City',
          team_country: 'England',
          player_rating: 92.8,
          player_elo: 2650,
          height: 194,
          foot: 'Left',
          date_of_birth: new Date('2000-07-21')
        }
      }),
      // Portero - Thibaut Courtois
      prisma.jugador.create({
        data: {
          player_name: 'Thibaut Courtois',
          complete_player_name: 'Thibaut Nicolas Marc Courtois',
          position_player: 'GK',
          correct_position_player: 'Goalkeeper',
          age: 31,
          nationality_1: 'Belgium',
          team_name: 'Real Madrid',
          team_country: 'Spain',
          player_rating: 89.2,
          player_elo: 2450,
          height: 199,
          foot: 'Left',
          date_of_birth: new Date('1992-05-11')
        }
      }),
      // Mediocentro - Luka Modric
      prisma.jugador.create({
        data: {
          player_name: 'Luka Modric',
          complete_player_name: 'Luka Modrić',
          position_player: 'CM',
          correct_position_player: 'Central Midfielder',
          age: 38,
          nationality_1: 'Croatia',
          team_name: 'Real Madrid',
          team_country: 'Spain',
          player_rating: 88.5,
          player_elo: 2420,
          height: 172,
          foot: 'Right',
          date_of_birth: new Date('1985-09-09')
        }
      }),
      // Defensa central - Virgil van Dijk
      prisma.jugador.create({
        data: {
          player_name: 'Virgil van Dijk',
          complete_player_name: 'Virgil van Dijk',
          position_player: 'CB',
          correct_position_player: 'Centre-Back',
          age: 32,
          nationality_1: 'Netherlands',
          team_name: 'Liverpool',
          team_country: 'England',
          player_rating: 90.1,
          player_elo: 2520,
          height: 193,
          foot: 'Right',
          date_of_birth: new Date('1991-07-08')
        }
      }),
      // Extremo izquierdo - Kylian Mbappé
      prisma.jugador.create({
        data: {
          player_name: 'Kylian Mbappé',
          complete_player_name: 'Kylian Mbappé Lottin',
          position_player: 'LW',
          correct_position_player: 'Left Winger',
          age: 25,
          nationality_1: 'France',
          team_name: 'Real Madrid',
          team_country: 'Spain',
          player_rating: 94.2,
          player_elo: 2720,
          height: 178,
          foot: 'Right',
          date_of_birth: new Date('1998-12-20')
        }
      }),
      // Mediapunta - Kevin De Bruyne
      prisma.jugador.create({
        data: {
          player_name: 'Kevin De Bruyne',
          complete_player_name: 'Kevin De Bruyne',
          position_player: 'AM',
          correct_position_player: 'Attacking Midfielder',
          age: 32,
          nationality_1: 'Belgium',
          team_name: 'Manchester City',
          team_country: 'England',
          player_rating: 91.3,
          player_elo: 2580,
          height: 181,
          foot: 'Right',
          date_of_birth: new Date('1991-06-28')
        }
      }),
      // Mediocentro joven - Pedri González
      prisma.jugador.create({
        data: {
          player_name: 'Pedri González',
          complete_player_name: 'Pedro González López',
          position_player: 'CM',
          correct_position_player: 'Central Midfielder',
          age: 21,
          nationality_1: 'Spain',
          team_name: 'FC Barcelona',
          team_country: 'Spain',
          player_rating: 86.7,
          player_elo: 2350,
          height: 174,
          foot: 'Right',
          date_of_birth: new Date('2002-11-25')
        }
      })
    ]);

    console.log(`✅ Creados ${jugadores.length} jugadores`);

    // 3. Insertar atributos FMI completos para cada jugador
    console.log('📊 Insertando atributos FMI completos...');
    
    const atributosData = [
      // Lionel Messi - RW
      createAtributosMessi(jugadores[0].id_player),
      // Erling Haaland - ST
      createAtributosHaaland(jugadores[1].id_player),
      // Thibaut Courtois - GK
      createAtributosCourtois(jugadores[2].id_player),
      // Luka Modric - CM
      createAtributosModric(jugadores[3].id_player),
      // Virgil van Dijk - CB
      createAtributosVanDijk(jugadores[4].id_player),
      // Kylian Mbappé - LW
      createAtributosMbappe(jugadores[5].id_player),
      // Kevin De Bruyne - AM
      createAtributosDeBruyne(jugadores[6].id_player),
      // Pedri González - CM
      createAtributosPedri(jugadores[7].id_player)
    ];

    for (const attr of atributosData) {
      await prisma.atributos.create({ data: attr });
    }

    console.log(`✅ Insertados ${atributosData.length} registros de atributos`);

    // 4. Generar datos de visualización basados en atributos
    console.log('📈 Generando datos de visualización desde atributos...');
    
    for (const jugador of jugadores) {
      const atributos = await prisma.atributos.findUnique({
        where: { id_player: jugador.id_player }
      });

      if (!atributos) continue;

      // RadarMetrics basado en atributos
      const radarCategories = generateRadarFromAtributos(atributos);
      for (const radar of radarCategories) {
        await prisma.radarMetrics.create({
          data: {
            playerId: jugador.id_player,
            position: jugador.position_player,
            category: radar.category,
            playerValue: radar.playerValue,
            positionAverage: radar.positionAverage,
            percentile: radar.percentile,
            period: '2023-24'
          }
        });
      }

      // BeeswarmData basado en atributos
      const beeswarmMetrics = generateBeeswarmFromAtributos(atributos, jugador);
      for (const bee of beeswarmMetrics) {
        await prisma.beeswarmData.create({
          data: {
            metric: bee.metric,
            playerId: jugador.id_player,
            playerName: jugador.player_name,
            value: bee.value,
            position: jugador.position_player,
            age: jugador.age,
            nationality: jugador.nationality_1,
            competition: getCompetitionFromTeam(jugador.team_name),
            trfmValue: jugador.player_rating * 1000000,
            isSelected: false,
            period: '2023-24'
          }
        });
      }

      // LollipopData basado en atributos
      const lollipopMetrics = generateLollipopFromAtributos(atributos, jugador);
      for (const lol of lollipopMetrics) {
        await prisma.lollipopData.create({
          data: {
            playerId: jugador.id_player,
            metricName: lol.metricName,
            value: lol.value,
            rank: lol.rank,
            totalPlayers: 500,
            percentile: lol.percentile,
            category: lol.category,
            period: '2023-24',
            position: jugador.position_player
          }
        });
      }
    }

    console.log('✅ Datos de visualización generados');

    // 5. Mostrar resumen final
    const stats = await Promise.all([
      prisma.jugador.count(),
      prisma.atributos.count(),
      prisma.radarMetrics.count(),
      prisma.beeswarmData.count(),
      prisma.lollipopData.count()
    ]);

    console.log('\n🎉 SEED COMPLETO FINALIZADO!');
    console.log('============================');
    console.log(`👥 Jugadores: ${stats[0]}`);
    console.log(`📊 Atributos: ${stats[1]}`);
    console.log(`🎯 RadarMetrics: ${stats[2]}`);
    console.log(`🐝 BeeswarmData: ${stats[3]}`);
    console.log(`🍭 LollipopData: ${stats[4]}`);
    console.log('\n✅ Todos los datos basados en atributos han sido insertados correctamente!');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Funciones para crear atributos específicos por jugador
function createAtributosMessi(playerId) {
  return {
    id_player: playerId,
    id_fmi: 10001,
    total_fmi_pts: 1950,
    total_fmi_pts_norm: 98,
    
    // Técnicas excepcionales
    dribbling_fmi: 99,
    technique_fmi: 98,
    vision_fmi: 97,
    passing_fmi: 95,
    finishing_fmi: 94,
    first_touch_fmi: 98,
    free_kick_taking_fmi: 96,
    long_shots_fmi: 92,
    crossing_fmi: 88,
    
    // Físico (limitado por edad)
    acceleration_fmi: 75,
    pace_fmi: 78,
    agility_fmi: 88,
    balance_fmi: 95,
    stamina_fmi: 82,
    strength_fmi: 68,
    jumping_fmi: 70,
    
    // Mental excepcional
    composure_fmi: 99,
    decisions_fmi: 96,
    flair_fmi: 99,
    anticipation_fmi: 94,
    concentration_fmi: 92,
    determination_fmi: 95,
    
    // Posiciones
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
    
    // Roles
    wide_att_unlocker: 98,
    wide_att_unlocker_percent: 85,
    wide_att_threat: 95,
    wide_att_threat_percent: 75,
    
    // Pie dominante
    left_foot_fmi: 99,
    right_foot_fmi: 65,
    left_foot_dominance: 95,
    left_foot_dominance_level: 5
  };
}

function createAtributosHaaland(playerId) {
  return {
    id_player: playerId,
    id_fmi: 10002,
    total_fmi_pts: 1820,
    total_fmi_pts_norm: 91,
    
    // Técnicas de delantero
    finishing_fmi: 96,
    heading_fmi: 88,
    first_touch_fmi: 85,
    off_the_ball_fmi: 94,
    technique_fmi: 82,
    long_shots_fmi: 78,
    
    // Físico excepcional
    pace_fmi: 94,
    acceleration_fmi: 92,
    strength_fmi: 90,
    jumping_fmi: 88,
    stamina_fmi: 85,
    natural_fitness_fmi: 92,
    balance_fmi: 82,
    agility_fmi: 78,
    
    // Mental sólido
    composure_fmi: 88,
    determination_fmi: 92,
    anticipation_fmi: 90,
    aggression_fmi: 85,
    concentration_fmi: 86,
    
    // Posiciones
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
    
    // Roles
    central_att_finisher: 96,
    central_att_finisher_percent: 80,
    central_att_target: 85,
    central_att_target_percent: 60,
    
    // Pie dominante
    left_foot_fmi: 92,
    right_foot_fmi: 70,
    left_foot_dominance: 88,
    left_foot_dominance_level: 4
  };
}

function createAtributosCourtois(playerId) {
  return {
    id_player: playerId,
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
    
    // Posiciones
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
    
    // Pie dominante
    left_foot_fmi: 88,
    right_foot_fmi: 60,
    left_foot_dominance: 85,
    left_foot_dominance_level: 4
  };
}

function createAtributosModric(playerId) {
  return {
    id_player: playerId,
    id_fmi: 10004,
    total_fmi_pts: 1850,
    total_fmi_pts_norm: 93,
    
    // Técnicas de mediocentro
    passing_fmi: 96,
    vision_fmi: 95,
    technique_fmi: 94,
    first_touch_fmi: 93,
    long_shots_fmi: 85,
    tackling_fmi: 78,
    crossing_fmi: 82,
    
    // Físico adaptado a la edad
    pace_fmi: 70,
    acceleration_fmi: 72,
    stamina_fmi: 88,
    agility_fmi: 85,
    balance_fmi: 92,
    strength_fmi: 65,
    
    // Mental excepcional
    decisions_fmi: 96,
    composure_fmi: 94,
    work_rate_fmi: 92,
    team_work_fmi: 94,
    leadership_fmi: 90,
    intelligence: 97,
    intelligence_level: 5,
    
    // Posiciones
    midfielder_central_fmi: 96,
    cm_level: 5,
    defensive_midfielder_fmi: 85,
    dm_level: 4,
    attacking_mid_central_fmi: 88,
    am_level: 4,
    
    // Arquetipos
    game_pace: 96,
    game_pace_level: 5,
    keeping_the_ball: 94,
    keeping_the_ball_level: 5,
    progression: 92,
    progression_level: 5,
    
    // Roles
    deep_mid_distributor: 95,
    deep_mid_distributor_percent: 80,
    deep_mid_box_to_box: 85,
    deep_mid_box_to_box_percent: 60,
    
    // Pie dominante
    right_foot_fmi: 94,
    left_foot_fmi: 75,
    right_foot_dominance: 90,
    right_foot_dominance_level: 5
  };
}

function createAtributosVanDijk(playerId) {
  return {
    id_player: playerId,
    id_fmi: 10005,
    total_fmi_pts: 1820,
    total_fmi_pts_norm: 91,
    
    // Técnicas defensivas
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
    stamina_fmi: 85,
    
    // Mental defensivo
    anticipation_fmi: 95,
    bravery_fmi: 94,
    composure_fmi: 92,
    concentration_fmi: 94,
    decisions_fmi: 90,
    leadership_fmi: 92,
    
    // Posiciones
    defender_central_fmi: 96,
    cb_level: 5,
    defensive_midfielder_fmi: 82,
    dm_level: 4,
    
    // Arquetipos
    the_rock: 96,
    the_rock_level: 5,
    air_flyer: 94,
    air_flyer_level: 5,
    defensive_shape: 95,
    defensive_shape_level: 5,
    ball_recovery: 88,
    ball_recovery_level: 4,
    
    // Roles
    central_def_anchor: 94,
    central_def_anchor_percent: 75,
    central_def_spreader: 85,
    central_def_spreader_percent: 60,
    
    // Pie dominante
    right_foot_fmi: 88,
    left_foot_fmi: 70,
    right_foot_dominance: 85,
    right_foot_dominance_level: 4
  };
}

function createAtributosMbappe(playerId) {
  return {
    id_player: playerId,
    id_fmi: 10006,
    total_fmi_pts: 1880,
    total_fmi_pts_norm: 94,
    
    // Técnicas de extremo
    dribbling_fmi: 92,
    pace_fmi: 99,
    acceleration_fmi: 98,
    finishing_fmi: 90,
    crossing_fmi: 82,
    technique_fmi: 88,
    first_touch_fmi: 90,
    
    // Físico excepcional
    agility_fmi: 95,
    balance_fmi: 88,
    stamina_fmi: 90,
    strength_fmi: 78,
    jumping_fmi: 82,
    
    // Mental
    composure_fmi: 85,
    decisions_fmi: 88,
    anticipation_fmi: 90,
    determination_fmi: 92,
    off_the_ball_fmi: 92,
    
    // Posiciones
    attacking_mid_left_fmi: 95,
    lw_level: 5,
    striker_fmi: 90,
    st_level: 4,
    attacking_mid_central_fmi: 82,
    am_level: 4,
    
    // Arquetipos
    sprinter: 99,
    sprinter_level: 5,
    finishing_archetype: 90,
    finishing_level: 5,
    
    // Roles
    wide_att_threat: 95,
    wide_att_threat_percent: 80,
    wide_att_outlet: 88,
    wide_att_outlet_percent: 70,
    
    // Pie dominante
    right_foot_fmi: 92,
    left_foot_fmi: 78,
    right_foot_dominance: 88,
    right_foot_dominance_level: 4
  };
}

function createAtributosDeBruyne(playerId) {
  return {
    id_player: playerId,
    id_fmi: 10007,
    total_fmi_pts: 1830,
    total_fmi_pts_norm: 92,
    
    // Técnicas de mediapunta
    passing_fmi: 98,
    vision_fmi: 96,
    crossing_fmi: 94,
    long_shots_fmi: 92,
    technique_fmi: 92,
    first_touch_fmi: 90,
    free_kick_taking_fmi: 88,
    
    // Físico
    pace_fmi: 78,
    acceleration_fmi: 80,
    stamina_fmi: 88,
    strength_fmi: 82,
    balance_fmi: 85,
    
    // Mental
    decisions_fmi: 94,
    composure_fmi: 90,
    work_rate_fmi: 90,
    team_work_fmi: 88,
    intelligence: 95,
    intelligence_level: 5,
    
    // Posiciones
    attacking_mid_central_fmi: 96,
    am_level: 5,
    midfielder_central_fmi: 90,
    cm_level: 4,
    attacking_mid_right_fmi: 88,
    rw_level: 4,
    
    // Arquetipos
    creativity: 96,
    creativity_level: 5,
    progression: 94,
    progression_level: 5,
    
    // Roles
    advanced_mid_creator: 96,
    advanced_mid_creator_percent: 85,
    advanced_mid_orchestrator: 90,
    advanced_mid_orchestrator_percent: 70,
    
    // Pie dominante
    right_foot_fmi: 96,
    left_foot_fmi: 82,
    right_foot_dominance: 92,
    right_foot_dominance_level: 5
  };
}

function createAtributosPedri(playerId) {
  return {
    id_player: playerId,
    id_fmi: 10008,
    total_fmi_pts: 1650,
    total_fmi_pts_norm: 83,
    
    // Técnicas de mediocentro joven
    passing_fmi: 88,
    vision_fmi: 85,
    technique_fmi: 90,
    first_touch_fmi: 92,
    dribbling_fmi: 86,
    
    // Físico joven
    pace_fmi: 75,
    acceleration_fmi: 78,
    agility_fmi: 88,
    balance_fmi: 90,
    stamina_fmi: 85,
    
    // Mental prometedor
    decisions_fmi: 82,
    composure_fmi: 88,
    work_rate_fmi: 85,
    team_work_fmi: 90,
    intelligence: 88,
    intelligence_level: 4,
    
    // Posiciones
    midfielder_central_fmi: 88,
    cm_level: 4,
    attacking_mid_central_fmi: 85,
    am_level: 4,
    
    // Arquetipos
    ball_control: 92,
    ball_control_level: 5,
    keeping_the_ball: 90,
    keeping_the_ball_level: 4,
    
    // Roles
    deep_mid_distributor: 85,
    deep_mid_distributor_percent: 70,
    
    // Pie dominante
    right_foot_fmi: 88,
    left_foot_fmi: 75,
    right_foot_dominance: 85,
    right_foot_dominance_level: 4
  };
}

// Funciones para generar datos de visualización desde atributos
function generateRadarFromAtributos(atributos) {
  const categories = [];
  
  // Off Transition (Transición ofensiva)
  const offTransition = calculateAverage([
    atributos.pace_fmi,
    atributos.acceleration_fmi,
    atributos.dribbling_fmi,
    atributos.off_the_ball_fmi,
    atributos.decisions_fmi
  ]);
  categories.push({
    category: 'Off Transition',
    playerValue: offTransition,
    positionAverage: offTransition * 0.75,
    percentile: (offTransition / 100) * 100
  });
  
  // Maintenance (Mantenimiento/Posesión)
  const maintenance = calculateAverage([
    atributos.passing_fmi,
    atributos.technique_fmi,
    atributos.composure_fmi,
    atributos.first_touch_fmi,
    atributos.vision_fmi
  ]);
  categories.push({
    category: 'Maintenance',
    playerValue: maintenance,
    positionAverage: maintenance * 0.8,
    percentile: (maintenance / 100) * 100
  });
  
  // Progression (Progresión)
  const progression = calculateAverage([
    atributos.passing_fmi,
    atributos.vision_fmi,
    atributos.dribbling_fmi,
    atributos.crossing_fmi,
    atributos.long_shots_fmi
  ]);
  categories.push({
    category: 'Progression',
    playerValue: progression,
    positionAverage: progression * 0.75,
    percentile: (progression / 100) * 100
  });
  
  // Finishing (Finalización)
  const finishing = calculateAverage([
    atributos.finishing_fmi,
    atributos.composure_fmi,
    atributos.technique_fmi,
    atributos.long_shots_fmi,
    atributos.heading_fmi
  ]);
  categories.push({
    category: 'Finishing',
    playerValue: finishing,
    positionAverage: finishing * 0.7,
    percentile: (finishing / 100) * 100
  });
  
  // Off Stopped Ball (Balón parado ofensivo)
  const offStoppedBall = calculateAverage([
    atributos.free_kick_taking_fmi,
    atributos.corners_fmi,
    atributos.penalty_taking_fmi,
    atributos.crossing_fmi,
    atributos.technique_fmi
  ]);
  categories.push({
    category: 'Off Stopped Ball',
    playerValue: offStoppedBall,
    positionAverage: offStoppedBall * 0.8,
    percentile: (offStoppedBall / 100) * 100
  });
  
  // Def Transition (Transición defensiva)
  const defTransition = calculateAverage([
    atributos.tackling_fmi,
    atributos.anticipation_fmi,
    atributos.positioning_fmi,
    atributos.pace_fmi,
    atributos.work_rate_fmi
  ]);
  categories.push({
    category: 'Def Transition',
    playerValue: defTransition,
    positionAverage: defTransition * 0.8,
    percentile: (defTransition / 100) * 100
  });
  
  // Recovery (Recuperación)
  const recovery = calculateAverage([
    atributos.tackling_fmi,
    atributos.anticipation_fmi,
    atributos.work_rate_fmi,
    atributos.stamina_fmi,
    atributos.aggression_fmi
  ]);
  categories.push({
    category: 'Recovery',
    playerValue: recovery,
    positionAverage: recovery * 0.85,
    percentile: (recovery / 100) * 100
  });
  
  // Evitation (Evitación/Salida de presión)
  const evitation = calculateAverage([
    atributos.dribbling_fmi,
    atributos.composure_fmi,
    atributos.balance_fmi,
    atributos.agility_fmi,
    atributos.first_touch_fmi
  ]);
  categories.push({
    category: 'Evitation',
    playerValue: evitation,
    positionAverage: evitation * 0.75,
    percentile: (evitation / 100) * 100
  });
  
  // Def Stopped Ball (Balón parado defensivo)
  const defStoppedBall = calculateAverage([
    atributos.heading_fmi,
    atributos.jumping_fmi,
    atributos.marking_fmi,
    atributos.positioning_fmi,
    atributos.strength_fmi
  ]);
  categories.push({
    category: 'Def Stopped Ball',
    playerValue: defStoppedBall,
    positionAverage: defStoppedBall * 0.8,
    percentile: (defStoppedBall / 100) * 100
  });
  
  return categories;
}

function generateBeeswarmFromAtributos(atributos, jugador) {
  const metrics = [];
  
  // Goals (basado en finishing)
  const goals = (atributos.finishing_fmi || 50) * 0.3;
  metrics.push({ metric: 'Goals', value: Math.round(goals * 10) / 10 });
  
  // Assists (basado en vision y passing)
  const assists = calculateAverage([atributos.vision_fmi, atributos.passing_fmi]) * 0.2;
  metrics.push({ metric: 'Assists', value: Math.round(assists * 10) / 10 });
  
  // Passes (basado en passing)
  const passes = (atributos.passing_fmi || 50) * 20;
  metrics.push({ metric: 'Passes', value: Math.round(passes) });
  
  // Tackles (basado en tackling)
  const tackles = (atributos.tackling_fmi || 30) * 1.5;
  metrics.push({ metric: 'Tackles', value: Math.round(tackles * 10) / 10 });
  
  // Dribbles (basado en dribbling)
  const dribbles = (atributos.dribbling_fmi || 40) * 2;
  metrics.push({ metric: 'Dribbles', value: Math.round(dribbles * 10) / 10 });
  
  // xG (basado en finishing y off_the_ball)
  const xg = calculateAverage([atributos.finishing_fmi, atributos.off_the_ball_fmi]) * 0.25;
  metrics.push({ metric: 'xG', value: Math.round(xg * 10) / 10 });
  
  return metrics;
}

function generateLollipopFromAtributos(atributos, jugador) {
  const metrics = [];
  const categories = ['Attacking', 'Defending', 'Passing', 'Physical'];
  
  categories.forEach(category => {
    let categoryMetrics = [];
    
    switch (category) {
      case 'Attacking':
        categoryMetrics = [
          { name: 'Goals', value: (atributos.finishing_fmi || 50) * 0.3 },
          { name: 'Assists', value: calculateAverage([atributos.vision_fmi, atributos.passing_fmi]) * 0.2 },
          { name: 'Shots', value: (atributos.long_shots_fmi || 50) * 1.5 },
          { name: 'xG', value: calculateAverage([atributos.finishing_fmi, atributos.off_the_ball_fmi]) * 0.25 },
          { name: 'Key Passes', value: (atributos.vision_fmi || 50) * 0.8 }
        ];
        break;
      case 'Defending':
        categoryMetrics = [
          { name: 'Tackles', value: (atributos.tackling_fmi || 30) * 1.5 },
          { name: 'Interceptions', value: (atributos.anticipation_fmi || 40) * 1.2 },
          { name: 'Clearances', value: (atributos.heading_fmi || 30) * 2 },
          { name: 'Blocks', value: (atributos.positioning_fmi || 40) * 0.8 },
          { name: 'Duels Won', value: calculateAverage([atributos.strength_fmi, atributos.aggression_fmi]) * 1.8 }
        ];
        break;
      case 'Passing':
        categoryMetrics = [
          { name: 'Passes', value: (atributos.passing_fmi || 50) * 20 },
          { name: 'Pass Accuracy', value: Math.min(95, (atributos.technique_fmi || 70) * 0.9 + 15) },
          { name: 'Long Passes', value: (atributos.passing_fmi || 50) * 1.5 },
          { name: 'Through Balls', value: (atributos.vision_fmi || 50) * 0.3 },
          { name: 'Crosses', value: (atributos.crossing_fmi || 40) * 1.2 }
        ];
        break;
      case 'Physical':
        categoryMetrics = [
          { name: 'Distance Covered', value: (atributos.stamina_fmi || 70) * 0.12 + 8 },
          { name: 'Sprints', value: (atributos.pace_fmi || 60) * 0.8 },
          { name: 'Aerial Duels', value: (atributos.jumping_fmi || 50) * 1.5 },
          { name: 'Top Speed', value: (atributos.pace_fmi || 60) * 0.3 + 25 },
          { name: 'Stamina', value: Math.min(95, (atributos.stamina_fmi || 70) * 0.9 + 15) }
        ];
        break;
    }
    
    categoryMetrics.forEach(metric => {
      const value = Math.round(metric.value * 10) / 10;
      const rank = Math.floor(Math.random() * 100) + 1;
      const percentile = ((500 - rank) / 500) * 100;
      
      metrics.push({
        metricName: metric.name,
        value: value,
        rank: rank,
        percentile: Math.round(percentile * 10) / 10,
        category: category
      });
    });
  });
  
  return metrics;
}

// Funciones auxiliares
function calculateAverage(values) {
  const validValues = values.filter(v => v != null && v > 0);
  if (validValues.length === 0) return 50;
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
}

function getCompetitionFromTeam(teamName) {
  const competitions = {
    'Real Madrid': 'La Liga',
    'FC Barcelona': 'La Liga',
    'Manchester City': 'Premier League',
    'Liverpool': 'Premier League',
    'Inter Miami': 'MLS'
  };
  return competitions[teamName] || 'Premier League';
}

// Ejecutar el seed
seedAtributosOnly()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });