/**
 * AtributosDataGenerator - Generates realistic attribute values based on player position
 * 
 * This class provides position-specific value ranges and realistic distributions
 * for Football Manager attributes, ensuring generated data matches real-world expectations.
 */

export interface PositionProfile {
  high: string[];      // Attributes that should be high (70-95)
  medium: string[];    // Attributes that should be medium (40-70)
  low: string[];       // Attributes that should be low (10-40)
  variable: string[];  // Attributes that vary significantly (20-80)
}

export interface AttributeRange {
  min: number;
  max: number;
  mean: number;
  stdDev: number;
}

export class AtributosDataGenerator {
  private readonly positionProfiles: Record<string, PositionProfile> = {
    'Goalkeeper': {
      high: [
        'reflexes_fmi', 'handling_fmi', 'aerial_ability_fmi', 'one_on_ones_fmi',
        'kicking_fmi', 'throwing_fmi', 'communication_fmi', 'command_of_area_fmi',
        'concentration_fmi', 'positioning_fmi', 'anticipation_fmi'
      ],
      medium: [
        'agility_fmi', 'balance_fmi', 'decisions_fmi', 'determination_fmi',
        'bravery_fmi', 'composure_fmi', 'leadership_fmi', 'rushing_out_fmi'
      ],
      low: [
        'finishing_fmi', 'crossing_fmi', 'dribbling_fmi', 'tackling_fmi',
        'heading_fmi', 'long_shots_fmi', 'pace_fmi', 'acceleration_fmi',
        'off_the_ball_fmi', 'corners_fmi', 'free_kick_taking_fmi'
      ],
      variable: ['passing_fmi', 'technique_fmi', 'vision_fmi', 'work_rate_fmi']
    },

    'Centre-Back': {
      high: [
        'tackling_fmi', 'marking_fmi', 'heading_fmi', 'positioning_fmi',
        'strength_fmi', 'jumping_fmi', 'anticipation_fmi', 'concentration_fmi',
        'bravery_fmi', 'determination_fmi', 'aerial_ability_fmi'
      ],
      medium: [
        'passing_fmi', 'composure_fmi', 'decisions_fmi', 'leadership_fmi',
        'team_work_fmi', 'stamina_fmi', 'balance_fmi', 'aggression_fmi'
      ],
      low: [
        'finishing_fmi', 'dribbling_fmi', 'crossing_fmi', 'long_shots_fmi',
        'pace_fmi', 'acceleration_fmi', 'agility_fmi', 'flair_fmi',
        'off_the_ball_fmi', 'corners_fmi', 'free_kick_taking_fmi'
      ],
      variable: ['technique_fmi', 'vision_fmi', 'work_rate_fmi', 'first_touch_fmi']
    },

    'Left-Back': {
      high: [
        'tackling_fmi', 'crossing_fmi', 'stamina_fmi', 'pace_fmi',
        'acceleration_fmi', 'positioning_fmi', 'work_rate_fmi', 'team_work_fmi'
      ],
      medium: [
        'passing_fmi', 'marking_fmi', 'heading_fmi', 'strength_fmi',
        'anticipation_fmi', 'concentration_fmi', 'decisions_fmi', 'determination_fmi',
        'agility_fmi', 'balance_fmi', 'technique_fmi'
      ],
      low: [
        'finishing_fmi', 'long_shots_fmi', 'aerial_ability_fmi',
        'jumping_fmi', 'flair_fmi', 'corners_fmi', 'penalty_taking_fmi'
      ],
      variable: ['dribbling_fmi', 'first_touch_fmi', 'composure_fmi', 'vision_fmi', 'off_the_ball_fmi']
    },

    'Right-Back': {
      high: [
        'tackling_fmi', 'crossing_fmi', 'stamina_fmi', 'pace_fmi',
        'acceleration_fmi', 'positioning_fmi', 'work_rate_fmi', 'team_work_fmi'
      ],
      medium: [
        'passing_fmi', 'marking_fmi', 'heading_fmi', 'strength_fmi',
        'anticipation_fmi', 'concentration_fmi', 'decisions_fmi', 'determination_fmi',
        'agility_fmi', 'balance_fmi', 'technique_fmi'
      ],
      low: [
        'finishing_fmi', 'long_shots_fmi', 'aerial_ability_fmi',
        'jumping_fmi', 'flair_fmi', 'corners_fmi', 'penalty_taking_fmi'
      ],
      variable: ['dribbling_fmi', 'first_touch_fmi', 'composure_fmi', 'vision_fmi', 'off_the_ball_fmi']
    },

    'Defensive Midfielder': {
      high: [
        'tackling_fmi', 'passing_fmi', 'positioning_fmi', 'anticipation_fmi',
        'stamina_fmi', 'work_rate_fmi', 'team_work_fmi', 'concentration_fmi',
        'decisions_fmi', 'determination_fmi'
      ],
      medium: [
        'marking_fmi', 'heading_fmi', 'strength_fmi', 'technique_fmi',
        'composure_fmi', 'vision_fmi', 'first_touch_fmi', 'balance_fmi',
        'aggression_fmi', 'leadership_fmi'
      ],
      low: [
        'finishing_fmi', 'crossing_fmi', 'long_shots_fmi', 'pace_fmi',
        'acceleration_fmi', 'agility_fmi', 'flair_fmi', 'off_the_ball_fmi'
      ],
      variable: ['dribbling_fmi', 'corners_fmi', 'free_kick_taking_fmi', 'penalty_taking_fmi']
    },

    'Central Midfielder': {
      high: [
        'passing_fmi', 'vision_fmi', 'technique_fmi', 'stamina_fmi',
        'work_rate_fmi', 'team_work_fmi', 'first_touch_fmi', 'composure_fmi',
        'decisions_fmi', 'concentration_fmi'
      ],
      medium: [
        'tackling_fmi', 'positioning_fmi', 'anticipation_fmi', 'determination_fmi',
        'balance_fmi', 'agility_fmi', 'strength_fmi', 'heading_fmi',
        'dribbling_fmi', 'leadership_fmi'
      ],
      low: [
        'finishing_fmi', 'crossing_fmi', 'long_shots_fmi', 'marking_fmi',
        'pace_fmi', 'acceleration_fmi', 'jumping_fmi', 'aerial_ability_fmi'
      ],
      variable: ['flair_fmi', 'off_the_ball_fmi', 'corners_fmi', 'free_kick_taking_fmi', 'penalty_taking_fmi']
    },

    'Attacking Midfielder': {
      high: [
        'passing_fmi', 'vision_fmi', 'technique_fmi', 'dribbling_fmi',
        'first_touch_fmi', 'composure_fmi', 'flair_fmi', 'off_the_ball_fmi',
        'decisions_fmi', 'concentration_fmi'
      ],
      medium: [
        'finishing_fmi', 'long_shots_fmi', 'crossing_fmi', 'agility_fmi',
        'balance_fmi', 'pace_fmi', 'acceleration_fmi', 'stamina_fmi',
        'work_rate_fmi', 'team_work_fmi'
      ],
      low: [
        'tackling_fmi', 'marking_fmi', 'heading_fmi', 'positioning_fmi',
        'strength_fmi', 'jumping_fmi', 'aerial_ability_fmi', 'aggression_fmi'
      ],
      variable: ['determination_fmi', 'anticipation_fmi', 'corners_fmi', 'free_kick_taking_fmi', 'penalty_taking_fmi']
    },

    'Left Winger': {
      high: [
        'pace_fmi', 'acceleration_fmi', 'dribbling_fmi', 'crossing_fmi',
        'agility_fmi', 'balance_fmi', 'technique_fmi', 'first_touch_fmi',
        'flair_fmi', 'off_the_ball_fmi'
      ],
      medium: [
        'finishing_fmi', 'passing_fmi', 'vision_fmi', 'composure_fmi',
        'stamina_fmi', 'work_rate_fmi', 'decisions_fmi', 'concentration_fmi',
        'determination_fmi', 'team_work_fmi'
      ],
      low: [
        'tackling_fmi', 'marking_fmi', 'heading_fmi', 'positioning_fmi',
        'strength_fmi', 'jumping_fmi', 'aerial_ability_fmi', 'aggression_fmi',
        'leadership_fmi', 'anticipation_fmi'
      ],
      variable: ['long_shots_fmi', 'corners_fmi', 'free_kick_taking_fmi', 'penalty_taking_fmi']
    },

    'Right Winger': {
      high: [
        'pace_fmi', 'acceleration_fmi', 'dribbling_fmi', 'crossing_fmi',
        'agility_fmi', 'balance_fmi', 'technique_fmi', 'first_touch_fmi',
        'flair_fmi', 'off_the_ball_fmi'
      ],
      medium: [
        'finishing_fmi', 'passing_fmi', 'vision_fmi', 'composure_fmi',
        'stamina_fmi', 'work_rate_fmi', 'decisions_fmi', 'concentration_fmi',
        'determination_fmi', 'team_work_fmi'
      ],
      low: [
        'tackling_fmi', 'marking_fmi', 'heading_fmi', 'positioning_fmi',
        'strength_fmi', 'jumping_fmi', 'aerial_ability_fmi', 'aggression_fmi',
        'leadership_fmi', 'anticipation_fmi'
      ],
      variable: ['long_shots_fmi', 'corners_fmi', 'free_kick_taking_fmi', 'penalty_taking_fmi']
    },

    'Striker': {
      high: [
        'finishing_fmi', 'off_the_ball_fmi', 'composure_fmi', 'first_touch_fmi',
        'technique_fmi', 'anticipation_fmi', 'concentration_fmi', 'determination_fmi'
      ],
      medium: [
        'heading_fmi', 'long_shots_fmi', 'dribbling_fmi', 'pace_fmi',
        'acceleration_fmi', 'strength_fmi', 'jumping_fmi', 'balance_fmi',
        'agility_fmi', 'decisions_fmi', 'work_rate_fmi'
      ],
      low: [
        'tackling_fmi', 'marking_fmi', 'positioning_fmi', 'crossing_fmi',
        'passing_fmi', 'vision_fmi', 'team_work_fmi', 'aerial_ability_fmi',
        'aggression_fmi', 'leadership_fmi'
      ],
      variable: ['flair_fmi', 'stamina_fmi', 'corners_fmi', 'free_kick_taking_fmi', 'penalty_taking_fmi']
    }
  };

  private readonly attributeRanges: Record<string, AttributeRange> = {
    high: { min: 70, max: 95, mean: 82, stdDev: 8 },
    medium: { min: 40, max: 70, mean: 55, stdDev: 10 },
    low: { min: 10, max: 40, mean: 25, stdDev: 8 },
    variable: { min: 20, max: 80, mean: 50, stdDev: 15 }
  };

  /**
   * Generates a realistic attribute value using normal distribution
   */
  private generateValue(range: AttributeRange): number {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Apply mean and standard deviation
    let value = Math.round(range.mean + z0 * range.stdDev);
    
    // Clamp to min/max bounds
    value = Math.max(range.min, Math.min(range.max, value));
    
    return value;
  }

  /**
   * Normalizes position names to match our profiles
   */
  private normalizePosition(position: string): string {
    const normalized = position.toLowerCase().trim();
    
    const positionMap: Record<string, string> = {
      'gk': 'Goalkeeper',
      'goalkeeper': 'Goalkeeper',
      'cb': 'Centre-Back',
      'centre-back': 'Centre-Back',
      'center-back': 'Centre-Back',
      'lb': 'Left-Back',
      'left-back': 'Left-Back',
      'rb': 'Right-Back',
      'right-back': 'Right-Back',
      'dm': 'Defensive Midfielder',
      'defensive midfielder': 'Defensive Midfielder',
      'cdm': 'Defensive Midfielder',
      'cm': 'Central Midfielder',
      'central midfielder': 'Central Midfielder',
      'am': 'Attacking Midfielder',
      'attacking midfielder': 'Attacking Midfielder',
      'cam': 'Attacking Midfielder',
      'lw': 'Left Winger',
      'left winger': 'Left Winger',
      'rw': 'Right Winger',
      'right winger': 'Right Winger',
      'st': 'Striker',
      'striker': 'Striker',
      'cf': 'Striker'
    };

    return positionMap[normalized] || 'Central Midfielder'; // Default fallback
  }

  /**
   * Generates sample data for all null attributes of a player
   */
  public generatePlayerAttributes(
    position: string,
    currentAttributes: Record<string, number | null>,
    playerAge?: number,
    leagueLevel?: string
  ): Record<string, number> {
    const normalizedPosition = this.normalizePosition(position);
    const profile = this.positionProfiles[normalizedPosition];
    
    if (!profile) {
      throw new Error(`No profile found for position: ${position}`);
    }

    const generatedAttributes: Record<string, number> = {};
    
    // Age modifier (younger players might have slightly lower attributes)
    const ageModifier = playerAge ? this.getAgeModifier(playerAge) : 1.0;
    
    // League level modifier (lower leagues have slightly lower attributes)
    const leagueModifier = this.getLeagueModifier(leagueLevel);

    // Generate values for null attributes only
    for (const [attributeName, currentValue] of Object.entries(currentAttributes)) {
      if (currentValue === null || currentValue === undefined) {
        let range: AttributeRange;
        
        if (profile.high.includes(attributeName)) {
          range = this.attributeRanges.high;
        } else if (profile.medium.includes(attributeName)) {
          range = this.attributeRanges.medium;
        } else if (profile.low.includes(attributeName)) {
          range = this.attributeRanges.low;
        } else {
          range = this.attributeRanges.variable;
        }

        // Apply modifiers
        const modifiedRange = {
          ...range,
          mean: Math.round(range.mean * ageModifier * leagueModifier),
          min: Math.round(range.min * leagueModifier),
          max: Math.round(range.max * ageModifier * leagueModifier)
        };

        generatedAttributes[attributeName] = this.generateValue(modifiedRange);
      }
    }

    return generatedAttributes;
  }

  /**
   * Age modifier - younger players tend to have slightly lower current attributes
   */
  private getAgeModifier(age: number): number {
    if (age < 20) return 0.85;
    if (age < 23) return 0.92;
    if (age < 27) return 1.0;
    if (age < 32) return 0.98;
    return 0.95; // Older players
  }

  /**
   * League level modifier - lower leagues have lower attribute ranges
   */
  private getLeagueModifier(leagueLevel?: string): number {
    if (!leagueLevel) return 1.0;
    
    const level = leagueLevel.toLowerCase();
    
    if (level.includes('premier') || level.includes('la liga') || level.includes('serie a') || 
        level.includes('bundesliga') || level.includes('ligue 1')) {
      return 1.0; // Top leagues
    }
    
    if (level.includes('championship') || level.includes('segunda') || level.includes('serie b')) {
      return 0.9; // Second tier
    }
    
    if (level.includes('league one') || level.includes('tercera')) {
      return 0.8; // Third tier
    }
    
    return 0.85; // Default for unknown leagues
  }

  /**
   * Gets the position profile for a given position
   */
  public getPositionProfile(position: string): PositionProfile | null {
    const normalizedPosition = this.normalizePosition(position);
    return this.positionProfiles[normalizedPosition] || null;
  }

  /**
   * Gets all supported positions
   */
  public getSupportedPositions(): string[] {
    return Object.keys(this.positionProfiles);
  }
}