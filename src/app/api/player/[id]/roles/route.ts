import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = params.id;

    // Fetch player roles from database
    const roles = await prisma.playerRole.findMany({
      where: {
        player_id: playerId,
      },
      select: {
        role_name: true,
        percentage: true,
      },
      orderBy: {
        role_name: 'asc',
      },
    });

    return NextResponse.json({ roles }, { status: 200 });
  } catch (error) {
    console.error('Error fetching player roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player roles' },
      { status: 500 }
    );
  }
}
