"use client";

import { ArrowUpDown, ArrowUp, ArrowDown, Edit, ExternalLink, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo, memo } from "react";

import ColorPickerCell from "@/components/admin/ColorPickerCell";
import EditableCell from "@/components/admin/EditableCell";
import VisibilityCheckbox from "@/components/admin/VisibilityCheckbox";
import { Button } from "@/components/ui/button";
import type { Player } from "@/types/player";

// Campos importantes que deben ser verificados por duplicados
const IMPORTANT_DUPLICATE_FIELDS = new Set([
  'player_name',
  'complete_player_name',
  'wyscout_id_1',
  'wyscout_id_2',
  'wyscout_name_1',
  'wyscout_name_2',
  'id_fmi'
]);

interface AdminPlayerTableProps {
  players: Player[];
  hiddenColumns: string[];
  onPlayerUpdate?: (id: string | number, updates: Partial<Player>) => void;
}

type SortField = keyof Player | null;
type SortOrder = 'asc' | 'desc';

// Función para determinar el tipo de campo automáticamente
const getFieldType = (fieldName: string): 'text' | 'number' | 'boolean' | 'url' | 'date' => {
  // Campos de URL (photo_coverage es solo texto, no link)
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

// Campos NO editables (SOLO campos calculados mediante fórmulas)
// Estos campos se actualizan automáticamente cuando cambian sus factores
const NON_EDITABLE_FIELDS = new Set([
  // IDs del sistema y timestamps
  'id_player',
  'createdAt',
  'updatedAt',
  
  // Age calculations (se calculan automáticamente cuando cambia age o player_trfm_value)
  'age_value',           // = AVG(player_trfm_value WHERE age <= this.age)
  'age_value_percent',   // = (100 × player_trfm_value / age_value) - 100
  'age_coeff',           // = age <= 22 ? 1 : 2
  
  // Nationality calculations (se calculan cuando cambia nationality o player_trfm_value)
  'nationality_value',         // = AVG(player_trfm_value WHERE nationality = this.nationality)
  'nationality_value_percent', // = (100 × player_trfm_value / nationality_value) - 100
  
  // Position calculations (se calculan cuando cambia position o player_trfm_value)
  'position_value',         // = AVG(player_trfm_value WHERE position = this.position)
  'position_value_percent', // = (100 × player_trfm_value / position_value) - 100
  
  // Team calculations (se calculan cuando cambia team_level)
  'team_level_value',         // = Calculado basado en team_level
  'team_level_value_percent', // = Calculado basado en team_level
  
  // Competition calculations (se calculan cuando cambia competition)
  'team_competition_value',         // = Calculado basado en competición
  'team_competition_value_percent', // = Calculado basado en competición
  'competition_level_value',         // = Calculado basado en nivel
  'competition_level_value_percent', // = Calculado basado en nivel
  
  // Owner club calculations (se calculan cuando cambia owner_club)
  'owner_club_value',         // = Calculado basado en club propietario
  'owner_club_value_percent', // = Calculado basado en club propietario
  
  // Normalizations (se calculan cuando cambian los valores base)
  'player_trfm_value_norm', // = PERCENTILE(player_trfm_value, all_players) × 100
  'player_rating_norm',     // = PERCENTILE(player_rating, all_players) × 100
  'total_fmi_pts_norm',     // = PERCENTILE(total_fmi_pts, all_players) × 100
  
  // Stats evolution (se calcula desde otra tabla - player_stats_3m)
  'stats_evo_3m',
  
  // Rankings (se calculan automáticamente)
  'player_ranking',
]);

// Campos CALCULADOS automáticamente mediante fórmulas
const CALCULATED_FIELDS = new Set([
  // Age calculations (age-calculation-service.ts)
  'age_value',           // Promedio de player_trfm_value para edad <= player.age
  'age_value_percent',   // (100 × player_trfm_value / age_value) - 100
  'age_coeff',           // age <= 22 ? 1 : 2
  
  // Nationality calculations (nationality-calculation-service.ts)
  'nationality_value',         // Promedio de player_trfm_value para misma nacionalidad
  'nationality_value_percent', // (100 × player_trfm_value / nationality_value) - 100
  
  // Position calculations
  'position_value',         // Promedio de player_trfm_value para misma posición
  'position_value_percent', // (100 × player_trfm_value / position_value) - 100
  
  // Team calculations
  'team_level_value',         // Valor basado en team_level
  'team_level_value_percent', // Porcentaje basado en team_level
  
  // Competition calculations
  'team_competition_value',         // Valor basado en competición
  'team_competition_value_percent', // Porcentaje basado en competición
  'competition_level_value',         // Valor basado en nivel de competición
  'competition_level_value_percent', // Porcentaje basado en nivel de competición
  
  // Owner club calculations
  'owner_club_value',         // Valor basado en club propietario
  'owner_club_value_percent', // Porcentaje basado en club propietario
  
  // Normalizations (from stats import)
  'player_trfm_value_norm', // Normalización de player_trfm_value
  'player_rating_norm',     // Normalización de player_rating
  'total_fmi_pts_norm',     // Normalización de total_fmi_pts (from attributes)
  
  // Stats evolution (from player_stats_3m/6m/1y/2y)
  'stats_evo_3m', // Evolución de estadísticas 3 meses
  
  // Rankings
  'player_ranking', // Ranking global del jugador
]);

// Campos obtenidos mediante SCRAPING de Transfermarkt
const SCRAPED_FIELDS = new Set([
  // URLs (url_trfm_broken es detectado durante scraping)
  
  // Datos personales
  'date_of_birth',       // Fecha de nacimiento
  'height',              // Altura en cm
  'foot',                // Pie dominante (izquierdo/derecho/ambos)
  'nationality_1',       // Nacionalidad principal
  'nationality_2',       // Nacionalidad secundaria
  'national_tier',       // Nivel de selección nacional
  
  // Datos profesionales
  'team_name',           // Nombre del equipo actual
  'team_loan_from',      // Equipo del que está cedido (si aplica)
  'position_player',     // Posición del jugador
  'agency',              // Agencia del jugador
  'contract_end',        // Fecha de fin de contrato
  
  // Valor de mercado
  'player_trfm_value',   // Valor de mercado en €
  
  // Imagen
  'photo_coverage',      // Estado de cobertura de foto (texto, no link)
]);

// Campos FACTORES que influyen en otros campos calculados
// Al editar estos campos, se recalculan automáticamente otros campos
const FACTOR_FIELDS = new Set([
  // Factores de Age calculations
  'age',                    // → Afecta: age_value, age_value_percent, age_coeff
  'date_of_birth',          // → Afecta: age (y transitivamente los anteriores)
  
  // Factores de Nationality calculations
  'nationality_1',          // → Afecta: nationality_value, nationality_value_percent
  
  // Factores de Position calculations
  'position_player',        // → Afecta: position_value, position_value_percent
  'correct_position_player', // → Afecta los mismos si se usa como fuente
  
  // Factores de Team calculations
  'team_level',             // → Afecta: team_level_value, team_level_value_percent
  'team_name',              // → Puede afectar team_level
  
  // Factores de Competition calculations
  'competition',            // → Afecta: competition_level_value, competition_level_value_percent
  'team_competition',       // → Afecta: team_competition_value, team_competition_value_percent
  
  // Factores de Owner club calculations
  'owner_club',             // → Afecta: owner_club_value, owner_club_value_percent
  
  // Factor principal usado en múltiples cálculos
  'player_trfm_value',      // → Afecta: age_value, nationality_value, position_value, 
                            //           player_trfm_value_norm, y todos sus *_percent
  
  // Factores de Rating
  'player_rating',          // → Afecta: player_rating_norm
  
  // Factores de FMI
  'total_fmi_pts',          // → Afecta: total_fmi_pts_norm
]);

// Definición de todas las columnas (ordenadas: Visible, Color, Notas, ID Player, Player Name primero)
const COLUMN_DEFINITIONS = [
  { key: 'is_visible', label: 'Visible', width: '70px' },
  { key: 'player_color', label: 'Color', width: '80px' },
  { key: 'admin_notes', label: 'Notas', width: '250px' },
  { key: 'id_player', label: 'ID Player', width: '120px' },
  { key: 'player_name', label: 'Player Name', width: '200px' },
  { key: 'wyscout_notes', label: 'Wyscout', width: '200px' },
  { key: 'wyscout_id_1', label: 'Wyscout ID 1', width: '120px' },
  { key: 'wyscout_id_2', label: 'Wyscout ID 2', width: '120px' },
  { key: 'wyscout_name_1', label: 'Wyscout Name 1', width: '160px' },
  { key: 'wyscout_name_2', label: 'Wyscout Name 2', width: '160px' },
  { key: 'fmi_notes', label: 'FM Inside', width: '200px' },
  { key: 'id_fmi', label: 'ID FMI', width: '100px' },
  { key: 'player_rating', label: 'Player Rating', width: '120px' },
  { key: 'photo_coverage', label: 'Photo Coverage', width: '130px' },
  { key: 'url_trfm_broken', label: 'URL Broken', width: '100px' },
  { key: 'url_trfm', label: 'URL TRFM', width: '120px' },
  { key: 'url_secondary', label: 'URL Secondary', width: '130px' },
  { key: 'url_instagram', label: 'URL Instagram', width: '130px' },
  { key: 'date_of_birth', label: 'Date of Birth', width: '120px' },
  { key: 'age', label: 'Age', width: '80px' },
  { key: 'age_value', label: 'Age Value', width: '100px' },
  { key: 'age_value_percent', label: 'Age Value %', width: '110px' },
  { key: 'age_coeff', label: 'Age Coeff', width: '100px' },
  { key: 'pre_team', label: 'Pre Team', width: '150px' },
  { key: 'team_name', label: 'Team Name', width: '180px' },
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
  { key: 'on_loan', label: 'On Loan', width: '90px' },
  { key: 'complete_player_name', label: 'Complete Player Name', width: '190px' },
  { key: 'position_player', label: 'Position Player', width: '140px' },
  { key: 'position_value', label: 'Position Value', width: '130px' },
  { key: 'position_value_percent', label: 'Position Value %', width: '150px' },
  { key: 'foot', label: 'Foot', width: '80px' },
  { key: 'height', label: 'Height', width: '90px' },
  { key: 'nationality_1', label: 'Nationality 1', width: '130px' },
  { key: 'nationality_value', label: 'Nationality Value', width: '150px' },
  { key: 'nationality_value_percent', label: 'Nationality Value %', width: '170px' },
  { key: 'nationality_2', label: 'Nationality 2', width: '130px' },
  { key: 'national_tier', label: 'National Tier', width: '120px' },
  { key: 'rename_national_tier', label: 'Rename National Tier', width: '180px' },
  { key: 'agency', label: 'Agency', width: '150px' },
  { key: 'contract_end', label: 'Contract End', width: '120px' },
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
] as const;

function AdminPlayerTableComponent({ players, hiddenColumns, onPlayerUpdate }: AdminPlayerTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Detectar valores duplicados en campos importantes
  const duplicateValues = useMemo(() => {
    const duplicates = new Map<string, Set<string | number>>();

    // Inicializar el mapa para cada campo importante
    IMPORTANT_DUPLICATE_FIELDS.forEach(field => {
      duplicates.set(field, new Set());
    });

    // Contar ocurrencias de cada valor en cada campo
    const valueCounts = new Map<string, Map<string | number, number>>();

    players.forEach(player => {
      IMPORTANT_DUPLICATE_FIELDS.forEach(field => {
        const value = player[field as keyof Player];

        // Ignorar valores nulos, undefined o vacíos
        if (value === null || value === undefined || value === '') return;

        const valueStr = String(value);

        if (!valueCounts.has(field)) {
          valueCounts.set(field, new Map());
        }

        const fieldCounts = valueCounts.get(field)!;
        fieldCounts.set(valueStr, (fieldCounts.get(valueStr) || 0) + 1);
      });
    });

    // Identificar valores que aparecen más de una vez
    valueCounts.forEach((fieldCounts, field) => {
      fieldCounts.forEach((count, value) => {
        if (count > 1) {
          duplicates.get(field)!.add(value);
        }
      });
    });

    return duplicates;
  }, [players]);

  // Detectar jugadores donde wyscout_id_1 === wyscout_id_2 o wyscout_name_1 === wyscout_name_2
  const playersWithMatchingWyscout = useMemo(() => {
    const matchingIds = new Set<number>();
    const matchingNames = new Set<number>();

    players.forEach(player => {
      // Verificar IDs
      const wyscoutId1 = player.wyscout_id_1;
      const wyscoutId2 = player.wyscout_id_2;
      if (wyscoutId1 != null && wyscoutId1 !== '' &&
          wyscoutId2 != null && wyscoutId2 !== '' &&
          String(wyscoutId1) === String(wyscoutId2)) {
        matchingIds.add(player.id_player);
      }

      // Verificar Names
      const wyscoutName1 = player.wyscout_name_1;
      const wyscoutName2 = player.wyscout_name_2;
      if (wyscoutName1 != null && wyscoutName1 !== '' &&
          wyscoutName2 != null && wyscoutName2 !== '' &&
          String(wyscoutName1) === String(wyscoutName2)) {
        matchingNames.add(player.id_player);
      }
    });

    return { matchingIds, matchingNames };
  }, [players]);

  // Función para verificar si un valor está duplicado
  const isDuplicate = (fieldName: string, value: unknown, playerId?: number): boolean => {
    if (value === null || value === undefined || value === '') return false;

    // Caso especial: wyscout_id_1 y wyscout_id_2 iguales en el mismo jugador
    if ((fieldName === 'wyscout_id_1' || fieldName === 'wyscout_id_2') && playerId !== undefined) {
      if (playersWithMatchingWyscout.matchingIds.has(playerId)) {
        return true;
      }
    }

    // Caso especial: wyscout_name_1 y wyscout_name_2 iguales en el mismo jugador
    if ((fieldName === 'wyscout_name_1' || fieldName === 'wyscout_name_2') && playerId !== undefined) {
      if (playersWithMatchingWyscout.matchingNames.has(playerId)) {
        return true;
      }
    }

    // Caso normal: valor duplicado entre diferentes jugadores
    if (!IMPORTANT_DUPLICATE_FIELDS.has(fieldName)) return false;

    const duplicateSet = duplicateValues.get(fieldName);
    if (!duplicateSet) return false;

    return duplicateSet.has(String(value));
  };

  // Filtrar columnas para mostrar todas EXCEPTO las ocultas
  const visibleColumns = useMemo(() => {
    return COLUMN_DEFINITIONS.filter(col => !hiddenColumns.includes(col.key));
  }, [hiddenColumns]);

  // Función para guardar cambios en campos editables
  const handleSaveField = async (
    playerId: string | number,
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

      // Actualizar el estado local inmediatamente
      if (onPlayerUpdate) {
        onPlayerUpdate(playerId, { [fieldName]: value } as Partial<Player>);
      } else {
        // Fallback: recargar la página si no hay callback
        router.refresh();
      }

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

    // Formatear ELO (asegurar que sea número)
    if (key.includes('elo')) {
      const num = Number(value);
      if (!isNaN(num)) {
        return num.toFixed(2);
      }
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

    return value !== undefined ? String(value) : '';
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
              {/* All Columns (Color, Notas, ID Player, Player Name first) */}
              {visibleColumns.map((col) => {
                const isCalculated = CALCULATED_FIELDS.has(col.key);
                const isScraped = SCRAPED_FIELDS.has(col.key);
                const isFactor = FACTOR_FIELDS.has(col.key);
                return (
                  <th
                    key={col.key}
                    className="p-4 text-left border-r border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors relative"
                    style={{ minWidth: col.width }}
                    onClick={() => handleSort(col.key as keyof Player)}
                  >
                    {/* Indicadores en la esquina superior derecha - todos en la misma posición */}
                    <div className="absolute top-1 right-1 flex gap-0.5">
                      {/* Indicador de campo calculado */}
                      {isCalculated && (
                        <div 
                          className="w-2 h-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-sm shadow-sm"
                          title="Campo calculado automáticamente mediante fórmula"
                        />
                      )}
                      {/* Indicador de campo scrapeado */}
                      {isScraped && (
                        <div 
                          className="w-2 h-2 bg-gradient-to-br from-purple-400 to-violet-500 rounded-sm shadow-sm"
                          title="Campo obtenido mediante scraping de Transfermarkt"
                        />
                      )}
                      {/* Indicador de campo factor */}
                      {isFactor && !isCalculated && (
                        <div 
                          className="w-2 h-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-sm shadow-sm"
                          title="Campo factor: al editarlo se recalculan otros campos automáticamente"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className={`font-semibold text-sm ${
                        sortField === col.key ? 'text-[#FF5733]' : 'text-slate-300'
                      }`}>
                        {col.label}
                      </span>
                      {renderSortIcon(col.key as keyof Player)}
                    </div>
                  </th>
                );
              })}

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
                {/* All Columns (Color, Notas, ID Player, Player Name first) */}
                {visibleColumns.map((col) => {
                  const value = player[col.key as keyof Player];
                  const formattedValue = formatValue(value, col.key);
                  const isEditable = !NON_EDITABLE_FIELDS.has(col.key);
                  const fieldType = getFieldType(col.key);
                  const hasDuplicate = isDuplicate(col.key, value, player.id_player);

                  return (
                    <td
                      key={`${player.id_player}-${col.key}`}
                      className="p-4 border-r border-slate-700"
                      style={{ minWidth: col.width }}
                    >
                      <div className={hasDuplicate ? 'font-bold' : ''}>
                        {col.key === 'is_visible' ? (
                          <VisibilityCheckbox
                            value={value as boolean | null | undefined}
                            playerId={player.id_player}
                            onSave={handleSaveField}
                          />
                        ) : col.key === 'player_color' ? (
                          <ColorPickerCell
                            value={value as string || null}
                            playerId={player.id_player}
                            onSave={handleSaveField}
                          />
                        ) : col.key === 'url_trfm_broken' ? (
                          // Mostrar icono de alerta si url_trfm está roto, o checkmark si está OK
                          <div className="flex items-center justify-center" title={player.url_trfm_broken ? "URL TRFM roto - detectado en scraping" : "URL TRFM OK"}>
                            {player.url_trfm_broken ? (
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </div>
                        ) : isEditable ? (
                          <EditableCell
                            value={value ?? null}
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
                      </div>
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
      
      {/* Leyenda de campos automáticos */}
      <div className="px-4 py-3 bg-[#0f1419] border-t border-slate-700">
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-sm shadow-sm" />
            <span>Campo calculado (fórmula automática)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-gradient-to-br from-purple-400 to-violet-500 rounded-sm shadow-sm" />
            <span>Campo scrapeado (Transfermarkt)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-sm shadow-sm" />
            <span>Campo factor (afecta otros campos)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">Negrita</span>
            <span>- Valor duplicado en múltiples jugadores</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Comparación personalizada para memo
const arePropsEqual = (
  prevProps: AdminPlayerTableProps,
  nextProps: AdminPlayerTableProps
) => {
  // Comparar si las columnas ocultas son las mismas
  if (prevProps.hiddenColumns.length !== nextProps.hiddenColumns.length) {
    return false
  }
  if (!prevProps.hiddenColumns.every((col, i) => col === nextProps.hiddenColumns[i])) {
    return false
  }

  // Comparar si los jugadores son los mismos (por IDs y contenido)
  if (prevProps.players.length !== nextProps.players.length) {
    return false
  }

  // Comparar players por referencia para detectar cambios en el array
  if (prevProps.players !== nextProps.players) {
    return false
  }

  // Comparar onPlayerUpdate por referencia
  if (prevProps.onPlayerUpdate !== nextProps.onPlayerUpdate) {
    return false
  }

  return true
}

export default memo(AdminPlayerTableComponent, arePropsEqual)