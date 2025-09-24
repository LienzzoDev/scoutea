import { NextRequest, NextResponse } from 'next/server';

import { ReportService } from '@/lib/services/report-service';

export async function GET(_request: NextRequest) {
  try {
    const stats = await ReportService.getReportStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching report stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report stats' },
      { status: 500 }
    );
  }
}