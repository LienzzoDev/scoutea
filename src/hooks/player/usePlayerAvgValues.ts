import { useEffect, useState } from "react";

import type { Player } from "@/types/player";

interface AvgValues {
  position_value?: number | null;
  position_value_percent?: number | null;
  nationality_value?: number | null;
  nationality_value_percent?: number | null;
  team_level_value?: number | null;
  team_level_value_percent?: number | null;
  team_competition_value?: number | null;
  team_competition_value_percent?: number | null;
  competition_level_value?: number | null;
  competition_level_value_percent?: number | null;
  owner_club_value?: number | null;
  owner_club_value_percent?: number | null;
}

export function usePlayerAvgValues(player: Player) {
  const [avgValues, setAvgValues] = useState<AvgValues>({
    position_value: player.position_value,
    position_value_percent: player.position_value_percent,
    nationality_value: player.nationality_value,
    nationality_value_percent: player.nationality_value_percent,
    team_level_value: player.team_level_value,
    team_level_value_percent: player.team_level_value_percent,
    team_competition_value: player.team_competition_value,
    team_competition_value_percent: player.team_competition_value_percent,
    competition_level_value: player.competition_level_value,
    competition_level_value_percent: player.competition_level_value_percent,
    owner_club_value: player.owner_club_value,
    owner_club_value_percent: player.owner_club_value_percent,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🔍 Valores actuales del jugador:', {
      position_value: player.position_value,
      nationality_value: player.nationality_value,
      team_competition_value: player.team_competition_value,
      competition_level_value: player.competition_level_value,
    });

    // Verificar si los valores parecen incorrectos (demasiado grandes - formato antiguo en euros)
    const hasInvalidValues =
      (player.position_value && player.position_value > 1000) ||
      (player.nationality_value && player.nationality_value > 1000) ||
      (player.team_competition_value && player.team_competition_value > 1000) ||
      (player.competition_level_value && player.competition_level_value > 1000);

    console.log('⚠️ Tiene valores inválidos?', hasInvalidValues);

    // Verificar si faltan valores
    const missingValues =
      !player.position_value ||
      !player.nationality_value ||
      !player.team_competition_value ||
      !player.competition_level_value;

    console.log('❓ Faltan valores?', missingValues);

    // Recalcular si faltan valores o si los valores parecen incorrectos
    if ((missingValues || hasInvalidValues) && player.id_player) {
      console.log('🔄 Recalculando avg values para jugador:', player.id_player);
      setLoading(true);
      fetch(`/api/players/${player.id_player}/calculate-avg-values`, {
        method: "POST",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('📦 Respuesta de la API:', data);
          if (data.success) {
            console.log('✅ Avg values recalculados:', data.values);
            setAvgValues(data.values);
          }
        })
        .catch((error) => {
          console.error("❌ Error calculating avg values:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      console.log('✋ No se necesita recalcular, usando valores existentes');
    }
  }, [player.id_player, player.position_value, player.nationality_value]);

  return { avgValues, loading };
}
