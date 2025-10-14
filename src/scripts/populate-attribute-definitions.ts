/**
 * Script para poblar la tabla attribute_definitions con todos los atributos del sistema FMI
 *
 * Este script extrae los nombres de columnas de la tabla Atributos y crea
 * definiciones organizadas por categorías en el nuevo sistema EAV.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AttributeDef {
  name: string;
  displayName: string;
  category: string;
  subcategory?: string;
  minValue: number;
  maxValue: number;
  description?: string;
}

// Definiciones de atributos organizadas por categoría
const attributeDefinitions: AttributeDef[] = [
  // ============ TECHNICAL ATTRIBUTES ============
  { name: 'corners_fmi', displayName: 'Corners', category: 'technical', subcategory: 'set_pieces', minValue: 0, maxValue: 100 },
  { name: 'crossing_fmi', displayName: 'Crossing', category: 'technical', subcategory: 'passing', minValue: 0, maxValue: 100 },
  { name: 'dribbling_fmi', displayName: 'Dribbling', category: 'technical', subcategory: 'ball_control', minValue: 0, maxValue: 100 },
  { name: 'finishing_fmi', displayName: 'Finishing', category: 'technical', subcategory: 'attacking', minValue: 0, maxValue: 100 },
  { name: 'first_touch_fmi', displayName: 'First Touch', category: 'technical', subcategory: 'ball_control', minValue: 0, maxValue: 100 },
  { name: 'free_kick_taking_fmi', displayName: 'Free Kick Taking', category: 'technical', subcategory: 'set_pieces', minValue: 0, maxValue: 100 },
  { name: 'heading_fmi', displayName: 'Heading', category: 'technical', subcategory: 'aerial', minValue: 0, maxValue: 100 },
  { name: 'long_shots_fmi', displayName: 'Long Shots', category: 'technical', subcategory: 'attacking', minValue: 0, maxValue: 100 },
  { name: 'passing_fmi', displayName: 'Passing', category: 'technical', subcategory: 'passing', minValue: 0, maxValue: 100 },
  { name: 'penalty_taking_fmi', displayName: 'Penalty Taking', category: 'technical', subcategory: 'set_pieces', minValue: 0, maxValue: 100 },
  { name: 'tackling_fmi', displayName: 'Tackling', category: 'technical', subcategory: 'defending', minValue: 0, maxValue: 100 },
  { name: 'technique_fmi', displayName: 'Technique', category: 'technical', subcategory: 'ball_control', minValue: 0, maxValue: 100 },
  { name: 'marking_fmi', displayName: 'Marking', category: 'technical', subcategory: 'defending', minValue: 0, maxValue: 100 },
  { name: 'off_the_ball_fmi', displayName: 'Off the Ball', category: 'technical', subcategory: 'movement', minValue: 0, maxValue: 100 },
  { name: 'positioning_fmi', displayName: 'Positioning', category: 'technical', subcategory: 'movement', minValue: 0, maxValue: 100 },
  { name: 'long_throws_fmi', displayName: 'Long Throws', category: 'technical', subcategory: 'set_pieces', minValue: 0, maxValue: 100 },

  // ============ PHYSICAL ATTRIBUTES ============
  { name: 'acceleration_fmi', displayName: 'Acceleration', category: 'physical', subcategory: 'speed', minValue: 0, maxValue: 100 },
  { name: 'agility_fmi', displayName: 'Agility', category: 'physical', subcategory: 'mobility', minValue: 0, maxValue: 100 },
  { name: 'balance_fmi', displayName: 'Balance', category: 'physical', subcategory: 'mobility', minValue: 0, maxValue: 100 },
  { name: 'jumping_fmi', displayName: 'Jumping', category: 'physical', subcategory: 'aerial', minValue: 0, maxValue: 100 },
  { name: 'natural_fitness_fmi', displayName: 'Natural Fitness', category: 'physical', subcategory: 'endurance', minValue: 0, maxValue: 100 },
  { name: 'pace_fmi', displayName: 'Pace', category: 'physical', subcategory: 'speed', minValue: 0, maxValue: 100 },
  { name: 'stamina_fmi', displayName: 'Stamina', category: 'physical', subcategory: 'endurance', minValue: 0, maxValue: 100 },
  { name: 'strength_fmi', displayName: 'Strength', category: 'physical', subcategory: 'power', minValue: 0, maxValue: 100 },

  // ============ MENTAL ATTRIBUTES ============
  { name: 'aggression_fmi', displayName: 'Aggression', category: 'mental', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'anticipation_fmi', displayName: 'Anticipation', category: 'mental', subcategory: 'game_reading', minValue: 0, maxValue: 100 },
  { name: 'bravery_fmi', displayName: 'Bravery', category: 'mental', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'composure_fmi', displayName: 'Composure', category: 'mental', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'concentration_fmi', displayName: 'Concentration', category: 'mental', subcategory: 'focus', minValue: 0, maxValue: 100 },
  { name: 'decisions_fmi', displayName: 'Decisions', category: 'mental', subcategory: 'game_reading', minValue: 0, maxValue: 100 },
  { name: 'determination_fmi', displayName: 'Determination', category: 'mental', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'flair_fmi', displayName: 'Flair', category: 'mental', subcategory: 'creativity', minValue: 0, maxValue: 100 },
  { name: 'leadership_fmi', displayName: 'Leadership', category: 'mental', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'team_work_fmi', displayName: 'Team Work', category: 'mental', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'vision_fmi', displayName: 'Vision', category: 'mental', subcategory: 'creativity', minValue: 0, maxValue: 100 },
  { name: 'work_rate_fmi', displayName: 'Work Rate', category: 'mental', subcategory: 'effort', minValue: 0, maxValue: 100 },

  // ============ GOALKEEPER ATTRIBUTES ============
  { name: 'aerial_ability_fmi', displayName: 'Aerial Ability', category: 'goalkeeper', subcategory: 'shot_stopping', minValue: 0, maxValue: 100 },
  { name: 'command_of_area_fmi', displayName: 'Command of Area', category: 'goalkeeper', subcategory: 'positioning', minValue: 0, maxValue: 100 },
  { name: 'communication_fmi', displayName: 'Communication', category: 'goalkeeper', subcategory: 'leadership', minValue: 0, maxValue: 100 },
  { name: 'eccentricity_fmi', displayName: 'Eccentricity', category: 'goalkeeper', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'handling_fmi', displayName: 'Handling', category: 'goalkeeper', subcategory: 'shot_stopping', minValue: 0, maxValue: 100 },
  { name: 'kicking_fmi', displayName: 'Kicking', category: 'goalkeeper', subcategory: 'distribution', minValue: 0, maxValue: 100 },
  { name: 'one_on_ones_fmi', displayName: 'One on Ones', category: 'goalkeeper', subcategory: 'shot_stopping', minValue: 0, maxValue: 100 },
  { name: 'tendency_to_punch_fmi', displayName: 'Tendency to Punch', category: 'goalkeeper', subcategory: 'shot_stopping', minValue: 0, maxValue: 100 },
  { name: 'reflexes_fmi', displayName: 'Reflexes', category: 'goalkeeper', subcategory: 'shot_stopping', minValue: 0, maxValue: 100 },
  { name: 'rushing_out_fmi', displayName: 'Rushing Out', category: 'goalkeeper', subcategory: 'positioning', minValue: 0, maxValue: 100 },
  { name: 'throwing_fmi', displayName: 'Throwing', category: 'goalkeeper', subcategory: 'distribution', minValue: 0, maxValue: 100 },

  // ============ HIDDEN ATTRIBUTES ============
  { name: 'left_foot_fmi', displayName: 'Left Foot', category: 'hidden', subcategory: 'ability', minValue: 0, maxValue: 100 },
  { name: 'right_foot_fmi', displayName: 'Right Foot', category: 'hidden', subcategory: 'ability', minValue: 0, maxValue: 100 },
  { name: 'consistency_fmi', displayName: 'Consistency', category: 'hidden', subcategory: 'performance', minValue: 0, maxValue: 100 },
  { name: 'dirtiness_fmi', displayName: 'Dirtiness', category: 'hidden', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'important_matches_fmi', displayName: 'Important Matches', category: 'hidden', subcategory: 'performance', minValue: 0, maxValue: 100 },
  { name: 'injury_proness_fmi', displayName: 'Injury Proneness', category: 'hidden', subcategory: 'physical', minValue: 0, maxValue: 100 },
  { name: 'versality_fmi', displayName: 'Versatility', category: 'hidden', subcategory: 'ability', minValue: 0, maxValue: 100 },
  { name: 'adaptability_fmi', displayName: 'Adaptability', category: 'hidden', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'ambition_fmi', displayName: 'Ambition', category: 'hidden', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'loyalty_fmi', displayName: 'Loyalty', category: 'hidden', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'pressure_fmi', displayName: 'Pressure', category: 'hidden', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'professional_fmi', displayName: 'Professional', category: 'hidden', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'sportsmanship_fmi', displayName: 'Sportsmanship', category: 'hidden', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'temperament_fmi', displayName: 'Temperament', category: 'hidden', subcategory: 'personality', minValue: 0, maxValue: 100 },
  { name: 'controversy_fmi', displayName: 'Controversy', category: 'hidden', subcategory: 'personality', minValue: 0, maxValue: 100 },

  // ============ POSITION RATINGS ============
  { name: 'goalkeeper_fmi', displayName: 'Goalkeeper Rating', category: 'position_rating', subcategory: 'goalkeeper', minValue: 0, maxValue: 100 },
  { name: 'gk_level', displayName: 'GK Level', category: 'position_rating', subcategory: 'goalkeeper', minValue: 0, maxValue: 100 },
  { name: 'defender_right_fmi', displayName: 'Right Defender Rating', category: 'position_rating', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'rb_level', displayName: 'RB Level', category: 'position_rating', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'defender_central_fmi', displayName: 'Central Defender Rating', category: 'position_rating', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'cb_level', displayName: 'CB Level', category: 'position_rating', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'defender_left_fmi', displayName: 'Left Defender Rating', category: 'position_rating', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'lb_level', displayName: 'LB Level', category: 'position_rating', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'wing_back_right_fmi', displayName: 'Right Wing Back Rating', category: 'position_rating', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'rwb_level', displayName: 'RWB Level', category: 'position_rating', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'defensive_midfielder_fmi', displayName: 'Defensive Midfielder Rating', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'dm_level', displayName: 'DM Level', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'wing_back_left_fmi', displayName: 'Left Wing Back Rating', category: 'position_rating', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'lwb_level', displayName: 'LWB Level', category: 'position_rating', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'midfielder_right_fmi', displayName: 'Right Midfielder Rating', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'rm_level', displayName: 'RM Level', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'midfielder_central_fmi', displayName: 'Central Midfielder Rating', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'cm_level', displayName: 'CM Level', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'midfielder_left_fmi', displayName: 'Left Midfielder Rating', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'lm_level', displayName: 'LM Level', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'attacking_mid_right_fmi', displayName: 'Right Attacking Midfielder Rating', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'rw_level', displayName: 'RW Level', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'attacking_mid_central_fmi', displayName: 'Central Attacking Midfielder Rating', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'am_level', displayName: 'AM Level', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'attacking_mid_left_fmi', displayName: 'Left Attacking Midfielder Rating', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'lw_level', displayName: 'LW Level', category: 'position_rating', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'striker_fmi', displayName: 'Striker Rating', category: 'position_rating', subcategory: 'forward', minValue: 0, maxValue: 100 },
  { name: 'st_level', displayName: 'ST Level', category: 'position_rating', subcategory: 'forward', minValue: 0, maxValue: 100 },

  // ============ PLAYING STYLES (ROLES) ============
  { name: 'gk_dominator', displayName: 'GK Dominator', category: 'playing_style', subcategory: 'goalkeeper', minValue: 0, maxValue: 100 },
  { name: 'gk_dominator_percent', displayName: 'GK Dominator %', category: 'playing_style', subcategory: 'goalkeeper', minValue: 0, maxValue: 100 },
  { name: 'gk_reactive', displayName: 'GK Reactive', category: 'playing_style', subcategory: 'goalkeeper', minValue: 0, maxValue: 100 },
  { name: 'gk_reactive_percent', displayName: 'GK Reactive %', category: 'playing_style', subcategory: 'goalkeeper', minValue: 0, maxValue: 100 },
  { name: 'gk_initiator', displayName: 'GK Initiator', category: 'playing_style', subcategory: 'goalkeeper', minValue: 0, maxValue: 100 },
  { name: 'gk_initiator_percent', displayName: 'GK Initiator %', category: 'playing_style', subcategory: 'goalkeeper', minValue: 0, maxValue: 100 },

  { name: 'central_def_aggressor', displayName: 'Central Defender Aggressor', category: 'playing_style', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'central_def_aggressor_percent', displayName: 'Central Defender Aggressor %', category: 'playing_style', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'central_def_spreader', displayName: 'Central Defender Spreader', category: 'playing_style', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'central_def_spreader_percent', displayName: 'Central Defender Spreader %', category: 'playing_style', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'central_def_anchor', displayName: 'Central Defender Anchor', category: 'playing_style', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'central_def_anchor_percent', displayName: 'Central Defender Anchor %', category: 'playing_style', subcategory: 'defender', minValue: 0, maxValue: 100 },

  { name: 'wide_def_overlapper', displayName: 'Wide Defender Overlapper', category: 'playing_style', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'wide_def_overlapper_percent', displayName: 'Wide Defender Overlapper %', category: 'playing_style', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'wide_def_progressor', displayName: 'Wide Defender Progressor', category: 'playing_style', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'wide_def_progressor_percent', displayName: 'Wide Defender Progressor %', category: 'playing_style', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'wide_def_safety', displayName: 'Wide Defender Safety', category: 'playing_style', subcategory: 'defender', minValue: 0, maxValue: 100 },
  { name: 'wide_def_safety_percent', displayName: 'Wide Defender Safety %', category: 'playing_style', subcategory: 'defender', minValue: 0, maxValue: 100 },

  { name: 'deep_mid_box_to_box', displayName: 'Deep Midfielder Box to Box', category: 'playing_style', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'deep_mid_box_to_box_percent', displayName: 'Deep Midfielder Box to Box %', category: 'playing_style', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'deep_mid_distributor', displayName: 'Deep Midfielder Distributor', category: 'playing_style', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'deep_mid_distributor_percent', displayName: 'Deep Midfielder Distributor %', category: 'playing_style', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'deep_mid_builder', displayName: 'Deep Midfielder Builder', category: 'playing_style', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'deep_mid_builder_percent', displayName: 'Deep Midfielder Builder %', category: 'playing_style', subcategory: 'midfielder', minValue: 0, maxValue: 100 },

  { name: 'advanced_mid_box_crasher', displayName: 'Advanced Midfielder Box Crasher', category: 'playing_style', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'advanced_mid_box_crasher_percent', displayName: 'Advanced Midfielder Box Crasher %', category: 'playing_style', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'advanced_mid_creator', displayName: 'Advanced Midfielder Creator', category: 'playing_style', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'advanced_mid_creator_percent', displayName: 'Advanced Midfielder Creator %', category: 'playing_style', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'advanced_mid_orchestrator', displayName: 'Advanced Midfielder Orchestrator', category: 'playing_style', subcategory: 'midfielder', minValue: 0, maxValue: 100 },
  { name: 'advanced_mid_orchestrator_percent', displayName: 'Advanced Midfielder Orchestrator %', category: 'playing_style', subcategory: 'midfielder', minValue: 0, maxValue: 100 },

  { name: 'wide_att_outlet', displayName: 'Wide Attacker Outlet', category: 'playing_style', subcategory: 'forward', minValue: 0, maxValue: 100 },
  { name: 'wide_att_outlet_percent', displayName: 'Wide Attacker Outlet %', category: 'playing_style', subcategory: 'forward', minValue: 0, maxValue: 100 },
  { name: 'wide_att_unlocker', displayName: 'Wide Attacker Unlocker', category: 'playing_style', subcategory: 'forward', minValue: 0, maxValue: 100 },
  { name: 'wide_att_unlocker_percent', displayName: 'Wide Attacker Unlocker %', category: 'playing_style', subcategory: 'forward', minValue: 0, maxValue: 100 },
  { name: 'wide_att_threat', displayName: 'Wide Attacker Threat', category: 'playing_style', subcategory: 'forward', minValue: 0, maxValue: 100 },
  { name: 'wide_att_threat_percent', displayName: 'Wide Attacker Threat %', category: 'playing_style', subcategory: 'forward', minValue: 0, maxValue: 100 },

  { name: 'central_att_roamer', displayName: 'Central Attacker Roamer', category: 'playing_style', subcategory: 'forward', minValue: 0, maxValue: 100 },
  { name: 'central_att_roamer_percent', displayName: 'Central Attacker Roamer %', category: 'playing_style', subcategory: 'forward', minValue: 0, maxValue: 100 },
  { name: 'central_att_target', displayName: 'Central Attacker Target', category: 'playing_style', subcategory: 'forward', minValue: 0, maxValue: 100 },
  { name: 'central_att_target_percent', displayName: 'Central Attacker Target %', category: 'playing_style', subcategory: 'forward', minValue: 0, maxValue: 100 },
  { name: 'central_att_finisher', displayName: 'Central Attacker Finisher', category: 'playing_style', subcategory: 'forward', minValue: 0, maxValue: 100 },
  { name: 'central_att_finisher_percent', displayName: 'Central Attacker Finisher %', category: 'playing_style', subcategory: 'forward', minValue: 0, maxValue: 100 },

  // ============ SPECIAL ABILITIES (BADGES) ============
  { name: 'sprinter', displayName: 'Sprinter', category: 'special_ability', subcategory: 'physical', minValue: 0, maxValue: 100, description: 'Exceptional sprint speed' },
  { name: 'sprinter_level', displayName: 'Sprinter Level', category: 'special_ability', subcategory: 'physical', minValue: 0, maxValue: 10 },
  { name: 'marathonian', displayName: 'Marathonian', category: 'special_ability', subcategory: 'physical', minValue: 0, maxValue: 100, description: 'Exceptional stamina and endurance' },
  { name: 'marathonian_level', displayName: 'Marathonian Level', category: 'special_ability', subcategory: 'physical', minValue: 0, maxValue: 10 },
  { name: 'bomberman', displayName: 'Bomberman', category: 'special_ability', subcategory: 'physical', minValue: 0, maxValue: 100, description: 'Powerful long shots' },
  { name: 'bomberman_level', displayName: 'Bomberman Level', category: 'special_ability', subcategory: 'physical', minValue: 0, maxValue: 10 },
  { name: 'three_sixty', displayName: '360°', category: 'special_ability', subcategory: 'technical', minValue: 0, maxValue: 100, description: 'Exceptional awareness and vision' },
  { name: 'three_sixty_level', displayName: '360° Level', category: 'special_ability', subcategory: 'technical', minValue: 0, maxValue: 10 },
  { name: 'the_rock', displayName: 'The Rock', category: 'special_ability', subcategory: 'physical', minValue: 0, maxValue: 100, description: 'Exceptional strength and physicality' },
  { name: 'the_rock_level', displayName: 'The Rock Level', category: 'special_ability', subcategory: 'physical', minValue: 0, maxValue: 10 },
  { name: 'air_flyer', displayName: 'Air Flyer', category: 'special_ability', subcategory: 'physical', minValue: 0, maxValue: 100, description: 'Exceptional aerial ability' },
  { name: 'air_flyer_level', displayName: 'Air Flyer Level', category: 'special_ability', subcategory: 'physical', minValue: 0, maxValue: 10 },
  { name: 'one_vs_one_off', displayName: '1v1 Offensive', category: 'special_ability', subcategory: 'technical', minValue: 0, maxValue: 100, description: 'Exceptional 1v1 dribbling' },
  { name: 'one_vs_one_off_level', displayName: '1v1 Offensive Level', category: 'special_ability', subcategory: 'technical', minValue: 0, maxValue: 10 },
  { name: 'intelligence', displayName: 'Intelligence', category: 'special_ability', subcategory: 'mental', minValue: 0, maxValue: 100, description: 'Exceptional tactical intelligence' },
  { name: 'intelligence_level', displayName: 'Intelligence Level', category: 'special_ability', subcategory: 'mental', minValue: 0, maxValue: 10 },
  { name: 'game_pace', displayName: 'Game Pace', category: 'special_ability', subcategory: 'mental', minValue: 0, maxValue: 100, description: 'Controls tempo of play' },
  { name: 'game_pace_level', displayName: 'Game Pace Level', category: 'special_ability', subcategory: 'mental', minValue: 0, maxValue: 10 },
  { name: 'striking', displayName: 'Striking', category: 'special_ability', subcategory: 'technical', minValue: 0, maxValue: 100, description: 'Exceptional finishing ability' },
  { name: 'striking_level', displayName: 'Striking Level', category: 'special_ability', subcategory: 'technical', minValue: 0, maxValue: 10 },
  { name: 'ball_control', displayName: 'Ball Control', category: 'special_ability', subcategory: 'technical', minValue: 0, maxValue: 100, description: 'Exceptional ball control' },
  { name: 'ball_control_level', displayName: 'Ball Control Level', category: 'special_ability', subcategory: 'technical', minValue: 0, maxValue: 10 },
  { name: 'creativity', displayName: 'Creativity', category: 'special_ability', subcategory: 'mental', minValue: 0, maxValue: 100, description: 'Exceptional creative play' },
  { name: 'creativity_level', displayName: 'Creativity Level', category: 'special_ability', subcategory: 'mental', minValue: 0, maxValue: 10 },
  { name: 'one_vs_one_def', displayName: '1v1 Defensive', category: 'special_ability', subcategory: 'technical', minValue: 0, maxValue: 100, description: 'Exceptional 1v1 defending' },
  { name: 'one_vs_one_def_level', displayName: '1v1 Defensive Level', category: 'special_ability', subcategory: 'technical', minValue: 0, maxValue: 10 },
  { name: 'reliability', displayName: 'Reliability', category: 'special_ability', subcategory: 'mental', minValue: 0, maxValue: 100, description: 'Consistently performs well' },
  { name: 'reliability_level', displayName: 'Reliability Level', category: 'special_ability', subcategory: 'mental', minValue: 0, maxValue: 10 },
  { name: 'competitiveness', displayName: 'Competitiveness', category: 'special_ability', subcategory: 'mental', minValue: 0, maxValue: 100, description: 'Thrives in competitive matches' },
  { name: 'competitiveness_level', displayName: 'Competitiveness Level', category: 'special_ability', subcategory: 'mental', minValue: 0, maxValue: 10 },
  { name: 'injury_resistance', displayName: 'Injury Resistance', category: 'special_ability', subcategory: 'physical', minValue: 0, maxValue: 100, description: 'Rarely injured' },
  { name: 'injury_resistance_level', displayName: 'Injury Resistance Level', category: 'special_ability', subcategory: 'physical', minValue: 0, maxValue: 10 },

  // ============ COMPOSITE ATTRIBUTES (ARCHETYPES) ============
  { name: 'transition', displayName: 'Transition', category: 'archetype', subcategory: 'team_play', minValue: 0, maxValue: 100, description: 'Performance in transition play' },
  { name: 'transition_level', displayName: 'Transition Level', category: 'archetype', subcategory: 'team_play', minValue: 0, maxValue: 10 },
  { name: 'keeping_the_ball', displayName: 'Keeping the Ball', category: 'archetype', subcategory: 'team_play', minValue: 0, maxValue: 100, description: 'Possession retention ability' },
  { name: 'keeping_the_ball_level', displayName: 'Keeping the Ball Level', category: 'archetype', subcategory: 'team_play', minValue: 0, maxValue: 10 },
  { name: 'progression', displayName: 'Progression', category: 'archetype', subcategory: 'team_play', minValue: 0, maxValue: 100, description: 'Ball progression ability' },
  { name: 'progression_level', displayName: 'Progression Level', category: 'archetype', subcategory: 'team_play', minValue: 0, maxValue: 10 },
  { name: 'finishing_archetype', displayName: 'Finishing Archetype', category: 'archetype', subcategory: 'attacking', minValue: 0, maxValue: 100, description: 'Overall finishing composite' },
  { name: 'finishing_level', displayName: 'Finishing Level', category: 'archetype', subcategory: 'attacking', minValue: 0, maxValue: 10 },
  { name: 'set_piece', displayName: 'Set Piece', category: 'archetype', subcategory: 'technical', minValue: 0, maxValue: 100, description: 'Set piece proficiency' },
  { name: 'set_piece_level', displayName: 'Set Piece Level', category: 'archetype', subcategory: 'technical', minValue: 0, maxValue: 10 },
  { name: 'aerial_play', displayName: 'Aerial Play', category: 'archetype', subcategory: 'physical', minValue: 0, maxValue: 100, description: 'Overall aerial ability' },
  { name: 'aerial_play_level', displayName: 'Aerial Play Level', category: 'archetype', subcategory: 'physical', minValue: 0, maxValue: 10 },
  { name: 'ball_recovery', displayName: 'Ball Recovery', category: 'archetype', subcategory: 'defending', minValue: 0, maxValue: 100, description: 'Ball recovery ability' },
  { name: 'ball_recovery_level', displayName: 'Ball Recovery Level', category: 'archetype', subcategory: 'defending', minValue: 0, maxValue: 10 },
  { name: 'defensive_shape', displayName: 'Defensive Shape', category: 'archetype', subcategory: 'defending', minValue: 0, maxValue: 100, description: 'Maintains defensive structure' },
  { name: 'defensive_shape_level', displayName: 'Defensive Shape Level', category: 'archetype', subcategory: 'defending', minValue: 0, maxValue: 10 },
  { name: 'goal_saving', displayName: 'Goal Saving', category: 'archetype', subcategory: 'goalkeeper', minValue: 0, maxValue: 100, description: 'Overall goalkeeping ability' },
  { name: 'goal_saving_level', displayName: 'Goal Saving Level', category: 'archetype', subcategory: 'goalkeeper', minValue: 0, maxValue: 10 },

  // ============ TACTICAL TENDENCIES ============
  { name: 'positional_att_tendency', displayName: 'Positional Attack Tendency', category: 'tactical_tendency', subcategory: 'attacking', minValue: 0, maxValue: 100 },
  { name: 'positional_att_tendency_percent', displayName: 'Positional Attack Tendency %', category: 'tactical_tendency', subcategory: 'attacking', minValue: 0, maxValue: 100 },
  { name: 'direct_att_tendency', displayName: 'Direct Attack Tendency', category: 'tactical_tendency', subcategory: 'attacking', minValue: 0, maxValue: 100 },
  { name: 'direct_att_tendency_percent', displayName: 'Direct Attack Tendency %', category: 'tactical_tendency', subcategory: 'attacking', minValue: 0, maxValue: 100 },
  { name: 'positional_att_dominance', displayName: 'Positional Attack Dominance', category: 'tactical_tendency', subcategory: 'attacking', minValue: 0, maxValue: 100 },
  { name: 'positional_att_dominance_level', displayName: 'Positional Attack Dominance Level', category: 'tactical_tendency', subcategory: 'attacking', minValue: 0, maxValue: 10 },
  { name: 'direct_att_dominance', displayName: 'Direct Attack Dominance', category: 'tactical_tendency', subcategory: 'attacking', minValue: 0, maxValue: 100 },
  { name: 'direct_att_dominance_level', displayName: 'Direct Attack Dominance Level', category: 'tactical_tendency', subcategory: 'attacking', minValue: 0, maxValue: 10 },

  { name: 'low_block_def_tendency', displayName: 'Low Block Defense Tendency', category: 'tactical_tendency', subcategory: 'defending', minValue: 0, maxValue: 100 },
  { name: 'low_block_def_tendency_percent', displayName: 'Low Block Defense Tendency %', category: 'tactical_tendency', subcategory: 'defending', minValue: 0, maxValue: 100 },
  { name: 'high_block_def_tendency', displayName: 'High Block Defense Tendency', category: 'tactical_tendency', subcategory: 'defending', minValue: 0, maxValue: 100 },
  { name: 'high_block_def_tendency_percent', displayName: 'High Block Defense Tendency %', category: 'tactical_tendency', subcategory: 'defending', minValue: 0, maxValue: 100 },
  { name: 'low_block_def_dominance', displayName: 'Low Block Defense Dominance', category: 'tactical_tendency', subcategory: 'defending', minValue: 0, maxValue: 100 },
  { name: 'low_block_def_dominance_level', displayName: 'Low Block Defense Dominance Level', category: 'tactical_tendency', subcategory: 'defending', minValue: 0, maxValue: 10 },
  { name: 'high_block_def_dominance', displayName: 'High Block Defense Dominance', category: 'tactical_tendency', subcategory: 'defending', minValue: 0, maxValue: 100 },
  { name: 'high_block_def_dominance_level', displayName: 'High Block Defense Dominance Level', category: 'tactical_tendency', subcategory: 'defending', minValue: 0, maxValue: 10 },

  { name: 'influence_off_tendency', displayName: 'Offensive Influence Tendency', category: 'tactical_tendency', subcategory: 'influence', minValue: 0, maxValue: 100 },
  { name: 'influence_off_tendency_percent', displayName: 'Offensive Influence Tendency %', category: 'tactical_tendency', subcategory: 'influence', minValue: 0, maxValue: 100 },
  { name: 'influence_def_tendency', displayName: 'Defensive Influence Tendency', category: 'tactical_tendency', subcategory: 'influence', minValue: 0, maxValue: 100 },
  { name: 'influence_def_tendency_percent', displayName: 'Defensive Influence Tendency %', category: 'tactical_tendency', subcategory: 'influence', minValue: 0, maxValue: 100 },
  { name: 'influence_off_dominance', displayName: 'Offensive Influence Dominance', category: 'tactical_tendency', subcategory: 'influence', minValue: 0, maxValue: 100 },
  { name: 'influence_off_dominance_level', displayName: 'Offensive Influence Dominance Level', category: 'tactical_tendency', subcategory: 'influence', minValue: 0, maxValue: 10 },
  { name: 'influence_def_dominance', displayName: 'Defensive Influence Dominance', category: 'tactical_tendency', subcategory: 'influence', minValue: 0, maxValue: 100 },
  { name: 'influence_def_dominance_level', displayName: 'Defensive Influence Dominance Level', category: 'tactical_tendency', subcategory: 'influence', minValue: 0, maxValue: 10 },

  { name: 'open_spaces_tendency', displayName: 'Open Spaces Tendency', category: 'tactical_tendency', subcategory: 'space', minValue: 0, maxValue: 100 },
  { name: 'open_spaces_tendency_percent', displayName: 'Open Spaces Tendency %', category: 'tactical_tendency', subcategory: 'space', minValue: 0, maxValue: 100 },
  { name: 'tight_spaces_tendency', displayName: 'Tight Spaces Tendency', category: 'tactical_tendency', subcategory: 'space', minValue: 0, maxValue: 100 },
  { name: 'tight_spaces_tendency_percent', displayName: 'Tight Spaces Tendency %', category: 'tactical_tendency', subcategory: 'space', minValue: 0, maxValue: 100 },
  { name: 'open_spaces_dominance', displayName: 'Open Spaces Dominance', category: 'tactical_tendency', subcategory: 'space', minValue: 0, maxValue: 100 },
  { name: 'open_spaces_dominance_level', displayName: 'Open Spaces Dominance Level', category: 'tactical_tendency', subcategory: 'space', minValue: 0, maxValue: 10 },
  { name: 'tight_spaces_dominance', displayName: 'Tight Spaces Dominance', category: 'tactical_tendency', subcategory: 'space', minValue: 0, maxValue: 100 },
  { name: 'tight_spaces_dominance_level', displayName: 'Tight Spaces Dominance Level', category: 'tactical_tendency', subcategory: 'space', minValue: 0, maxValue: 10 },

  { name: 'right_foot_tendency', displayName: 'Right Foot Tendency', category: 'tactical_tendency', subcategory: 'foot_preference', minValue: 0, maxValue: 100 },
  { name: 'right_foot_tendency_percent', displayName: 'Right Foot Tendency %', category: 'tactical_tendency', subcategory: 'foot_preference', minValue: 0, maxValue: 100 },
  { name: 'left_foot_tendency', displayName: 'Left Foot Tendency', category: 'tactical_tendency', subcategory: 'foot_preference', minValue: 0, maxValue: 100 },
  { name: 'left_foot_tendency_percent', displayName: 'Left Foot Tendency %', category: 'tactical_tendency', subcategory: 'foot_preference', minValue: 0, maxValue: 100 },
  { name: 'right_foot_dominance', displayName: 'Right Foot Dominance', category: 'tactical_tendency', subcategory: 'foot_preference', minValue: 0, maxValue: 100 },
  { name: 'right_foot_dominance_level', displayName: 'Right Foot Dominance Level', category: 'tactical_tendency', subcategory: 'foot_preference', minValue: 0, maxValue: 10 },
  { name: 'left_foot_dominance', displayName: 'Left Foot Dominance', category: 'tactical_tendency', subcategory: 'foot_preference', minValue: 0, maxValue: 100 },
  { name: 'left_foot_dominance_level', displayName: 'Left Foot Dominance Level', category: 'tactical_tendency', subcategory: 'foot_preference', minValue: 0, maxValue: 10 },

  // ============ SUMMARY METRICS ============
  { name: 'id_fmi', displayName: 'FMI ID', category: 'system', subcategory: 'identifier', minValue: 0, maxValue: 999999, description: 'Football Manager Index ID' },
  { name: 'total_fmi_pts', displayName: 'Total FMI Points', category: 'system', subcategory: 'summary', minValue: 0, maxValue: 10000, description: 'Total FMI system points' },
  { name: 'total_fmi_pts_norm', displayName: 'Total FMI Points (Normalized)', category: 'system', subcategory: 'summary', minValue: 0, maxValue: 100, description: 'Normalized total FMI points' },
];

async function main() {
  console.log('🚀 Iniciando población de attribute_definitions...\n');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const attr of attributeDefinitions) {
    try {
      await prisma.attributeDefinition.create({
        data: {
          name: attr.name,
          display_name: attr.displayName,
          category: attr.category,
          subcategory: attr.subcategory,
          min_value: attr.minValue,
          max_value: attr.maxValue,
          description: attr.description,
        },
      });
      created++;

      if (created % 20 === 0) {
        console.log(`✅ Creados ${created} atributos...`);
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint violation - ya existe
        skipped++;
      } else {
        console.error(`❌ Error creando ${attr.name}:`, error.message);
        errors++;
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ POBLACIÓN COMPLETADA');
  console.log('='.repeat(80));
  console.log(`✅ Creados: ${created}`);
  console.log(`⏭️  Saltados (ya existían): ${skipped}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`📊 Total definiciones: ${attributeDefinitions.length}`);

  // Resumen por categoría
  console.log('\n📋 RESUMEN POR CATEGORÍA:');
  const byCategory = attributeDefinitions.reduce((acc, attr) => {
    acc[attr.category] = (acc[attr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`   ${category.padEnd(20)} → ${count} atributos`);
    });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error fatal:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
