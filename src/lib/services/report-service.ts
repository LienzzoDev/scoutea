export interface Report {
  id: string;
  playerId: string;
  scoutId: string;
  title: string;
  content: string;
  rating: number;
  createdAt: Date;
}

export interface ReportStats {
  totalReports: number;
  averageRating: number;
  reportsByMonth: { month: string; count: number }[];
}

export class ReportService {
  static async getAllReports(): Promise<Report[]> {
    // Mock implementation - replace with actual database query
    return [
      {
        id: '1',
        playerId: '1',
        scoutId: '1',
        title: 'Excellent Performance',
        content: 'Player showed great skills during the match.',
        rating: 8.5,
        createdAt: new Date()
      }
    ];
  }

  static async getReportById(id: string): Promise<Report | null> {
    const reports = await this.getAllReports();
    return reports.find(r => r.id === id) || null;
  }

  static async getReportsByPlayerId(playerId: string): Promise<Report[]> {
    const reports = await this.getAllReports();
    return reports.filter(r => r.playerId === playerId);
  }

  static async getReportStats(): Promise<ReportStats> {
    const reports = await this.getAllReports();
    return {
      totalReports: reports.length,
      averageRating: reports.reduce((sum, r) => sum + r.rating, 0) / reports.length,
      reportsByMonth: [
        { month: 'January', count: 5 },
        { month: 'February', count: 8 },
        { month: 'March', count: 12 }
      ]
    };
  }

  static async createReport(reportData: Omit<Report, 'id' | 'createdAt'>): Promise<Report> {
    // Mock implementation
    return {
      ...reportData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    };
  }
}