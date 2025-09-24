export interface Competition {
  id: string;
  name: string;
  country: string;
  level: string;
}

export class CompetitionService {
  static async getAllCompetitions(): Promise<Competition[]> {
    // Mock implementation - replace with actual database query
    return [
      {
        id: '1',
        name: 'La Liga',
        country: 'España',
        level: 'Primera División'
      },
      {
        id: '2',
        name: 'Premier League',
        country: 'Inglaterra',
        level: 'Primera División'
      },
      {
        id: '3',
        name: 'Serie A',
        country: 'Italia',
        level: 'Primera División'
      }
    ];
  }

  static async getCompetitionById(id: string): Promise<Competition | null> {
    const competitions = await this.getAllCompetitions();
    return competitions.find(c => c.id === id) || null;
  }
}