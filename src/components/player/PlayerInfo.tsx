import { Badge } from "@/components/ui/badge";
import { MarketValueService } from "@/lib/services/market-value-service";
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
  return (
    <div className="bg-white p-6">
      <div className="grid grid-cols-2 gap-x-16">
        {/* Left Column */}
        <div className="space-y-0">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Nombre:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.complete_player_name, player.player_name, "Nombre por completar")}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Fecha de Nacimiento:</span>
            <span className="font-medium text-[#2e3138]">
              {(player.correct_date_of_birth || player.date_of_birth)
                ? new Date(player.correct_date_of_birth || player.date_of_birth!).toLocaleDateString('es-ES')
                : "Por completar"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Edad:</span>
            <span className="font-medium text-[#2e3138]">
              {player.age ? `${player.age} años` : "Por completar"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Valor de Mercado:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#2e3138]">
                {MarketValueService.formatValue(player.player_trfm_value)}
                {(() => {
                  const change = MarketValueService.formatPercentageChange(player.trfm_value_change_percent);
                  if (!change.isNeutral && change.text) {
                    return (
                      <span className={`ml-1 text-xs ${change.color}`}>
                        ({change.text})
                      </span>
                    );
                  }
                  return null;
                })()}
              </span>
              {player.trfm_value_change_percent !== null && player.trfm_value_change_percent !== undefined && (
                <Badge className={`text-white text-xs px-1 py-0 ${
                  player.trfm_value_change_percent > 0 
                    ? 'bg-[#3cc500]' 
                    : player.trfm_value_change_percent < 0 
                    ? 'bg-red-500' 
                    : 'bg-gray-500'
                }`}>
                  {MarketValueService.formatPercentageChange(player.trfm_value_change_percent).arrow}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Posición:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_position_player, player.position_player)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Pie Preferido:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_foot, player.foot)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Altura:</span>
            <span className="font-medium text-[#2e3138]">
              {(player.correct_height || player.height) 
                ? `${player.correct_height || player.height} cm` 
                : "Por completar"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Nacionalidad:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_nationality_1, player.nationality_1)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Segunda Nacionalidad:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_nationality_2, player.nationality_2, "No aplica")}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Nivel Nacional:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_national_tier, player.national_tier)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-[#6d6d6d] text-sm">Agente:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_agency, player.agency)}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-0">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Equipo:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.correct_team_name, player.team_name)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">País del Equipo:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.team_country, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Nivel del Equipo:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.team_level, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">ELO del Equipo:</span>
            <span className="font-medium text-[#2e3138]">
              {player.team_elo ? Math.round(player.team_elo).toString() : "Por calcular"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">En Préstamo:</span>
            <span className="font-medium text-[#2e3138]">
              {player.on_loan === true ? "Sí" : player.on_loan === false ? "No" : "Por confirmar"}
            </span>
          </div>
          {/* Solo mostrar Club Propietario y País Propietario si está en préstamo */}
          {player.on_loan && (
            <>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-[#6d6d6d] text-sm">Club Propietario:</span>
                <span className="font-medium text-[#2e3138]">
                  {getDisplayValue(player.owner_club, null)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-[#6d6d6d] text-sm">País Propietario:</span>
                <span className="font-medium text-[#2e3138]">
                  {getDisplayValue(player.owner_club_country, null)}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Fin de Contrato:</span>
            <span className="font-medium text-[#2e3138]">
              {(player.correct_contract_end || player.contract_end)
                ? new Date(player.correct_contract_end || player.contract_end!).toLocaleDateString('es-ES')
                : "Por completar"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Competición:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.team_competition, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">País de Competición:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.competition_country, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Tier de Competición:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.competition_tier, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-[#6d6d6d] text-sm">Nivel de Competición:</span>
            <span className="font-medium text-[#2e3138]">
              {getDisplayValue(player.competition_level, null)}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-[#6d6d6d] text-sm">Rating del Jugador:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#2e3138]">
                {player.player_rating ? `${player.player_rating}/100` : "Por evaluar"}
              </span>
              {player.player_rating && player.player_rating >= 80 && (
                <Badge className="bg-[#3cc500] text-white text-xs px-1 py-0">
                  ⭐
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
