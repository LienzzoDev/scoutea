export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
}

export class TournamentService {
  static async getAllTournaments(): Promise<Tournament[]> {
    // Mock implementation - replace with actual database query
    return [
      {
        id: '1',
        name: 'Liga Española',
        startDate: '2024-08-01',
        endDate: '2024-05-31',
        location: 'España'
      },
      {
        id: '2',
        name: 'Premier League',
        startDate: '2024-08-01',
        endDate: '2024-05-31',
        location: 'Inglaterra'
      }
    ];
  }

  static async getTournamentById(id: string): Promise<Tournament | null> {
    const tournaments = await this.getAllTournaments();
    return tournaments.find(t => t.id === id) || null;
  }
}