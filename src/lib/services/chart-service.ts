export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface LollipopData {
  playerId: string;
  playerName: string;
  metrics: {
    name: string;
    value: number;
    percentile: number;
  }[];
}

export class ChartService {
  static async generateLollipopChart(playerId: string): Promise<LollipopData> {
    // Mock implementation - replace with actual chart generation logic
    return {
      playerId,
      playerName: 'Sample Player',
      metrics: [
        { name: 'Goals', value: 15, percentile: 85 },
        { name: 'Assists', value: 8, percentile: 70 },
        { name: 'Passes', value: 1200, percentile: 90 },
        { name: 'Tackles', value: 45, percentile: 60 }
      ]
    };
  }

  static async generateRadarChart(_playerId: string): Promise<ChartData> {
    // Mock implementation
    return {
      labels: ['Speed', 'Shooting', 'Passing', 'Defending', 'Dribbling'],
      datasets: [{
        label: 'Player Stats',
        data: [85, 90, 88, 65, 92],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)'
      }]
    };
  }
}