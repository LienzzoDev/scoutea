import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';

export interface PositionLevels {
  gk_level: number | null;
  rb_level: number | null;
  cb_level: number | null;
  lb_level: number | null;
  rwb_level: number | null;
  dm_level: number | null;
  lwb_level: number | null;
  rm_level: number | null;
  cm_level: number | null;
  lm_level: number | null;
  rw_level: number | null;
  am_level: number | null;
  lw_level: number | null;
  st_level: number | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playerId } = await params;

    // Convert to number for Atributos table (uses Int id_player)
    const playerIdNum = parseInt(playerId, 10);

    if (isNaN(playerIdNum)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }

    // Fetch position levels from Atributos table
    const atributos = await prisma.atributos.findUnique({
      where: {
        id_player: playerIdNum,
      },
      select: {
        gk_level: true,
        rb_level: true,
        cb_level: true,
        lb_level: true,
        rwb_level: true,
        dm_level: true,
        lwb_level: true,
        rm_level: true,
        cm_level: true,
        lm_level: true,
        rw_level: true,
        am_level: true,
        lw_level: true,
        st_level: true,
      },
    });

    if (!atributos) {
      // Return null levels if no data found
      return NextResponse.json({
        positionLevels: {
          gk_level: null,
          rb_level: null,
          cb_level: null,
          lb_level: null,
          rwb_level: null,
          dm_level: null,
          lwb_level: null,
          rm_level: null,
          cm_level: null,
          lm_level: null,
          rw_level: null,
          am_level: null,
          lw_level: null,
          st_level: null,
        } as PositionLevels
      }, { status: 200 });
    }

    return NextResponse.json({ positionLevels: atributos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching position levels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch position levels' },
      { status: 500 }
    );
  }
}
