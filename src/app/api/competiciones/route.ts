import { NextRequest, NextResponse } from 'next/server';

import { CompetitionService } from '@/lib/services/competition-service';

export async function GET(_request: NextRequest) {
  try {
    const competitions = await CompetitionService.getAllCompetitions();
    return NextResponse.json(competitions);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitions' },
      { status: 500 }
    );
  }
}