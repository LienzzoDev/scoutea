"use client";

import { Badge } from "@/components/ui/badge";
import TeamBadge from "@/components/ui/team-badge";
import { usePlayerAvgValues } from "@/hooks/player/usePlayerAvgValues";
import { formatMoneyFull } from "@/lib/utils/format-money";
import type { Player } from "@/types/player";

interface PlayerInfoProps {
  player: Player;
}

// Función helper para mostrar datos con fallback a campos correctos
const getDisplayValue = (primary?: string | number | null, correct?: string | number | null, fallback: string = "Not set"): string => {
  if (primary !== null && primary !== undefined && primary !== "") return String(primary);
  if (correct !== null && correct !== undefined && correct !== "") return String(correct);
  return fallback;
};

// Cada sección visual: tarjeta única gris con filas internas consistentes.
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      {children}
    </div>
  );
}

// Fila simple label:valor.
function Row({ label, value, valueNode }: { label: string; value?: React.ReactNode; valueNode?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#6d6d6d] text-sm">{label}:</span>
      {valueNode ?? <span className="font-medium text-[#2e3138]">{value}</span>}
    </div>
  );
}

// Fila con valor monetario + badge de variación porcentual.
// `invertColors` intercambia rojo/verde cuando un % positivo es "peor" (p.ej. valor sobre la media).
function ValueRow({
  label,
  loading,
  value,
  percent,
  invertColors = false,
}: {
  label: string;
  loading: boolean;
  value?: number | null;
  percent?: number | null;
  invertColors?: boolean;
}) {
  const showPercent = percent !== null && percent !== undefined && Math.abs(percent) < 1000;
  const positiveClass = invertColors ? 'bg-[#3cc500]' : 'bg-red-500';
  const negativeClass = invertColors ? 'bg-red-500' : 'bg-[#3cc500]';
  const positiveText = invertColors ? 'text-[#3cc500]' : 'text-red-500';
  const negativeText = invertColors ? 'text-red-500' : 'text-[#3cc500]';

  return (
    <div className="flex justify-between items-center">
      <span className="text-[#6d6d6d] text-sm">{label}:</span>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="font-medium text-[#2e3138]">
            {loading ? "Calculating..." : value ? formatMoneyFull(value) : "To calculate"}
          </div>
          {showPercent && (
            <div className={`text-xs ${
              percent! > 0 ? positiveText : percent! < 0 ? negativeText : 'text-gray-500'
            }`}>
              ({percent! > 0 ? '+' : ''}{percent!.toFixed(1)}%)
            </div>
          )}
        </div>
        {showPercent && (
          <Badge className={`text-white text-xs px-1 py-0 ${
            percent! > 0 ? positiveClass : percent! < 0 ? negativeClass : 'bg-gray-500'
          }`}>
            {percent! > 0 ? '▲' : percent! < 0 ? '▼' : '●'}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function PlayerInfo({ player }: PlayerInfoProps) {
  const { avgValues, loading: avgLoading } = usePlayerAvgValues(player);

  const teamName = getDisplayValue(player.correct_team_name, player.team_name);
  const contractEnd = player.correct_contract_end || player.contract_end;
  const dateOfBirth = player.correct_date_of_birth || player.date_of_birth;

  return (
    <div className="bg-white p-6">
      <div className="grid grid-cols-2 gap-x-12 gap-y-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Personal */}
          <Section>
            <Row
              label="Name"
              value={getDisplayValue(player.complete_player_name, player.player_name, "Name not set")}
            />
            <Row
              label="Date of Birth"
              value={dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('en-US') : "Not set"}
            />
            <Row label="Age" value={player.age ? `${player.age} years` : "Not set"} />
            <ValueRow
              label="Avg Value by Age"
              loading={avgLoading}
              value={avgValues.age_value}
              percent={avgValues.age_value_percent}
            />
          </Section>

          {/* Físico */}
          <Section>
            <Row
              label="Position"
              value={getDisplayValue(player.correct_position_player, player.position_player)}
            />
            <ValueRow
              label="Avg Value by Position"
              loading={avgLoading}
              value={avgValues.position_value}
              percent={avgValues.position_value_percent}
            />
            <Row
              label="Preferred Foot"
              value={getDisplayValue(player.correct_foot, player.foot)}
            />
            <Row
              label="Height"
              value={(player.correct_height || player.height) ? `${player.correct_height || player.height} cm` : "Not set"}
            />
          </Section>

          {/* Nacionalidad */}
          <Section>
            <Row
              label="Nationality"
              value={getDisplayValue(player.correct_nationality_1, player.nationality_1)}
            />
            <ValueRow
              label="Avg Value by Nationality"
              loading={avgLoading}
              value={avgValues.nationality_value}
              percent={avgValues.nationality_value_percent}
            />
            <Row
              label="Second Nationality"
              value={getDisplayValue(player.correct_nationality_2, player.nationality_2, "N/A")}
            />
            <Row
              label="National tier"
              value={getDisplayValue(player.correct_national_tier, player.national_tier)}
            />
          </Section>

          {/* Agente */}
          <Section>
            <Row
              label="Agent"
              value={getDisplayValue(player.correct_agency, player.agency)}
            />
          </Section>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Equipo + Préstamo + Contrato */}
          <Section>
            <Row
              label="Team"
              valueNode={
                <span className="font-medium text-[#2e3138] flex items-center gap-2">
                  {player.team_name && <TeamBadge teamName={player.team_name} size="sm" />}
                  {teamName}
                </span>
              }
            />
            <Row label="Team Country" value={getDisplayValue(player.team_country, null)} />
            <Row label="Team Level" value={getDisplayValue(player.team_level, null)} />
            <ValueRow
              label="Avg Value by Team"
              loading={avgLoading}
              value={avgValues.team_competition_value}
              percent={avgValues.team_competition_value_percent}
              invertColors
            />
            <Row
              label="On Loan"
              value={player.on_loan === true ? "Yes" : player.on_loan === false ? "No" : "To confirm"}
            />
            {player.on_loan && (
              <>
                <Row label="Owner Club" value={getDisplayValue(player.owner_club, null)} />
                <ValueRow
                  label="Avg Value"
                  loading={avgLoading}
                  value={avgValues.owner_club_value}
                  percent={avgValues.owner_club_value_percent}
                  invertColors
                />
                <Row label="Owner Country" value={getDisplayValue(player.owner_club_country, null)} />
              </>
            )}
            <Row
              label="Contract End"
              value={contractEnd ? new Date(contractEnd).toLocaleDateString('en-US') : "Not set"}
            />
          </Section>

          {/* Competición */}
          <Section>
            <Row label="Competition" value={getDisplayValue(player.team_competition, null)} />
            <ValueRow
              label="Avg Value by competition"
              loading={avgLoading}
              value={avgValues.team_competition_value}
              percent={avgValues.team_competition_value_percent}
              invertColors
            />
            <Row label="Competition Country" value={getDisplayValue(player.competition_country, null)} />
            <Row label="Competition Tier" value={getDisplayValue(player.competition_tier, null)} />
            <Row label="Competition Level" value={getDisplayValue(player.competition_level, null)} />
            <ValueRow
              label="Avg Value by competition level"
              loading={avgLoading}
              value={avgValues.competition_level_value}
              percent={avgValues.competition_level_value_percent}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
