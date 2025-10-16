"use client";

import { ArrowUpDown, ArrowUp, ArrowDown, Edit, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo, memo } from "react";

import EditableCell from "@/components/admin/EditableCell";
import { Button } from "@/components/ui/button";
import type { Player } from "@/types/player";

interface AdminPlayerTableProps {
  players: Player[];
  selectedColumns: string[];
  loading?: boolean;
}

type SortField = keyof Player | null;
type SortOrder = 'asc' | 'desc';

// Función para determinar el tipo de campo automáticamente
const getFieldType = (fieldName: string): 'text' | 'number' | 'boolean' | 'url' | 'date' => {
  // Campos de URL
  if (fieldName.startsWith('url_') || fieldName === 'video') {
    return 'url';
  }

  // Campos de fecha
  const dateFields = ['date_of_birth', 'correct_date_of_birth', 'contract_end', 'correct_contract_end',
                      'previous_trfm_value_date', 'trfm_value_last_updated'];
  if (dateFields.includes(fieldName)) {
    return 'date';
  }

  // Campos booleanos
  if (fieldName === 'on_loan') {
    return 'boolean';
  }

  // Campos numéricos (que incluyen value, elo, coeff, rating, norm, pts, ranking, etc.)
  if (fieldName.includes('value') || fieldName.includes('elo') || fieldName.includes('coeff') ||
      fieldName.includes('rating') || fieldName.includes('norm') || fieldName.includes('pts') ||
      fieldName.includes('ranking') || fieldName.includes('percent') || fieldName.includes('level') ||
      fieldName === 'age' || fieldName === 'height' || fieldName === 'correct_height' ||
      fieldName === 'player_elo' || fieldName === 'stats_evo_3m' || fieldName === 'community_potential') {
    return 'number';
  }

  // Por defecto, texto
  return 'text';
};

// Campos NO editables (campos calculados automáticamente o de solo lectura)
const NON_EDITABLE_FIELDS = new Set([
  'id_player',
  'stats_evo_3m', // Procede de BD Stats
  'total_fmi_pts_norm', // Procede de BD Attributes
  'createdAt',
  'updatedAt'
]);

// Definición de todas las columnas (sin player_name que será columna fija)
const COLUMN_DEFINITIONS = [
  { key: 'id_player', label: 'ID Player', width: '120px' },
  { key: 'wyscout_id_1', label: 'Wyscout ID 1', width: '120px' },
  { key: 'wyscout_id_2', label: 'Wyscout ID 2', width: '120px' },
  { key: 'wyscout_name_1', label: 'Wyscout Name 1', width: '160px' },
  { key: 'wyscout_name_2', label: 'Wyscout Name 2', width: '160px' },
  { key: 'id_fmi', label: 'ID FMI', width: '100px' },
  { key: 'player_rating', label: 'Player Rating', width: '120px' },
  { key: 'photo_coverage', label: 'Photo Coverage', width: '130px' },
  { key: 'url_trfm_advisor', label: 'URL TRFM Advisor', width: '150px' },
  { key: 'url_trfm', label: 'URL TRFM', width: '120px' },
  { key: 'url_secondary', label: 'URL Secondary', width: '130px' },
  { key: 'url_instagram', label: 'URL Instagram', width: '130px' },
  { key: 'date_of_birth', label: 'Date of Birth', width: '120px' },
  { key: 'correct_date_of_birth', label: 'Correct Date of Birth', width: '170px' },
  { key: 'age', label: 'Age', width: '80px' },
  { key: 'age_value', label: 'Age Value', width: '100px' },
  { key: 'age_value_percent', label: 'Age Value %', width: '110px' },
  { key: 'age_coeff', label: 'Age Coeff', width: '100px' },
  { key: 'pre_team', label: 'Pre Team', width: '150px' },
  { key: 'team_name', label: 'Team Name', width: '180px' },
  { key: 'correct_team_name', label: 'Correct Team Name', width: '180px' },
  { key: 'team_country', label: 'Team Country', width: '130px' },
  { key: 'team_elo', label: 'Team ELO', width: '100px' },
  { key: 'team_level', label: 'Team Level', width: '110px' },
  { key: 'team_level_value', label: 'Team Level Value', width: '150px' },
  { key: 'team_level_value_percent', label: 'Team Level Value %', width: '160px' },
  { key: 'team_competition', label: 'Team Competition', width: '160px' },
  { key: 'competition_country', label: 'Competition Country', width: '170px' },
  { key: 'team_competition_value', label: 'Team Competition Value', width: '180px' },
  { key: 'team_competition_value_percent', label: 'Team Competition Value %', width: '200px' },
  { key: 'competition_tier', label: 'Competition Tier', width: '140px' },
  { key: 'competition_confederation', label: 'Competition Confederation', width: '200px' },
  { key: 'competition_elo', label: 'Competition ELO', width: '140px' },
  { key: 'competition_level', label: 'Competition Level', width: '150px' },
  { key: 'competition_level_value', label: 'Competition Level Value', width: '190px' },
  { key: 'competition_level_value_percent', label: 'Competition Level Value %', width: '210px' },
  { key: 'owner_club', label: 'Owner Club', width: '150px' },
  { key: 'owner_club_country', label: 'Owner Club Country', width: '170px' },
  { key: 'owner_club_value', label: 'Owner Club Value', width: '150px' },
  { key: 'owner_club_value_percent', label: 'Owner Club Value %', width: '170px' },
  { key: 'pre_team_loan_from', label: 'Pre Team Loan From', width: '160px' },
  { key: 'team_loan_from', label: 'Team Loan From', width: '150px' },
  { key: 'correct_team_loan_from', label: 'Correct Team Loan From', width: '190px' },
  { key: 'on_loan', label: 'On Loan', width: '90px' },
  { key: 'complete_player_name', label: 'Complete Player Name', width: '190px' },
  { key: 'position_player', label: 'Position Player', width: '140px' },
  { key: 'correct_position_player', label: 'Correct Position Player', width: '190px' },
  { key: 'position_value', label: 'Position Value', width: '130px' },
  { key: 'position_value_percent', label: 'Position Value %', width: '150px' },
  { key: 'foot', label: 'Foot', width: '80px' },
  { key: 'correct_foot', label: 'Correct Foot', width: '110px' },
  { key: 'height', label: 'Height', width: '90px' },
  { key: 'correct_height', label: 'Correct Height', width: '130px' },
  { key: 'nationality_1', label: 'Nationality 1', width: '130px' },
  { key: 'correct_nationality_1', label: 'Correct Nationality 1', width: '180px' },
  { key: 'nationality_value', label: 'Nationality Value', width: '150px' },
  { key: 'nationality_value_percent', label: 'Nationality Value %', width: '170px' },
  { key: 'nationality_2', label: 'Nationality 2', width: '130px' },
  { key: 'correct_nationality_2', label: 'Correct Nationality 2', width: '180px' },
  { key: 'national_tier', label: 'National Tier', width: '120px' },
  { key: 'rename_national_tier', label: 'Rename National Tier', width: '180px' },
  { key: 'correct_national_tier', label: 'Correct National Tier', width: '180px' },
  { key: 'agency', label: 'Agency', width: '150px' },
  { key: 'correct_agency', label: 'Correct Agency', width: '150px' },
  { key: 'contract_end', label: 'Contract End', width: '120px' },
  { key: 'correct_contract_end', label: 'Correct Contract End', width: '170px' },
  { key: 'player_trfm_value', label: 'Player TRFM Value', width: '160px' },
  { key: 'player_trfm_value_norm', label: 'Player TRFM Value Norm', width: '190px' },
  { key: 'stats_evo_3m', label: 'Stats Evo 3M', width: '130px' },
  { key: 'player_rating_norm', label: 'Player Rating Norm', width: '160px' },
  { key: 'total_fmi_pts_norm', label: 'Total FMI Pts Norm', width: '160px' },
  { key: 'player_elo', label: 'Player ELO', width: '110px' },
  { key: 'player_level', label: 'Player Level', width: '120px' },
  { key: 'player_ranking', label: 'Player Ranking', width: '140px' },
  { key: 'community_potential', label: 'Community Potential', width: '170px' },
  { key: 'video', label: 'Video', width: '100px' },
  { key: 'existing_club', label: 'Existing Club', width: '140px' },
] as const;

const AdminPlayerTable = memo(function AdminPlayerTable({ players, selectedColumns, loading = false }: AdminPlayerTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Filtrar columnas para mostrar solo las seleccionadas
  const visibleColumns = useMemo(() => {
    return COLUMN_DEFINITIONS.filter(col => selectedColumns.includes(col.key));
  }, [selectedColumns]);

  // Función para guardar cambios en campos editables
  const handleSaveField = async (
    playerId: string,
    fieldName: string,
    value: string | number | boolean
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [fieldName]: value
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el campo');
      }

      // Recargar la página para mostrar los cambios
      router.refresh();

      return true;
    } catch (error) {
      console.error('Error saving field:', error);
      return false;
    }
  };

  // Función para manejar el ordenamiento
  const handleSort = (field: keyof Player) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Ordenar jugadores
  const sortedPlayers = useMemo(() => {
    if (!sortField) return players;

    return [...players].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [players, sortField, sortOrder]);

  // Función para formatear valores
  const formatValue = (value: unknown, key: string): string => {
    if (value === null || value === undefined) return 'N/A';

    // Campos de fecha que deben formatearse
    const dateFields = ['date_of_birth', 'correct_date_of_birth', 'contract_end', 'correct_contract_end',
                        'previous_trfm_value_date', 'trfm_value_last_updated', 'createdAt', 'updatedAt'];

    if (dateFields.includes(key) && typeof value === 'string') {
      // Convertir string ISO a Date y formatear
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-ES');
      }
    }

    if (value instanceof Date) {
      // Mostrar solo fecha sin hora en formato DD/MM/YYYY
      return value.toLocaleDateString('es-ES');
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    if (typeof value === 'number') {
      // Formatear valores monetarios
      if (key.includes('value') && key.includes('trfm')) {
        return `€${value.toLocaleString('es-ES')}`;
      }
      // Formatear porcentajes
      if (key.includes('percent')) {
        return `${value.toFixed(2)}%`;
      }
      return value.toLocaleString('es-ES');
    }

    return String(value);
  };

  // Render sort icon
  const renderSortIcon = (field: keyof Player) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3 text-[#FF5733]" />
      : <ArrowDown className="w-3 h-3 text-[#FF5733]" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5733]"></div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-slate-400">No se encontraron jugadores</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-[#131921] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* HEADER */}
          <thead className="bg-[#1a2332] border-b border-slate-700 sticky top-0 z-10">
            <tr>
              {/* Player Name - Fixed Left Column */}
              <th
                className="p-4 text-left border-r border-slate-700 sticky left-0 bg-[#1a2332] z-20 min-w-[200px] cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort('player_name')}
              >
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className={`font-semibold text-sm ${
                    sortField === 'player_name' ? 'text-[#FF5733]' : 'text-slate-300'
                  }`}>
                    Player Name
                  </span>
                  {renderSortIcon('player_name')}
                </div>
              </th>

              {/* Scrollable Data Columns */}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="p-4 text-left border-r border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors"
                  style={{ minWidth: col.width }}
                  onClick={() => handleSort(col.key as keyof Player)}
                >
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className={`font-semibold text-sm ${
                      sortField === col.key ? 'text-[#FF5733]' : 'text-slate-300'
                    }`}>
                      {col.label}
                    </span>
                    {renderSortIcon(col.key as keyof Player)}
                  </div>
                </th>
              ))}

              {/* Actions - Fixed Right Column */}
              <th className="p-4 text-center border-l border-slate-700 sticky right-0 bg-[#1a2332] z-20 min-w-[150px]">
                <span className="font-semibold text-sm text-slate-300">Actions</span>
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-slate-700">
            {sortedPlayers.map((player) => (
              <tr
                key={player.id_player}
                className="hover:bg-slate-700/30 transition-colors"
              >
                {/* Player Name - Fixed Left Column (Editable) */}
                <td className="p-4 border-r border-slate-700 sticky left-0 bg-[#131921] z-10 min-w-[200px]">
                  <EditableCell
                    value={player.player_name}
                    playerId={player.id_player}
                    fieldName="player_name"
                    onSave={handleSaveField}
                    type="text"
                  />
                </td>

                {/* Scrollable Data Columns */}
                {visibleColumns.map((col) => {
                  const value = player[col.key as keyof Player];
                  const formattedValue = formatValue(value, col.key);
                  const isEditable = !NON_EDITABLE_FIELDS.has(col.key);
                  const fieldType = getFieldType(col.key);

                  return (
                    <td
                      key={`${player.id_player}-${col.key}`}
                      className="p-4 border-r border-slate-700"
                      style={{ minWidth: col.width }}
                    >
                      {isEditable ? (
                        <EditableCell
                          value={value}
                          playerId={player.id_player}
                          fieldName={col.key}
                          onSave={handleSaveField}
                          type={fieldType}
                        />
                      ) : fieldType === 'url' && value ? (
                        <a
                          href={String(value)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF5733] hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Link
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-white whitespace-nowrap">
                          {formattedValue}
                        </span>
                      )}
                    </td>
                  );
                })}

                {/* Actions - Fixed Right Column */}
                <td className="p-4 border-l border-slate-700 sticky right-0 bg-[#131921] z-10 min-w-[150px]">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      className="bg-[#FF5733] hover:bg-[#E64A2B] text-white border-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/jugadores/${player.id_player}/editar`);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/member/player/${player.id_player}`);
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
})

export default AdminPlayerTable