import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playerId } = await params;

    // Obtener el jugador actual
    const player = await prisma.jugador.findUnique({
      where: { id_player: playerId },
      select: {
        id_player: true,
        correct_position_player: true,
        position_player: true,
        correct_nationality_1: true,
        nationality_1: true,
        team_level: true,
        team_competition: true,
        competition_level: true,
        owner_club: true,
        player_trfm_value: true,
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    const position = player.correct_position_player || player.position_player;
    const nationality = player.correct_nationality_1 || player.nationality_1;
    const teamLevel = player.team_level;
    const competition = player.team_competition;
    const competitionLevel = player.competition_level;
    const ownerClub = player.owner_club;

    // Helper para normalizar valores a millones (si está en euros completos, dividir por 1M)
    const normalizeValue = (value: number): number => {
      // Si el valor es mayor a 1000, asumimos que está en euros completos y lo convertimos a millones
      if (value > 1000) {
        return value / 1_000_000;
      }
      return value;
    };

    // Calcular avg value para posición
    let positionValue = null;
    let positionValuePercent = null;
    if (position && player.player_trfm_value) {
      const positionPlayers = await prisma.jugador.findMany({
        where: {
          OR: [
            { correct_position_player: position },
            { position_player: position },
          ],
          player_trfm_value: { not: null, gt: 0 },
        },
        select: { player_trfm_value: true },
      });

      if (positionPlayers.length > 0) {
        const normalizedValues = positionPlayers.map(p => normalizeValue(p.player_trfm_value || 0));
        const avgValue = normalizedValues.reduce((sum, val) => sum + val, 0) / normalizedValues.length;
        positionValue = avgValue;
        positionValuePercent = ((normalizeValue(player.player_trfm_value) - avgValue) / avgValue) * 100;
      }
    }

    // Calcular avg value para nacionalidad
    let nationalityValue = null;
    let nationalityValuePercent = null;
    if (nationality && player.player_trfm_value) {
      const nationalityPlayers = await prisma.jugador.findMany({
        where: {
          OR: [
            { correct_nationality_1: nationality },
            { nationality_1: nationality },
          ],
          player_trfm_value: { not: null, gt: 0 },
        },
        select: { player_trfm_value: true },
      });

      if (nationalityPlayers.length > 0) {
        const normalizedValues = nationalityPlayers.map(p => normalizeValue(p.player_trfm_value || 0));
        const avgValue = normalizedValues.reduce((sum, val) => sum + val, 0) / normalizedValues.length;
        nationalityValue = avgValue;
        nationalityValuePercent = ((normalizeValue(player.player_trfm_value) - avgValue) / avgValue) * 100;
      }
    }

    // Calcular avg value para team level
    let teamLevelValue = null;
    let teamLevelValuePercent = null;
    if (teamLevel && player.player_trfm_value) {
      const teamLevelPlayers = await prisma.jugador.findMany({
        where: {
          team_level: teamLevel,
          player_trfm_value: { not: null, gt: 0 },
        },
        select: { player_trfm_value: true },
      });

      if (teamLevelPlayers.length > 0) {
        const normalizedValues = teamLevelPlayers.map(p => normalizeValue(p.player_trfm_value || 0));
        const avgValue = normalizedValues.reduce((sum, val) => sum + val, 0) / normalizedValues.length;
        teamLevelValue = avgValue;
        teamLevelValuePercent = ((normalizeValue(player.player_trfm_value) - avgValue) / avgValue) * 100;
      }
    }

    // Calcular avg value para competición
    let competitionValue = null;
    let competitionValuePercent = null;
    if (competition && player.player_trfm_value) {
      const competitionPlayers = await prisma.jugador.findMany({
        where: {
          team_competition: competition,
          player_trfm_value: { not: null, gt: 0 },
        },
        select: { player_trfm_value: true },
      });

      if (competitionPlayers.length > 0) {
        const normalizedValues = competitionPlayers.map(p => normalizeValue(p.player_trfm_value || 0));
        const avgValue = normalizedValues.reduce((sum, val) => sum + val, 0) / normalizedValues.length;
        competitionValue = avgValue;
        competitionValuePercent = ((normalizeValue(player.player_trfm_value) - avgValue) / avgValue) * 100;
      }
    }

    // Calcular avg value para competition level
    let competitionLevelValue = null;
    let competitionLevelValuePercent = null;
    if (competitionLevel && player.player_trfm_value) {
      const competitionLevelPlayers = await prisma.jugador.findMany({
        where: {
          competition_level: competitionLevel,
          player_trfm_value: { not: null, gt: 0 },
        },
        select: { player_trfm_value: true },
      });

      if (competitionLevelPlayers.length > 0) {
        const normalizedValues = competitionLevelPlayers.map(p => normalizeValue(p.player_trfm_value || 0));
        const avgValue = normalizedValues.reduce((sum, val) => sum + val, 0) / normalizedValues.length;
        competitionLevelValue = avgValue;
        competitionLevelValuePercent = ((normalizeValue(player.player_trfm_value) - avgValue) / avgValue) * 100;
      }
    }

    // Calcular avg value para owner club
    let ownerClubValue = null;
    let ownerClubValuePercent = null;
    if (ownerClub && player.player_trfm_value) {
      const ownerClubPlayers = await prisma.jugador.findMany({
        where: {
          owner_club: ownerClub,
          player_trfm_value: { not: null, gt: 0 },
        },
        select: { player_trfm_value: true },
      });

      if (ownerClubPlayers.length > 0) {
        const normalizedValues = ownerClubPlayers.map(p => normalizeValue(p.player_trfm_value || 0));
        const avgValue = normalizedValues.reduce((sum, val) => sum + val, 0) / normalizedValues.length;
        ownerClubValue = avgValue;
        ownerClubValuePercent = ((normalizeValue(player.player_trfm_value) - avgValue) / avgValue) * 100;
      }
    }

    // Actualizar el jugador con los valores calculados
    const updatedPlayer = await prisma.jugador.update({
      where: { id_player: playerId },
      data: {
        position_value: positionValue,
        position_value_percent: positionValuePercent,
        nationality_value: nationalityValue,
        nationality_value_percent: nationalityValuePercent,
        team_level_value: teamLevelValue,
        team_level_value_percent: teamLevelValuePercent,
        team_competition_value: competitionValue,
        team_competition_value_percent: competitionValuePercent,
        competition_level_value: competitionLevelValue,
        competition_level_value_percent: competitionLevelValuePercent,
        owner_club_value: ownerClubValue,
        owner_club_value_percent: ownerClubValuePercent,
      },
    });

    return NextResponse.json({
      success: true,
      values: {
        position_value: positionValue,
        position_value_percent: positionValuePercent,
        nationality_value: nationalityValue,
        nationality_value_percent: nationalityValuePercent,
        team_level_value: teamLevelValue,
        team_level_value_percent: teamLevelValuePercent,
        team_competition_value: competitionValue,
        team_competition_value_percent: competitionValuePercent,
        competition_level_value: competitionLevelValue,
        competition_level_value_percent: competitionLevelValuePercent,
        owner_club_value: ownerClubValue,
        owner_club_value_percent: ownerClubValuePercent,
      },
    });
  } catch (error) {
    console.error("Error calculating avg values:", error);
    return NextResponse.json(
      { error: "Failed to calculate avg values" },
      { status: 500 }
    );
  }
}
