// Tipos para la tabla Atributos - Características detalladas FMI de jugadores

export interface Atributos {
  // Identificadores y totales
  id_player: number;
  id_fmi?: number;
  total_fmi_pts?: number;
  total_fmi_pts_norm?: number;
  
  // Habilidades técnicas (jugador de campo)
  corners_fmi?: number;
  crossing_fmi?: number;
  dribbling_fmi?: number;
  finishing_fmi?: number;
  first_touch_fmi?: number;
  free_kick_taking_fmi?: number;
  heading_fmi?: number;
  long_shots_fmi?: number;
  passing_fmi?: number;
  penalty_taking_fmi?: number;
  tackling_fmi?: number;
  technique_fmi?: number;
  marking_fmi?: number;
  off_the_ball_fmi?: number;
  positioning_fmi?: number;
  long_throws_fmi?: number;
  
  // Atributos físicos
  acceleration_fmi?: number;
  agility_fmi?: number;
  balance_fmi?: number;
  jumping_fmi?: number;
  natural_fitness_fmi?: number;
  pace_fmi?: number;
  stamina_fmi?: number;
  strength_fmi?: number;
  
  // Atributos mentales
  aggression_fmi?: number;
  anticipation_fmi?: number;
  bravery_fmi?: number;
  composure_fmi?: number;
  concentration_fmi?: number;
  decisions_fmi?: number;
  determination_fmi?: number;
  flair_fmi?: number;
  leadership_fmi?: number;
  team_work_fmi?: number;
  vision_fmi?: number;
  work_rate_fmi?: number;
  
  // Portero (GK)
  aerial_ability_fmi?: number;
  command_of_area_fmi?: number;
  communication_fmi?: number;
  eccentricity_fmi?: number;
  handling_fmi?: number;
  kicking_fmi?: number;
  one_on_ones_fmi?: number;
  tendency_to_punch_fmi?: number;
  reflexes_fmi?: number;
  rushing_out_fmi?: number;
  throwing_fmi?: number;
  
  // Dominancia de pie
  left_foot_fmi?: number;
  right_foot_fmi?: number;
  
  // Consistencia, personalidad y disponibilidad
  consistency_fmi?: number;
  dirtiness_fmi?: number;
  important_matches_fmi?: number;
  injury_proness_fmi?: number;
  versality_fmi?: number;
  adaptability_fmi?: number;
  ambition_fmi?: number;
  loyalty_fmi?: number;
  pressure_fmi?: number;
  professional_fmi?: number;
  sportsmanship_fmi?: number;
  temperament_fmi?: number;
  controversy_fmi?: number;
  
  // Aptitud por posición (rating + nivel)
  goalkeeper_fmi?: number;
  gk_level?: number;
  defender_right_fmi?: number;
  rb_level?: number;
  defender_central_fmi?: number;
  cb_level?: number;
  defender_left_fmi?: number;
  lb_level?: number;
  wing_back_right_fmi?: number;
  rwb_level?: number;
  defensive_midfielder_fmi?: number;
  dm_level?: number;
  wing_back_left_fmi?: number;
  lwb_level?: number;
  midfielder_right_fmi?: number;
  rm_level?: number;
  midfielder_central_fmi?: number;
  cm_level?: number;
  midfielder_left_fmi?: number;
  lm_level?: number;
  attacking_mid_right_fmi?: number;
  rw_level?: number;
  attacking_mid_central_fmi?: number;
  am_level?: number;
  attacking_mid_left_fmi?: number;
  lw_level?: number;
  striker_fmi?: number;
  st_level?: number;
  
  // Roles/estilos de Portero (con % de pertenencia)
  gk_dominator?: number;
  gk_dominator_percent?: number;
  gk_reactive?: number;
  gk_reactive_percent?: number;
  gk_initiator?: number;
  gk_initiator_percent?: number;
  
  // Roles/estilos de Defensa Central (con %)
  central_def_aggressor?: number;
  central_def_aggressor_percent?: number;
  central_def_spreader?: number;
  central_def_spreader_percent?: number;
  central_def_anchor?: number;
  central_def_anchor_percent?: number;
  
  // Roles/estilos de Defensa/Laterales (con %)
  wide_def_overlapper?: number;
  wide_def_overlapper_percent?: number;
  wide_def_progressor?: number;
  wide_def_progressor_percent?: number;
  wide_def_safety?: number;
  wide_def_safety_percent?: number;
  
  // Mediocentro (con %)
  deep_mid_box_to_box?: number;
  deep_mid_box_to_box_percent?: number;
  deep_mid_distributor?: number;
  deep_mid_distributor_percent?: number;
  deep_mid_builder?: number;
  deep_mid_builder_percent?: number;
  
  // Mediapunta/Interior avanzado (con %)
  advanced_mid_box_crasher?: number;
  advanced_mid_box_crasher_percent?: number;
  advanced_mid_creator?: number;
  advanced_mid_creator_percent?: number;
  advanced_mid_orchestrator?: number;
  advanced_mid_orchestrator_percent?: number;
  
  // Extremos/ataque por banda (con %)
  wide_att_outlet?: number;
  wide_att_outlet_percent?: number;
  wide_att_unlocker?: number;
  wide_att_unlocker_percent?: number;
  wide_att_threat?: number;
  wide_att_threat_percent?: number;
  
  // Delantero centro (con %)
  central_att_roamer?: number;
  central_att_roamer_percent?: number;
  central_att_target?: number;
  central_att_target_percent?: number;
  central_att_finisher?: number;
  central_att_finisher_percent?: number;
  
  // Arquetipos físico-técnicos (índice + nivel)
  sprinter?: number;
  sprinter_level?: number;
  marathonian?: number;
  marathonian_level?: number;
  bomberman?: number;
  bomberman_level?: number;
  three_sixty?: number;        // 360º renombrado para Prisma
  three_sixty_level?: number;  // 360º_level renombrado
  the_rock?: number;
  the_rock_level?: number;
  air_flyer?: number;
  air_flyer_level?: number;
  one_vs_one_off?: number;     // 1vs1_off renombrado
  one_vs_one_off_level?: number; // 1vs1_off_level renombrado
  intelligence?: number;
  intelligence_level?: number;
  game_pace?: number;
  game_pace_level?: number;
  striking?: number;
  striking_level?: number;
  ball_control?: number;
  ball_control_level?: number;
  creativity?: number;
  creativity_level?: number;
  one_vs_one_def?: number;     // 1vs1_def renombrado
  one_vs_one_def_level?: number; // 1vs1_def_level renombrado
  reliability?: number;
  reliability_level?: number;
  competitiveness?: number;
  competitiveness_level?: number;
  injury_resistance?: number;
  injury_resistance_level?: number;
  transition?: number;
  transition_level?: number;
  keeping_the_ball?: number;
  keeping_the_ball_level?: number;
  progression?: number;
  progression_level?: number;
  finishing_archetype?: number;
  finishing_level?: number;
  set_piece?: number;
  set_piece_level?: number;
  aerial_play?: number;
  aerial_play_level?: number;
  ball_recovery?: number;
  ball_recovery_level?: number;
  defensive_shape?: number;
  defensive_shape_level?: number;
  goal_saving?: number;
  goal_saving_level?: number;
  
  // Tendencias y "dominance" táctico-estilístico
  // Ataque
  positional_att_tendency?: number;
  positional_att_tendency_percent?: number;
  direct_att_tendency?: number;
  direct_att_tendency_percent?: number;
  positional_att_dominance?: number;
  positional_att_dominance_level?: number;
  direct_att_dominance?: number;
  direct_att_dominance_level?: number;
  
  // Defensa (altura del bloque)
  low_block_def_tendency?: number;
  low_block_def_tendency_percent?: number;
  high_block_def_tendency?: number;
  high_block_def_tendency_percent?: number;
  low_block_def_dominance?: number;
  low_block_def_dominance_level?: number;
  high_block_def_dominance?: number;
  high_block_def_dominance_level?: number;
  
  // Influencia por fase
  influence_off_tendency?: number;
  influence_off_tendency_percent?: number;
  influence_def_tendency?: number;
  influence_def_tendency_percent?: number;
  influence_off_dominance?: number;
  influence_off_dominance_level?: number;
  influence_def_dominance?: number;
  influence_def_dominance_level?: number;
  
  // Espacios de juego
  open_spaces_tendency?: number;
  open_spaces_tendency_percent?: number;
  tight_spaces_tendency?: number;
  tight_spaces_tendency_percent?: number;
  open_spaces_dominance?: number;
  open_spaces_dominance_level?: number;
  tight_spaces_dominance?: number;
  tight_spaces_dominance_level?: number;
  
  // Perfil de pie
  right_foot_tendency?: number;
  right_foot_tendency_percent?: number;
  left_foot_tendency?: number;
  left_foot_tendency_percent?: number;
  right_foot_dominance?: number;
  right_foot_dominance_level?: number;
  left_foot_dominance?: number;
  left_foot_dominance_level?: number;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// Tipos auxiliares para facilitar el trabajo con atributos específicos

export interface AtributosFisicos {
  sprinter?: number;
  sprinter_level?: number;
  marathonian?: number;
  marathonian_level?: number;
  bomberman?: number;
  bomberman_level?: number;
  "360º"?: number;
  "360º_level"?: number;
  the_rock?: number;
  the_rock_level?: number;
  air_flyer?: number;
  air_flyer_level?: number;
}

export interface AtributosPortero {
  aerial_ability_fmi?: number;
  command_of_area_fmi?: number;
  communication_fmi?: number;
  eccentricity_fmi?: number;
  handling_fmi?: number;
  kicking_fmi?: number;
  one_on_ones_fmi?: number;
  tendency_to_punch_fmi?: number;
  reflexes_fmi?: number;
  rushing_out_fmi?: number;
  throwing_fmi?: number;
}

export interface AtributosPosicionales {
  goalkeeper_fmi?: number;
  gk_level?: number;
  defender_right_fmi?: number;
  rb_level?: number;
  defender_central_fmi?: number;
  cb_level?: number;
  defender_left_fmi?: number;
  lb_level?: number;
  wing_back_right_fmi?: number;
  rwb_level?: number;
  defensive_midfielder_fmi?: number;
  dm_level?: number;
  wing_back_left_fmi?: number;
  lwb_level?: number;
  midfielder_right_fmi?: number;
  rm_level?: number;
  midfielder_central_fmi?: number;
  cm_level?: number;
  midfielder_left_fmi?: number;
  lm_level?: number;
  attacking_mid_right_fmi?: number;
  rw_level?: number;
  attacking_mid_central_fmi?: number;
  am_level?: number;
  attacking_mid_left_fmi?: number;
  lw_level?: number;
  striker_fmi?: number;
  st_level?: number;
}

export interface AtributosPie {
  left_foot_fmi?: number;
  right_foot_fmi?: number;
  right_foot_tendency?: number;
  right_foot_tendency_percent?: number;
  left_foot_tendency?: number;
  left_foot_tendency_percent?: number;
  right_foot_dominance?: number;
  right_foot_dominance_level?: number;
  left_foot_dominance?: number;
  left_foot_dominance_level?: number;
}

// Enums para niveles y categorías
export enum NivelAtributo {
  MUY_BAJO = 1,
  BAJO = 2,
  MEDIO = 3,
  ALTO = 4,
  MUY_ALTO = 5
}

export enum GradoAtributo {
  F = 'F',
  E = 'E', 
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
  A_PLUS = 'A+'
}

// Función helper para convertir índice FMI a grado
export function fmiToGrade(fmi: number): GradoAtributo {
  if (fmi >= 90) return GradoAtributo.A_PLUS;
  if (fmi >= 80) return GradoAtributo.A;
  if (fmi >= 70) return GradoAtributo.B;
  if (fmi >= 60) return GradoAtributo.C;
  if (fmi >= 50) return GradoAtributo.D;
  if (fmi >= 40) return GradoAtributo.E;
  return GradoAtributo.F;
}

// Función helper para convertir índice FMI a nivel
export function fmiToLevel(fmi: number): NivelAtributo {
  if (fmi >= 80) return NivelAtributo.MUY_ALTO;
  if (fmi >= 70) return NivelAtributo.ALTO;
  if (fmi >= 60) return NivelAtributo.MEDIO;
  if (fmi >= 50) return NivelAtributo.BAJO;
  return NivelAtributo.MUY_BAJO;
}