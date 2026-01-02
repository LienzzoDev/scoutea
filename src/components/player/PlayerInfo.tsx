"use client";

import { Badge } from "@/components/ui/badge";
import { usePlayerAvgValues } from "@/hooks/player/usePlayerAvgValues";
import { formatMoneyFull } from "@/lib/utils/format-money";
import type { Player } from "@/types/player";

interface PlayerInfoProps {
  player: Player;
}

// Función helper para mostrar datos con fallback a campos correctos
const getDisplayValue = (primary?: string | number | null, correct?: string | number | null, fallback: string = "Por completar"): string => {
  if (primary !== null && primary !== undefined && primary !== "") return String(primary);
  if (correct !== null && correct !== undefined && correct !== "") return String(correct);
  return fallback;
};

export default function PlayerInfo({ player }: PlayerInfoProps) {
  const { avgValues, loading: avgLoading } = usePlayerAvgValues(player);
  return (
    <div className="bg-white p-6">
      <div className="grid grid-cols-2 gap-x-16">
        {/* Left Column */}
        <div className="space-y-0">
          {/* Sección: Información Personal */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Nombre:</span>
              <span className="font-medium text-[#2e3138]">
                {getDisplayValue(player.complete_player_name, player.player_name, "Nombre por completar")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Fecha de Nacimiento:</span>
              <span className="font-medium text-[#2e3138]">
                {(player.correct_date_of_birth || player.date_of_birth)
                  ? new Date(player.correct_date_of_birth || player.date_of_birth!).toLocaleDateString('es-ES')
                  : "Por completar"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Edad:</span>
              <span className="font-medium text-[#2e3138]">
                {player.age ? `${player.age} años` : "Por completar"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Avg Value by Age:</span>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-medium text-[#2e3138]">
                    {avgLoading ? "Calculando..." : avgValues.age_value ? formatMoneyFull(avgValues.age_value) : "Por calcular"}
                  </div>
                  {avgValues.age_value_percent !== null && avgValues.age_value_percent !== undefined && Math.abs(avgValues.age_value_percent) < 1000 && (
                    <div className={`text-xs ${
                      avgValues.age_value_percent > 0 ? 'text-red-500' : avgValues.age_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                    }`}>
                      ({avgValues.age_value_percent > 0 ? '+' : ''}{avgValues.age_value_percent.toFixed(1)}%)
                    </div>
                  )}
                </div>
                {avgValues.age_value_percent !== null && avgValues.age_value_percent !== undefined && Math.abs(avgValues.age_value_percent) < 1000 && (
                  <Badge className={`text-white text-xs px-1 py-0 ${
                    avgValues.age_value_percent > 0
                      ? 'bg-red-500'
                      : avgValues.age_value_percent < 0
                      ? 'bg-[#3cc500]'
                      : 'bg-gray-500'
                  }`}>
                    {avgValues.age_value_percent > 0 ? '▲' : avgValues.age_value_percent < 0 ? '▼' : '●'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Espacio entre secciones */}
          <div className="h-4"></div>

          {/* Sección: Características Físicas */}
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Posición:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_position_player, player.position_player)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Avg Value by Position:</span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium text-[#2e3138]">
                  {avgLoading ? "Calculando..." : avgValues.position_value ? formatMoneyFull(avgValues.position_value) : "Por calcular"}
                </div>
                {avgValues.position_value_percent !== null && avgValues.position_value_percent !== undefined && Math.abs(avgValues.position_value_percent) < 1000 && (
                  <div className={`text-xs ${
                    avgValues.position_value_percent > 0 ? 'text-red-500' : avgValues.position_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                  }`}>
                    ({avgValues.position_value_percent > 0 ? '+' : ''}{avgValues.position_value_percent.toFixed(1)}%)
                  </div>
                )}
              </div>
              {avgValues.position_value_percent !== null && avgValues.position_value_percent !== undefined && Math.abs(avgValues.position_value_percent) < 1000 && (
                <Badge className={`text-white text-xs px-1 py-0 ${
                  avgValues.position_value_percent > 0
                    ? 'bg-red-500'
                    : avgValues.position_value_percent < 0
                    ? 'bg-[#3cc500]'
                    : 'bg-gray-500'
                }`}>
                  {avgValues.position_value_percent > 0 ? '▲' : avgValues.position_value_percent < 0 ? '▼' : '●'}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Pie Preferido:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_foot, player.foot)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Altura:</span>
            <span className="font-medium text-[#2e3138]">
              {(player.correct_height || player.height)
                ? `${player.correct_height || player.height} cm`
                : "Por completar"}
            </span>
          </div>

          {/* Espacio entre secciones */}
          <div className="h-4"></div>

          {/* Sección: Nacionalidad */}
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Nacionalidad:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_nationality_1, player.nationality_1)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Avg Value by Nationality:</span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium text-[#2e3138]">
                  {avgLoading ? "Calculando..." : avgValues.nationality_value ? formatMoneyFull(avgValues.nationality_value) : "Por calcular"}
                </div>
                {avgValues.nationality_value_percent !== null && avgValues.nationality_value_percent !== undefined && Math.abs(avgValues.nationality_value_percent) < 1000 && (
                  <div className={`text-xs ${
                    avgValues.nationality_value_percent > 0 ? 'text-red-500' : avgValues.nationality_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                  }`}>
                    ({avgValues.nationality_value_percent > 0 ? '+' : ''}{avgValues.nationality_value_percent.toFixed(1)}%)
                  </div>
                )}
              </div>
              {avgValues.nationality_value_percent !== null && avgValues.nationality_value_percent !== undefined && Math.abs(avgValues.nationality_value_percent) < 1000 && (
                <Badge className={`text-white text-xs px-1 py-0 ${
                  avgValues.nationality_value_percent > 0
                    ? 'bg-red-500'
                    : avgValues.nationality_value_percent < 0
                    ? 'bg-[#3cc500]'
                    : 'bg-gray-500'
                }`}>
                  {avgValues.nationality_value_percent > 0 ? '▲' : avgValues.nationality_value_percent < 0 ? '▼' : '●'}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Segunda nacionalidad:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_nationality_2, player.nationality_2, "No aplica")}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Nivel nacional:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_national_tier, player.national_tier)}
            </span>
          </div>

          {/* Espacio entre secciones */}
          <div className="h-4"></div>

          {/* Sección: Agente */}
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Agente:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_agency, player.agency)}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-0">
          {/* Sección: Equipo */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Equipo:</span>
              <span className="font-medium text-[#2e3138]">
                {getDisplayValue(player.correct_team_name, player.team_name)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">País del Equipo:</span>
              <span className="font-medium text-[#2e3138]">
                {getDisplayValue(player.team_country, null)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Nivel del Equipo:</span>
              <span className="font-medium text-[#2e3138]">
                {getDisplayValue(player.team_level, null)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#6d6d6d] text-sm">Avg Value by Team:</span>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-medium text-[#2e3138]">
                    {avgLoading ? "Calculando..." : avgValues.team_competition_value ? formatMoneyFull(avgValues.team_competition_value) : "Por calcular"}
                  </div>
                  {avgValues.team_competition_value_percent !== null && avgValues.team_competition_value_percent !== undefined && Math.abs(avgValues.team_competition_value_percent) < 1000 && (
                    <div className={`text-xs ${
                      avgValues.team_competition_value_percent > 0 ? 'text-red-500' : avgValues.team_competition_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                    }`}>
                      ({avgValues.team_competition_value_percent > 0 ? '+' : ''}{avgValues.team_competition_value_percent.toFixed(1)}%)
                    </div>
                  )}
                </div>
                {avgValues.team_competition_value_percent !== null && avgValues.team_competition_value_percent !== undefined && Math.abs(avgValues.team_competition_value_percent) < 1000 && (
                  <Badge className={`text-white text-xs px-1 py-0 ${
                    avgValues.team_competition_value_percent > 0
                      ? 'bg-[#3cc500]' // Inverted
                      : avgValues.team_competition_value_percent < 0
                      ? 'bg-red-500' // Inverted
                      : 'bg-gray-500'
                  }`}>
                    {avgValues.team_competition_value_percent > 0 ? '▲' : avgValues.team_competition_value_percent < 0 ? '▼' : '●'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Espacio entre secciones */}
          <div className="h-4"></div>

          {/* Sección: Préstamo y Club Propietario */}
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">En Préstamo:</span>
            <span className="font-medium text-[#2e3138]">
              {player.on_loan === true ? "Sí" : player.on_loan === false ? "No" : "Por confirmar"}
            </span>
          </div>
          {player.on_loan && (
            <>
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
                <span className="text-[#6d6d6d] text-sm">Club Propietario:</span>
                <span className="font-medium text-[#2e3138]">
                  {getDisplayValue(player.owner_club, null)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
                <span className="text-[#6d6d6d] text-sm">Avg Value:</span>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-medium text-[#2e3138]">
                      {avgLoading ? "Calculando..." : avgValues.owner_club_value ? formatMoneyFull(avgValues.owner_club_value) : "Por calcular"}
                    </div>
                    {avgValues.owner_club_value_percent !== null && avgValues.owner_club_value_percent !== undefined && Math.abs(avgValues.owner_club_value_percent) < 1000 && (
                      <div className={`text-xs ${
                        avgValues.owner_club_value_percent > 0 ? 'text-red-500' : avgValues.owner_club_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                      }`}>
                        ({avgValues.owner_club_value_percent > 0 ? '+' : ''}{avgValues.owner_club_value_percent.toFixed(1)}%)
                      </div>
                    )}
                  </div>
                  {avgValues.owner_club_value_percent !== null && avgValues.owner_club_value_percent !== undefined && Math.abs(avgValues.owner_club_value_percent) < 1000 && (
                    <Badge className={`text-white text-xs px-1 py-0 ${
                      avgValues.owner_club_value_percent > 0
                        ? 'bg-[#3cc500]' // Inverted
                        : avgValues.owner_club_value_percent < 0
                        ? 'bg-red-500' // Inverted
                        : 'bg-gray-500'
                    }`}>
                      {avgValues.owner_club_value_percent > 0 ? '▲' : avgValues.owner_club_value_percent < 0 ? '▼' : '●'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
                <span className="text-[#6d6d6d] text-sm">País Propietario:</span>
                <span className="font-medium text-[#2e3138]">
                  {getDisplayValue(player.owner_club_country, null)}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Fin de Contrato:</span>
            <span className="font-medium text-[#2e3138]">
              {(player.correct_contract_end || player.contract_end)
                ? new Date(player.correct_contract_end || player.contract_end!).toLocaleDateString('es-ES')
                : "Por completar"}
            </span>
          </div>

          {/* Espacio entre secciones */}
          <div className="h-4"></div>

          {/* Sección: Competición */}
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Competición:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.team_competition, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Avg Value by competition:</span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium text-[#2e3138]">
                  {avgLoading ? "Calculando..." : avgValues.team_competition_value ? formatMoneyFull(avgValues.team_competition_value) : "Por calcular"}
                </div>
                {avgValues.team_competition_value_percent !== null && avgValues.team_competition_value_percent !== undefined && Math.abs(avgValues.team_competition_value_percent) < 1000 && (
                  <div className={`text-xs ${
                    avgValues.team_competition_value_percent > 0 ? 'text-red-500' : avgValues.team_competition_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                  }`}>
                    ({avgValues.team_competition_value_percent > 0 ? '+' : ''}{avgValues.team_competition_value_percent.toFixed(1)}%)
                  </div>
                )}
              </div>
              {avgValues.team_competition_value_percent !== null && avgValues.team_competition_value_percent !== undefined && Math.abs(avgValues.team_competition_value_percent) < 1000 && (
                <Badge className={`text-white text-xs px-1 py-0 ${
                  avgValues.team_competition_value_percent > 0
                    ? 'bg-[#3cc500]'
                    : avgValues.team_competition_value_percent < 0
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}>
                  {avgValues.team_competition_value_percent > 0 ? '▲' : avgValues.team_competition_value_percent < 0 ? '▼' : '●'}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">País de Competición:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.competition_country, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Tier de Competición:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.competition_tier, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Nivel de Competición:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.competition_level, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mb-2">
            <span className="text-[#6d6d6d] text-sm">Avg Value by competition level:</span>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="font-medium text-[#2e3138]">
                  {avgLoading ? "Calculando..." : avgValues.competition_level_value ? formatMoneyFull(avgValues.competition_level_value) : "Por calcular"}
                </div>
                {avgValues.competition_level_value_percent !== null && avgValues.competition_level_value_percent !== undefined && Math.abs(avgValues.competition_level_value_percent) < 1000 && (
                  <div className={`text-xs ${
                    avgValues.competition_level_value_percent > 0 ? 'text-red-500' : avgValues.competition_level_value_percent < 0 ? 'text-[#3cc500]' : 'text-gray-500'
                  }`}>
                    ({avgValues.competition_level_value_percent > 0 ? '+' : ''}{avgValues.competition_level_value_percent.toFixed(1)}%)
                  </div>
                )}
              </div>
              {avgValues.competition_level_value_percent !== null && avgValues.competition_level_value_percent !== undefined && Math.abs(avgValues.competition_level_value_percent) < 1000 && (
                <Badge className={`text-white text-xs px-1 py-0 ${
                  avgValues.competition_level_value_percent > 0
                    ? 'bg-red-500'
                    : avgValues.competition_level_value_percent < 0
                    ? 'bg-[#3cc500]'
                    : 'bg-gray-500'
                }`}>
                  {avgValues.competition_level_value_percent > 0 ? '▲' : avgValues.competition_level_value_percent < 0 ? '▼' : '●'}
                </Badge>
              )}
            </div>
          </div>

          {/* Espacio entre secciones */}
          <div className="h-4"></div>


        </div>
      </div>
    </div>
  );
}
