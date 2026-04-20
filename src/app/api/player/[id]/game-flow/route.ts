import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db';

export interface GameFlowData {
  foot: {
    leftTendency: number;
    rightTendency: number;
    leftDominance: number;
    leftDominanceLevel: number;
    rightDominance: number;
    rightDominanceLevel: number;
  };
  attackingMode: {
    positionalTendency: number;
    directTendency: number;
    positionalDominance: number;
    positionalDominanceLevel: number;
    directDominance: number;
    directDominanceLevel: number;
  };
  defendingMode: {
    lowBlockTendency: number;
    highBlockTendency: number;
    lowBlockDominance: number;
    lowBlockDominanceLevel: number;
    highBlockDominance: number;
    highBlockDominanceLevel: number;
  };
  influence: {
    defensiveTendency: number;
    offensiveTendency: number;
    defensiveDominance: number;
    defensiveDominanceLevel: number;
    offensiveDominance: number;
    offensiveDominanceLevel: number;
  };
  spaces: {
    tightTendency: number;
    openTendency: number;
    tightDominance: number;
    tightDominanceLevel: number;
    openDominance: number;
    openDominanceLevel: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playerId } = await params;

    // Fetch game flow data from Atributos table
    const atributos = await prisma.atributos.findFirst({
      where: {
        id_player: parseInt(playerId, 10),
      },
      select: {
        // Foot
        left_foot_tendency: true,
        left_foot_tendency_percent: true,
        right_foot_tendency: true,
        right_foot_tendency_percent: true,
        left_foot_dominance: true,
        left_foot_dominance_level: true,
        right_foot_dominance: true,
        right_foot_dominance_level: true,
        // Attacking Mode
        positional_att_tendency: true,
        positional_att_tendency_percent: true,
        direct_att_tendency: true,
        direct_att_tendency_percent: true,
        positional_att_dominance: true,
        positional_att_dominance_level: true,
        direct_att_dominance: true,
        direct_att_dominance_level: true,
        // Defending Mode
        low_block_def_tendency: true,
        low_block_def_tendency_percent: true,
        high_block_def_tendency: true,
        high_block_def_tendency_percent: true,
        low_block_def_dominance: true,
        low_block_def_dominance_level: true,
        high_block_def_dominance: true,
        high_block_def_dominance_level: true,
        // Influence
        influence_def_tendency: true,
        influence_def_tendency_percent: true,
        influence_off_tendency: true,
        influence_off_tendency_percent: true,
        influence_def_dominance: true,
        influence_def_dominance_level: true,
        influence_off_dominance: true,
        influence_off_dominance_level: true,
        // Spaces
        tight_spaces_tendency: true,
        tight_spaces_tendency_percent: true,
        open_spaces_tendency: true,
        open_spaces_tendency_percent: true,
        tight_spaces_dominance: true,
        tight_spaces_dominance_level: true,
        open_spaces_dominance: true,
        open_spaces_dominance_level: true,
      },
    });

    if (!atributos) {
      // Return default/empty data if no attributes found
      const defaultData: GameFlowData = {
        foot: {
          leftTendency: 50,
          rightTendency: 50,
          leftDominance: 50,
          leftDominanceLevel: 5,
          rightDominance: 50,
          rightDominanceLevel: 5,
        },
        attackingMode: {
          positionalTendency: 50,
          directTendency: 50,
          positionalDominance: 50,
          positionalDominanceLevel: 5,
          directDominance: 50,
          directDominanceLevel: 5,
        },
        defendingMode: {
          lowBlockTendency: 50,
          highBlockTendency: 50,
          lowBlockDominance: 50,
          lowBlockDominanceLevel: 5,
          highBlockDominance: 50,
          highBlockDominanceLevel: 5,
        },
        influence: {
          defensiveTendency: 50,
          offensiveTendency: 50,
          defensiveDominance: 50,
          defensiveDominanceLevel: 5,
          offensiveDominance: 50,
          offensiveDominanceLevel: 5,
        },
        spaces: {
          tightTendency: 50,
          openTendency: 50,
          tightDominance: 50,
          tightDominanceLevel: 5,
          openDominance: 50,
          openDominanceLevel: 5,
        },
      };
      return NextResponse.json({ gameFlow: defaultData }, { status: 200 });
    }

    // Map database fields to response structure
    const gameFlow: GameFlowData = {
      foot: {
        leftTendency: atributos.left_foot_tendency_percent ?? atributos.left_foot_tendency ?? 50,
        rightTendency: atributos.right_foot_tendency_percent ?? atributos.right_foot_tendency ?? 50,
        leftDominance: atributos.left_foot_dominance ?? 50,
        leftDominanceLevel: atributos.left_foot_dominance_level ?? 5,
        rightDominance: atributos.right_foot_dominance ?? 50,
        rightDominanceLevel: atributos.right_foot_dominance_level ?? 5,
      },
      attackingMode: {
        positionalTendency: atributos.positional_att_tendency_percent ?? atributos.positional_att_tendency ?? 50,
        directTendency: atributos.direct_att_tendency_percent ?? atributos.direct_att_tendency ?? 50,
        positionalDominance: atributos.positional_att_dominance ?? 50,
        positionalDominanceLevel: atributos.positional_att_dominance_level ?? 5,
        directDominance: atributos.direct_att_dominance ?? 50,
        directDominanceLevel: atributos.direct_att_dominance_level ?? 5,
      },
      defendingMode: {
        lowBlockTendency: atributos.low_block_def_tendency_percent ?? atributos.low_block_def_tendency ?? 50,
        highBlockTendency: atributos.high_block_def_tendency_percent ?? atributos.high_block_def_tendency ?? 50,
        lowBlockDominance: atributos.low_block_def_dominance ?? 50,
        lowBlockDominanceLevel: atributos.low_block_def_dominance_level ?? 5,
        highBlockDominance: atributos.high_block_def_dominance ?? 50,
        highBlockDominanceLevel: atributos.high_block_def_dominance_level ?? 5,
      },
      influence: {
        defensiveTendency: atributos.influence_def_tendency_percent ?? atributos.influence_def_tendency ?? 50,
        offensiveTendency: atributos.influence_off_tendency_percent ?? atributos.influence_off_tendency ?? 50,
        defensiveDominance: atributos.influence_def_dominance ?? 50,
        defensiveDominanceLevel: atributos.influence_def_dominance_level ?? 5,
        offensiveDominance: atributos.influence_off_dominance ?? 50,
        offensiveDominanceLevel: atributos.influence_off_dominance_level ?? 5,
      },
      spaces: {
        tightTendency: atributos.tight_spaces_tendency_percent ?? atributos.tight_spaces_tendency ?? 50,
        openTendency: atributos.open_spaces_tendency_percent ?? atributos.open_spaces_tendency ?? 50,
        tightDominance: atributos.tight_spaces_dominance ?? 50,
        tightDominanceLevel: atributos.tight_spaces_dominance_level ?? 5,
        openDominance: atributos.open_spaces_dominance ?? 50,
        openDominanceLevel: atributos.open_spaces_dominance_level ?? 5,
      },
    };

    return NextResponse.json({ gameFlow }, { status: 200 });
  } catch (error) {
    console.error('Error fetching game flow data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game flow data' },
      { status: 500 }
    );
  }
}
