import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Endpoint temporal para limpiar valores avg incorrectos (en formato de euros completos)
 * y forzar su recálculo en el formato correcto (millones)
 */
export async function POST(request: NextRequest) {
  try {
    // Buscar todos los jugadores con valores avg que parecen estar en el formato incorrecto
    // (valores mayores a 1000 millones son sospechosos)
    const playersWithInvalidValues = await prisma.jugador.findMany({
      where: {
        OR: [
          { position_value: { gt: 1000 } },
          { nationality_value: { gt: 1000 } },
          { team_level_value: { gt: 1000 } },
          { team_competition_value: { gt: 1000 } },
          { competition_level_value: { gt: 1000 } },
          { owner_club_value: { gt: 1000 } },
        ],
      },
      select: {
        id_player: true,
        player_name: true,
        position_value: true,
        nationality_value: true,
        team_competition_value: true,
      },
    });

    console.log(
      `🔍 Encontrados ${playersWithInvalidValues.length} jugadores con valores inválidos`
    );

    // Limpiar los valores inválidos (ponerlos en null para forzar recálculo)
    const updatePromises = playersWithInvalidValues.map((player) =>
      prisma.jugador.update({
        where: { id_player: player.id_player },
        data: {
          position_value: null,
          position_value_percent: null,
          nationality_value: null,
          nationality_value_percent: null,
          team_level_value: null,
          team_level_value_percent: null,
          team_competition_value: null,
          team_competition_value_percent: null,
          competition_level_value: null,
          competition_level_value_percent: null,
          owner_club_value: null,
          owner_club_value_percent: null,
        },
      })
    );

    await Promise.all(updatePromises);

    console.log(
      `✅ Limpiados ${playersWithInvalidValues.length} jugadores. Los valores se recalcularán automáticamente.`
    );

    return NextResponse.json({
      success: true,
      message: `Limpiados ${playersWithInvalidValues.length} jugadores con valores inválidos`,
      players: playersWithInvalidValues.map((p) => ({
        id: p.id_player,
        name: p.player_name,
      })),
    });
  } catch (error) {
    console.error("❌ Error limpiando valores avg inválidos:", error);
    return NextResponse.json(
      { error: "Failed to fix avg values" },
      { status: 500 }
    );
  }
}
