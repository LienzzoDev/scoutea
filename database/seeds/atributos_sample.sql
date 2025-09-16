-- Datos de ejemplo para la tabla atributos
-- Estos son datos ficticios para testing y desarrollo

-- Ejemplo 1: Delantero centro de élite
INSERT INTO atributos (
  id_player,
  id_fmi,
  total_fmi_pts,
  total_fmi_pts_norm,
  
  -- Habilidades técnicas
  finishing_fmi,
  heading_fmi,
  long_shots_fmi,
  technique_fmi,
  first_touch_fmi,
  off_the_ball_fmi,
  
  -- Atributos físicos
  acceleration_fmi,
  pace_fmi,
  strength_fmi,
  jumping_fmi,
  
  -- Atributos mentales
  composure_fmi,
  determination_fmi,
  anticipation_fmi,
  
  -- Aptitudes posicionales
  striker_fmi,
  st_level,
  attacking_mid_central_fmi,
  am_level,
  
  -- Arquetipos físico-técnicos
  sprinter,
  sprinter_level,
  bomberman,
  bomberman_level,
  finishing_archetype,
  finishing_level,
  
  -- Roles de delantero
  central_att_finisher,
  central_att_finisher_percent,
  central_att_target,
  central_att_target_percent,
  
  -- Dominancia de pie
  right_foot_fmi,
  left_foot_fmi,
  right_foot_dominance,
  right_foot_dominance_level,
  
  -- Tendencias tácticas
  positional_att_tendency,
  positional_att_tendency_percent,
  direct_att_tendency,
  direct_att_tendency_percent
) VALUES (
  'sample_player_1', -- Reemplazar con ID real de jugador
  12345,
  1850,
  92,
  
  -- Habilidades técnicas (delantero élite)
  88, -- finishing_fmi
  82, -- heading_fmi
  75, -- long_shots_fmi
  85, -- technique_fmi
  87, -- first_touch_fmi
  90, -- off_the_ball_fmi
  
  -- Atributos físicos
  85, -- acceleration_fmi
  88, -- pace_fmi
  78, -- strength_fmi
  80, -- jumping_fmi
  
  -- Atributos mentales
  89, -- composure_fmi
  92, -- determination_fmi
  88, -- anticipation_fmi
  
  -- Aptitudes posicionales
  95, -- striker_fmi
  5,  -- st_level
  78, -- attacking_mid_central_fmi
  4,  -- am_level
  
  -- Arquetipos físico-técnicos
  85, -- sprinter
  4,  -- sprinter_level
  75, -- bomberman
  4,  -- bomberman_level
  92, -- finishing_archetype
  5,  -- finishing_level
  
  -- Roles de delantero
  88, -- central_att_finisher
  75, -- central_att_finisher_percent
  65, -- central_att_target
  25, -- central_att_target_percent
  
  -- Dominancia de pie
  92, -- right_foot_fmi
  45, -- left_foot_fmi
  88, -- right_foot_dominance
  5,  -- right_foot_dominance_level
  
  -- Tendencias tácticas
  70, -- positional_att_tendency
  60, -- positional_att_tendency_percent
  75, -- direct_att_tendency
  40  -- direct_att_tendency_percent
);

-- Ejemplo 2: Portero de élite
INSERT INTO atributos (
  id_player,
  id_fmi,
  total_fmi_pts,
  total_fmi_pts_norm,
  
  -- Atributos de portero
  aerial_ability_fmi,
  command_of_area_fmi,
  communication_fmi,
  handling_fmi,
  kicking_fmi,
  one_on_ones_fmi,
  reflexes_fmi,
  rushing_out_fmi,
  throwing_fmi,
  
  -- Atributos físicos
  agility_fmi,
  balance_fmi,
  jumping_fmi,
  
  -- Atributos mentales
  anticipation_fmi,
  bravery_fmi,
  composure_fmi,
  concentration_fmi,
  decisions_fmi,
  
  -- Aptitudes posicionales
  goalkeeper_fmi,
  gk_level,
  
  -- Roles de portero
  gk_dominator,
  gk_dominator_percent,
  gk_reactive,
  gk_reactive_percent,
  gk_initiator,
  gk_initiator_percent,
  
  -- Arquetipos
  the_rock,
  the_rock_level,
  goal_saving,
  goal_saving_level,
  
  -- Dominancia de pie
  right_foot_fmi,
  left_foot_fmi,
  right_foot_dominance,
  right_foot_dominance_level
) VALUES (
  'sample_player_2', -- Reemplazar con ID real de jugador
  12346,
  1780,
  89,
  
  -- Atributos de portero
  90, -- aerial_ability_fmi
  88, -- command_of_area_fmi
  85, -- communication_fmi
  92, -- handling_fmi
  78, -- kicking_fmi
  89, -- one_on_ones_fmi
  94, -- reflexes_fmi
  82, -- rushing_out_fmi
  80, -- throwing_fmi
  
  -- Atributos físicos
  88, -- agility_fmi
  85, -- balance_fmi
  87, -- jumping_fmi
  
  -- Atributos mentales
  90, -- anticipation_fmi
  92, -- bravery_fmi
  89, -- composure_fmi
  88, -- concentration_fmi
  87, -- decisions_fmi
  
  -- Aptitudes posicionales
  95, -- goalkeeper_fmi
  5,  -- gk_level
  
  -- Roles de portero
  85, -- gk_dominator
  60, -- gk_dominator_percent
  92, -- gk_reactive
  70, -- gk_reactive_percent
  65, -- gk_initiator
  30, -- gk_initiator_percent
  
  -- Arquetipos
  88, -- the_rock
  5,  -- the_rock_level
  94, -- goal_saving
  5,  -- goal_saving_level
  
  -- Dominancia de pie
  85, -- right_foot_fmi
  60, -- left_foot_fmi
  82, -- right_foot_dominance
  4   -- right_foot_dominance_level
);

-- Ejemplo 3: Mediocentro box-to-box
INSERT INTO atributos (
  id_player,
  id_fmi,
  total_fmi_pts,
  total_fmi_pts_norm,
  
  -- Habilidades técnicas
  passing_fmi,
  tackling_fmi,
  technique_fmi,
  vision_fmi,
  long_shots_fmi,
  
  -- Atributos físicos
  stamina_fmi,
  pace_fmi,
  strength_fmi,
  natural_fitness_fmi,
  
  -- Atributos mentales
  work_rate_fmi,
  team_work_fmi,
  decisions_fmi,
  leadership_fmi,
  
  -- Aptitudes posicionales
  midfielder_central_fmi,
  cm_level,
  defensive_midfielder_fmi,
  dm_level,
  
  -- Roles de mediocentro
  deep_mid_box_to_box,
  deep_mid_box_to_box_percent,
  deep_mid_distributor,
  deep_mid_distributor_percent,
  
  -- Arquetipos
  marathonian,
  marathonian_level,
  three_sixty,
  three_sixty_level,
  intelligence,
  intelligence_level,
  
  -- Tendencias
  influence_off_tendency,
  influence_off_tendency_percent,
  influence_def_tendency,
  influence_def_tendency_percent
) VALUES (
  'sample_player_3', -- Reemplazar con ID real de jugador
  12347,
  1720,
  86,
  
  -- Habilidades técnicas
  88, -- passing_fmi
  85, -- tackling_fmi
  82, -- technique_fmi
  87, -- vision_fmi
  75, -- long_shots_fmi
  
  -- Atributos físicos
  92, -- stamina_fmi
  78, -- pace_fmi
  80, -- strength_fmi
  90, -- natural_fitness_fmi
  
  -- Atributos mentales
  94, -- work_rate_fmi
  90, -- team_work_fmi
  85, -- decisions_fmi
  82, -- leadership_fmi
  
  -- Aptitudes posicionales
  90, -- midfielder_central_fmi
  5,  -- cm_level
  85, -- defensive_midfielder_fmi
  4,  -- dm_level
  
  -- Roles de mediocentro
  92, -- deep_mid_box_to_box
  80, -- deep_mid_box_to_box_percent
  75, -- deep_mid_distributor
  20, -- deep_mid_distributor_percent
  
  -- Arquetipos
  88, -- marathonian
  5,  -- marathonian_level
  85, -- three_sixty
  4,  -- three_sixty_level
  87, -- intelligence
  4,  -- intelligence_level
  
  -- Tendencias
  75, -- influence_off_tendency
  55, -- influence_off_tendency_percent
  80, -- influence_def_tendency
  45  -- influence_def_tendency_percent
);

-- Comentarios sobre los datos de ejemplo
COMMENT ON TABLE atributos IS 'Tabla de atributos FMI detallados para análisis avanzado de jugadores. Contiene datos de ejemplo para testing.';