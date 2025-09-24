export interface RadarMetric {
  name: string;
  value: number;
  percentile: number;
  category: string;
}

export interface RadarComparisonData {
  playerId: string;
  playerName: string;
  metrics: RadarMetric[];
  overallRating: number;
}

export class RadarCalculationService {
  static async calculatePlayerRadar(playerId: string): Promise<RadarComparisonData> {
    // Mock implementation - replace with actual radar calculation logic
    return {
      playerId,
      playerName: 'Sample Player',
      metrics: [
        { name: 'Off Transition', value: 85, percentile: 75, category: 'Off Transition' },
        { name: 'Maintenance', value: 88, percentile: 80, category: 'Maintenance' },
        { name: 'Progression', value: 82, percentile: 72, category: 'Progression' },
        { name: 'Finishing', value: 90, percentile: 85, category: 'Finishing' },
        { name: 'Off Stopped Ball', value: 78, percentile: 68, category: 'Off Stopped Ball' },
        { name: 'Def Transition', value: 75, percentile: 65, category: 'Def Transition' },
        { name: 'Recovery', value: 80, percentile: 70, category: 'Recovery' },
        { name: 'Evitation', value: 65, percentile: 45, category: 'Evitation' },
        { name: 'Def Stopped Ball', value: 72, percentile: 58, category: 'Def Stopped Ball' }
      ],
      overallRating: 84
    };
  }

  static async comparePlayersRadar(playerIds: string[]): Promise<RadarComparisonData[]> {
    // Mock implementation
    const comparisons: RadarComparisonData[] = [];
    
    for (const playerId of playerIds) {
      const data = await this.calculatePlayerRadar(playerId);
      comparisons.push(data);
    }
    
    return comparisons;
  }

  static calculatePercentile(value: number, allValues: number[]): number {
    const sorted = allValues.sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return Math.round((index / sorted.length) * 100);
  }
}