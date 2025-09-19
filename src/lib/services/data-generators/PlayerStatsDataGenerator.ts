/**
 * PlayerStatsDataGenerator - Generates realistic statistical values for player_stats_3m table
 * 
 * This class provides position-specific statistical averages and realistic distributions
 * for 3-month player statistics, ensuring generated data matches real-world performance patterns.
 */

export interface StatisticalProfile {
  goals_p90_3m: { min: number; max: number; mean: number };
  assists_p90_3m: { min: number; max: number; mean: number };
  shots_p90_3m: { min: number; max: number; mean: number };
  effectiveness_percent_3m: { min: number; max: number; mean: number };
  passes_p90_3m: { min: number; max: number; mean: number };
  forward_passes_p90_3m: { min: number; max: number; mean: number };
  accurate_passes_percent_3m: { min: number; max: number; mean: number };
  crosses_p90_3m: { min: number; max: number; mean: number };
  tackles_p90_3m: { min: number; max: number; mean: number };
  interceptions_p90_3m: { min: number; max: number; mean: number };
  def_duels_won_percent_3m: { min: number; max: number; mean: number };
  off_duels_won_percent_3m: { min: number; max: number; mean: number };
  aerials_duels_won_percent_3m: { min: number; max: number; mean: number };
  // Goalkeeper specific
  conceded_goals_p90_3m: { min: number; max: number; mean: number };
  prevented_goals_p90_3m: { min: number; max: number; mean: number };
  clean_sheets_percent_3m: { min: number; max: number; mean: number };
  save_rate_percent_3m: { min: number; max: number; mean: number };
}

export class PlayerStatsDataGenerator {
  private readonly positionProfiles: Record<string, StatisticalProfile> = {
    'Goalkeeper': {
      goals_p90_3m: { min: 0.0, max: 0.02, mean: 0.0 },
      assists_p90_3m: { min: 0.0, max: 0.05, mean: 0.01 },
      shots_p90_3m: { min: 0.0, max: 0.1, mean: 0.02 },
      effectiveness_percent_3m: { min: 0.0, max: 20.0, mean: 5.0 },
      passes_p90_3m: { min: 15.0, max: 45.0, mean: 28.0 },
      forward_passes_p90_3m: { min: 8.0, max: 25.0, mean: 15.0 },
      accurate_passes_percent_3m: { min: 60.0, max: 85.0, mean: 72.0 },
      crosses_p90_3m: { min: 0.0, max: 0.5, mean: 0.1 },
      tackles_p90_3m: { min: 0.0, max: 0.2, mean: 0.05 },
      interceptions_p90_3m: { min: 0.0, max: 0.5, mean: 0.15 },
      def_duels_won_percent_3m: { min: 30.0, max: 70.0, mean: 50.0 },
      off_duels_won_percent_3m: { min: 20.0, max: 60.0, mean: 35.0 },
      aerials_duels_won_percent_3m: { min: 40.0, max: 80.0, mean: 60.0 },
      conceded_goals_p90_3m: { min: 0.5, max: 2.5, mean: 1.2 },
      prevented_goals_p90_3m: { min: -0.5, max: 0.8, mean: 0.1 },
      clean_sheets_percent_3m: { min: 15.0, max: 65.0, mean: 35.0 },
      save_rate_percent_3m: { min: 60.0, max: 85.0, mean: 72.0 }
    },

    'Centre-Back': {
      goals_p90_3m: { min: 0.0, max: 0.15, mean: 0.05 },
      assists_p90_3m: { min: 0.0, max: 0.12, mean: 0.03 },
      shots_p90_3m: { min: 0.2, max: 1.5, mean: 0.6 },
      effectiveness_percent_3m: { min: 5.0, max: 25.0, mean: 12.0 },
      passes_p90_3m: { min: 35.0, max: 80.0, mean: 55.0 },
      forward_passes_p90_3m: { min: 15.0, max: 35.0, mean: 22.0 },
      accurate_passes_percent_3m: { min: 75.0, max: 95.0, mean: 85.0 },
      crosses_p90_3m: { min: 0.0, max: 1.0, mean: 0.2 },
      tackles_p90_3m: { min: 1.5, max: 4.5, mean: 2.8 },
      interceptions_p90_3m: { min: 1.0, max: 3.5, mean: 2.0 },
      def_duels_won_percent_3m: { min: 55.0, max: 75.0, mean: 65.0 },
      off_duels_won_percent_3m: { min: 35.0, max: 55.0, mean: 45.0 },
      aerials_duels_won_percent_3m: { min: 60.0, max: 85.0, mean: 72.0 },
      conceded_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      prevented_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      clean_sheets_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      save_rate_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 }
    },

    'Left-Back': {
      goals_p90_3m: { min: 0.0, max: 0.2, mean: 0.06 },
      assists_p90_3m: { min: 0.0, max: 0.4, mean: 0.12 },
      shots_p90_3m: { min: 0.3, max: 2.0, mean: 0.8 },
      effectiveness_percent_3m: { min: 8.0, max: 30.0, mean: 15.0 },
      passes_p90_3m: { min: 30.0, max: 70.0, mean: 48.0 },
      forward_passes_p90_3m: { min: 12.0, max: 30.0, mean: 20.0 },
      accurate_passes_percent_3m: { min: 70.0, max: 90.0, mean: 80.0 },
      crosses_p90_3m: { min: 1.0, max: 6.0, mean: 3.2 },
      tackles_p90_3m: { min: 1.8, max: 4.0, mean: 2.6 },
      interceptions_p90_3m: { min: 0.8, max: 2.5, mean: 1.5 },
      def_duels_won_percent_3m: { min: 50.0, max: 70.0, mean: 60.0 },
      off_duels_won_percent_3m: { min: 40.0, max: 65.0, mean: 52.0 },
      aerials_duels_won_percent_3m: { min: 45.0, max: 70.0, mean: 57.0 },
      conceded_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      prevented_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      clean_sheets_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      save_rate_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 }
    },

    'Right-Back': {
      goals_p90_3m: { min: 0.0, max: 0.2, mean: 0.06 },
      assists_p90_3m: { min: 0.0, max: 0.4, mean: 0.12 },
      shots_p90_3m: { min: 0.3, max: 2.0, mean: 0.8 },
      effectiveness_percent_3m: { min: 8.0, max: 30.0, mean: 15.0 },
      passes_p90_3m: { min: 30.0, max: 70.0, mean: 48.0 },
      forward_passes_p90_3m: { min: 12.0, max: 30.0, mean: 20.0 },
      accurate_passes_percent_3m: { min: 70.0, max: 90.0, mean: 80.0 },
      crosses_p90_3m: { min: 1.0, max: 6.0, mean: 3.2 },
      tackles_p90_3m: { min: 1.8, max: 4.0, mean: 2.6 },
      interceptions_p90_3m: { min: 0.8, max: 2.5, mean: 1.5 },
      def_duels_won_percent_3m: { min: 50.0, max: 70.0, mean: 60.0 },
      off_duels_won_percent_3m: { min: 40.0, max: 65.0, mean: 52.0 },
      aerials_duels_won_percent_3m: { min: 45.0, max: 70.0, mean: 57.0 },
      conceded_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      prevented_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      clean_sheets_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      save_rate_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 }
    },

    'Defensive Midfielder': {
      goals_p90_3m: { min: 0.0, max: 0.25, mean: 0.08 },
      assists_p90_3m: { min: 0.0, max: 0.3, mean: 0.1 },
      shots_p90_3m: { min: 0.5, max: 2.5, mean: 1.2 },
      effectiveness_percent_3m: { min: 8.0, max: 25.0, mean: 15.0 },
      passes_p90_3m: { min: 45.0, max: 85.0, mean: 65.0 },
      forward_passes_p90_3m: { min: 18.0, max: 40.0, mean: 28.0 },
      accurate_passes_percent_3m: { min: 80.0, max: 95.0, mean: 87.0 },
      crosses_p90_3m: { min: 0.0, max: 1.5, mean: 0.4 },
      tackles_p90_3m: { min: 2.5, max: 5.5, mean: 3.8 },
      interceptions_p90_3m: { min: 1.5, max: 4.0, mean: 2.5 },
      def_duels_won_percent_3m: { min: 55.0, max: 75.0, mean: 65.0 },
      off_duels_won_percent_3m: { min: 45.0, max: 65.0, mean: 55.0 },
      aerials_duels_won_percent_3m: { min: 50.0, max: 75.0, mean: 62.0 },
      conceded_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      prevented_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      clean_sheets_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      save_rate_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 }
    },

    'Central Midfielder': {
      goals_p90_3m: { min: 0.0, max: 0.4, mean: 0.12 },
      assists_p90_3m: { min: 0.0, max: 0.5, mean: 0.18 },
      shots_p90_3m: { min: 0.8, max: 3.5, mean: 1.8 },
      effectiveness_percent_3m: { min: 10.0, max: 30.0, mean: 18.0 },
      passes_p90_3m: { min: 50.0, max: 90.0, mean: 68.0 },
      forward_passes_p90_3m: { min: 20.0, max: 45.0, mean: 32.0 },
      accurate_passes_percent_3m: { min: 82.0, max: 96.0, mean: 89.0 },
      crosses_p90_3m: { min: 0.2, max: 2.5, mean: 1.0 },
      tackles_p90_3m: { min: 1.5, max: 4.0, mean: 2.5 },
      interceptions_p90_3m: { min: 1.0, max: 3.0, mean: 1.8 },
      def_duels_won_percent_3m: { min: 50.0, max: 70.0, mean: 60.0 },
      off_duels_won_percent_3m: { min: 50.0, max: 70.0, mean: 60.0 },
      aerials_duels_won_percent_3m: { min: 45.0, max: 70.0, mean: 57.0 },
      conceded_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      prevented_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      clean_sheets_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      save_rate_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 }
    },

    'Attacking Midfielder': {
      goals_p90_3m: { min: 0.1, max: 0.8, mean: 0.35 },
      assists_p90_3m: { min: 0.1, max: 0.8, mean: 0.4 },
      shots_p90_3m: { min: 1.5, max: 5.0, mean: 2.8 },
      effectiveness_percent_3m: { min: 15.0, max: 40.0, mean: 25.0 },
      passes_p90_3m: { min: 40.0, max: 75.0, mean: 55.0 },
      forward_passes_p90_3m: { min: 18.0, max: 40.0, mean: 28.0 },
      accurate_passes_percent_3m: { min: 75.0, max: 92.0, mean: 83.0 },
      crosses_p90_3m: { min: 0.5, max: 4.0, mean: 1.8 },
      tackles_p90_3m: { min: 0.8, max: 2.5, mean: 1.5 },
      interceptions_p90_3m: { min: 0.5, max: 2.0, mean: 1.0 },
      def_duels_won_percent_3m: { min: 40.0, max: 60.0, mean: 50.0 },
      off_duels_won_percent_3m: { min: 50.0, max: 75.0, mean: 62.0 },
      aerials_duels_won_percent_3m: { min: 35.0, max: 60.0, mean: 47.0 },
      conceded_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      prevented_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      clean_sheets_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      save_rate_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 }
    },

    'Left Winger': {
      goals_p90_3m: { min: 0.1, max: 0.7, mean: 0.28 },
      assists_p90_3m: { min: 0.1, max: 0.6, mean: 0.32 },
      shots_p90_3m: { min: 1.2, max: 4.5, mean: 2.5 },
      effectiveness_percent_3m: { min: 12.0, max: 35.0, mean: 22.0 },
      passes_p90_3m: { min: 25.0, max: 55.0, mean: 38.0 },
      forward_passes_p90_3m: { min: 10.0, max: 25.0, mean: 16.0 },
      accurate_passes_percent_3m: { min: 70.0, max: 88.0, mean: 78.0 },
      crosses_p90_3m: { min: 2.0, max: 8.0, mean: 4.5 },
      tackles_p90_3m: { min: 0.5, max: 2.0, mean: 1.1 },
      interceptions_p90_3m: { min: 0.3, max: 1.5, mean: 0.8 },
      def_duels_won_percent_3m: { min: 35.0, max: 55.0, mean: 45.0 },
      off_duels_won_percent_3m: { min: 45.0, max: 70.0, mean: 57.0 },
      aerials_duels_won_percent_3m: { min: 30.0, max: 55.0, mean: 42.0 },
      conceded_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      prevented_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      clean_sheets_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      save_rate_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 }
    },

    'Right Winger': {
      goals_p90_3m: { min: 0.1, max: 0.7, mean: 0.28 },
      assists_p90_3m: { min: 0.1, max: 0.6, mean: 0.32 },
      shots_p90_3m: { min: 1.2, max: 4.5, mean: 2.5 },
      effectiveness_percent_3m: { min: 12.0, max: 35.0, mean: 22.0 },
      passes_p90_3m: { min: 25.0, max: 55.0, mean: 38.0 },
      forward_passes_p90_3m: { min: 10.0, max: 25.0, mean: 16.0 },
      accurate_passes_percent_3m: { min: 70.0, max: 88.0, mean: 78.0 },
      crosses_p90_3m: { min: 2.0, max: 8.0, mean: 4.5 },
      tackles_p90_3m: { min: 0.5, max: 2.0, mean: 1.1 },
      interceptions_p90_3m: { min: 0.3, max: 1.5, mean: 0.8 },
      def_duels_won_percent_3m: { min: 35.0, max: 55.0, mean: 45.0 },
      off_duels_won_percent_3m: { min: 45.0, max: 70.0, mean: 57.0 },
      aerials_duels_won_percent_3m: { min: 30.0, max: 55.0, mean: 42.0 },
      conceded_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      prevented_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      clean_sheets_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      save_rate_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 }
    },

    'Striker': {
      goals_p90_3m: { min: 0.2, max: 1.2, mean: 0.6 },
      assists_p90_3m: { min: 0.0, max: 0.4, mean: 0.15 },
      shots_p90_3m: { min: 2.0, max: 6.5, mean: 3.8 },
      effectiveness_percent_3m: { min: 15.0, max: 45.0, mean: 28.0 },
      passes_p90_3m: { min: 15.0, max: 40.0, mean: 25.0 },
      forward_passes_p90_3m: { min: 5.0, max: 18.0, mean: 10.0 },
      accurate_passes_percent_3m: { min: 65.0, max: 85.0, mean: 75.0 },
      crosses_p90_3m: { min: 0.0, max: 1.5, mean: 0.4 },
      tackles_p90_3m: { min: 0.2, max: 1.5, mean: 0.7 },
      interceptions_p90_3m: { min: 0.1, max: 1.0, mean: 0.4 },
      def_duels_won_percent_3m: { min: 30.0, max: 50.0, mean: 40.0 },
      off_duels_won_percent_3m: { min: 40.0, max: 65.0, mean: 52.0 },
      aerials_duels_won_percent_3m: { min: 45.0, max: 75.0, mean: 60.0 },
      conceded_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      prevented_goals_p90_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      clean_sheets_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 },
      save_rate_percent_3m: { min: 0.0, max: 0.0, mean: 0.0 }
    }
  };

  /**
   * Generates a realistic statistical value using normal distribution
   */
  private generateValue(min: number, max: number, mean: number): number {
    // Calculate standard deviation as 1/4 of the range for realistic distribution
    const stdDev = (max - min) / 4;
    
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Apply mean and standard deviation
    let value = mean + z0 * stdDev;
    
    // Clamp to min/max bounds
    value = Math.max(min, Math.min(max, value));
    
    // Round to appropriate decimal places based on the value range
    if (max <= 1) {
      return Math.round(value * 1000) / 1000; // 3 decimal places for per-90 stats
    } else if (max <= 10) {
      return Math.round(value * 100) / 100; // 2 decimal places
    } else {
      return Math.round(value * 10) / 10; // 1 decimal place for percentages
    }
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
   * Generates sample statistical data for all null stats of a player
   */
  public generatePlayerStats(
    position: string,
    currentStats: Record<string, number | null>,
    playerAge?: number,
    leagueLevel?: string
  ): Record<string, number> {
    const normalizedPosition = this.normalizePosition(position);
    const profile = this.positionProfiles[normalizedPosition];
    
    if (!profile) {
      throw new Error(`No statistical profile found for position: ${position}`);
    }

    const generatedStats: Record<string, number> = {};
    
    // Age modifier (peak performance around 25-29)
    const ageModifier = this.getAgeModifier(playerAge);
    
    // League level modifier
    const leagueModifier = this.getLeagueModifier(leagueLevel);

    // Generate values for null stats only
    for (const [statName, currentValue] of Object.entries(currentStats)) {
      if ((currentValue === null || currentValue === undefined) && statName in profile) {
        const statProfile = profile[statName as keyof StatisticalProfile];
        
        // Apply modifiers to the profile
        const modifiedMin = statProfile.min * leagueModifier;
        const modifiedMax = statProfile.max * ageModifier * leagueModifier;
        const modifiedMean = statProfile.mean * ageModifier * leagueModifier;

        generatedStats[statName] = this.generateValue(modifiedMin, modifiedMax, modifiedMean);
      }
    }

    return generatedStats;
  }

  /**
   * Age modifier for statistical performance
   */
  private getAgeModifier(age?: number): number {
    if (!age) return 1.0;
    
    if (age < 20) return 0.75; // Young players still developing
    if (age < 23) return 0.85; // Emerging players
    if (age < 27) return 1.0;  // Peak years
    if (age < 30) return 0.98; // Still strong
    if (age < 33) return 0.92; // Slight decline
    return 0.85; // Veteran players
  }

  /**
   * League level modifier for statistical performance
   */
  private getLeagueModifier(leagueLevel?: string): number {
    if (!leagueLevel) return 1.0;
    
    const level = leagueLevel.toLowerCase();
    
    // Top 5 European leagues
    if (level.includes('premier') || level.includes('la liga') || level.includes('serie a') || 
        level.includes('bundesliga') || level.includes('ligue 1')) {
      return 1.0;
    }
    
    // Second tier leagues
    if (level.includes('championship') || level.includes('segunda') || level.includes('serie b')) {
      return 0.85;
    }
    
    // Third tier leagues
    if (level.includes('league one') || level.includes('tercera')) {
      return 0.7;
    }
    
    return 0.8; // Default for unknown leagues
  }

  /**
   * Gets the statistical profile for a given position
   */
  public getPositionProfile(position: string): StatisticalProfile | null {
    const normalizedPosition = this.normalizePosition(position);
    return this.positionProfiles[normalizedPosition] || null;
  }

  /**
   * Gets all supported positions
   */
  public getSupportedPositions(): string[] {
    return Object.keys(this.positionProfiles);
  }

  /**
   * Validates if a stat should be populated for a given position
   * (e.g., goalkeeper stats should only be populated for goalkeepers)
   */
  public shouldPopulateStat(statName: string, position: string): boolean {
    const normalizedPosition = this.normalizePosition(position);
    
    // Goalkeeper-specific stats should only be populated for goalkeepers
    const goalkeeperStats = [
      'conceded_goals_p90_3m', 'prevented_goals_p90_3m', 
      'clean_sheets_percent_3m', 'save_rate_percent_3m'
    ];
    
    if (goalkeeperStats.includes(statName)) {
      return normalizedPosition === 'Goalkeeper';
    }
    
    // All other stats can be populated for any position
    return true;
  }
}