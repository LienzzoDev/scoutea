export interface Scout {
  id: string;
  name: string;
  email: string;
  specialization: string;
  rating: number;
  reportsCount: number;
}

export interface ScoutStats {
  totalScouts: number;
  averageRating: number;
  topScouts: Scout[];
}

export class ScoutService {
  static async getAllScouts(): Promise<Scout[]> {
    // Mock implementation - replace with actual database query
    return [
      {
        id: '1',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        specialization: 'Delanteros',
        rating: 4.5,
        reportsCount: 25
      },
      {
        id: '2',
        name: 'María García',
        email: 'maria@example.com',
        specialization: 'Defensas',
        rating: 4.8,
        reportsCount: 30
      }
    ];
  }

  static async getScoutById(id: string): Promise<Scout | null> {
    const scouts = await this.getAllScouts();
    return scouts.find(s => s.id === id) || null;
  }

  static async getAvailableScouts(): Promise<Scout[]> {
    // Mock implementation - return scouts that are available
    const scouts = await this.getAllScouts();
    return scouts.filter(s => s.rating >= 4.0);
  }

  static async getScoutRanking(): Promise<Scout[]> {
    const scouts = await this.getAllScouts();
    return scouts.sort((a, b) => b.rating - a.rating);
  }

  static async getScoutStats(): Promise<ScoutStats> {
    const scouts = await this.getAllScouts();
    return {
      totalScouts: scouts.length,
      averageRating: scouts.reduce((sum, s) => sum + s.rating, 0) / scouts.length,
      topScouts: scouts.sort((a, b) => b.rating - a.rating).slice(0, 5)
    };
  }
}