"use client";

import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo, memo } from "react";

import EditableCell from "@/components/admin/EditableCell";
import { Button } from "@/components/ui/button";

interface Scout {
  id_scout: string;
  clerkId?: string | null;
  scout_name?: string | null;
  name?: string | null;
  surname?: string | null;
  date_of_birth?: Date | string | null;
  age?: number | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  favourite_club?: string | null;
  open_to_work?: boolean | null;
  professional_experience?: string | null;
  twitter_profile?: string | null;
  instagram_profile?: string | null;
  linkedin_profile?: string | null;
  url_profile?: string | null;
  total_reports?: number | null;
  total_reports_norm?: number | null;
  total_reports_rank?: number | null;
  original_reports?: number | null;
  original_reports_norm?: number | null;
  original_reports_rank?: number | null;
  nationality_expertise?: string | null;
  competition_expertise?: string | null;
  avg_potential?: number | null;
  avg_initial_age?: number | null;
  avg_initial_age_norm?: number | null;
  roi?: number | null;
  roi_norm?: number | null;
  roi_rank?: number | null;
  roi_orig?: number | null;
  roi_orig_rank?: number | null;
  net_profits?: number | null;
  net_profits_rank?: number | null;
  net_profits_orig?: number | null;
  net_profits_orig_rank?: number | null;
  total_investment?: number | null;
  total_investment_rank?: number | null;
  total_investment_orig?: number | null;
  total_investment_orig_rank?: number | null;
  avg_initial_trfm_value?: number | null;
  avg_initial_trfm_value_rank?: number | null;
  max_profit_report?: number | null;
  max_profit_report_rank?: number | null;
  min_profit_report?: number | null;
  min_profit_report_rank?: number | null;
  avg_profit_report?: number | null;
  avg_profit_report_norm?: number | null;
  avg_profit_report_rank?: number | null;
  transfer_team_pts?: number | null;
  transfer_team_pts_norm?: number | null;
  transfer_team_pts_rank?: number | null;
  transfer_competition_pts?: number | null;
  transfer_competition_pts_norm?: number | null;
  transfer_competition_pts_rank?: number | null;
  avg_initial_team_elo?: number | null;
  avg_initial_team_level?: string | null;
  avg_initial_competition_elo?: number | null;
  avg_initial_competition_level?: string | null;
  scout_elo?: number | null;
  scout_ranking?: number | null;
  scout_level?: string | null;
  join_date?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: unknown;
}

interface AdminScoutTableProps {
  scouts: Scout[];
  hiddenColumns: string[];
}

type SortField = keyof Scout | null;
type SortOrder = 'asc' | 'desc';

// Función para determinar el tipo de campo automáticamente
const getFieldType = (fieldName: string): 'text' | 'number' | 'boolean' | 'url' | 'date' => {
  // Campos de URL
  if (fieldName.startsWith('url_') || fieldName.includes('_profile')) {
    return 'url';
  }

  // Campos de fecha
  const dateFields = ['date_of_birth', 'join_date', 'createdAt', 'updatedAt'];
  if (dateFields.includes(fieldName)) {
    return 'date';
  }

  // Campos booleanos
  if (fieldName === 'open_to_work') {
    return 'boolean';
  }

  // Campos numéricos
  if (fieldName.includes('_norm') || fieldName.includes('_rank') || fieldName.includes('elo') ||
      fieldName.includes('roi') || fieldName.includes('profit') || fieldName.includes('investment') ||
      fieldName.includes('ranking') || fieldName === 'age' || fieldName.includes('reports')) {
    return 'number';
  }

  // Por defecto, texto
  return 'text';
};

// Campos NO editables
const NON_EDITABLE_FIELDS = new Set([
  'id_scout',
  'clerkId',
  'createdAt',
  'updatedAt',

  // Campos calculados automáticamente
  'total_reports_norm',
  'total_reports_rank',
  'original_reports_norm',
  'original_reports_rank',
  'avg_initial_age_norm',
  'roi_norm',
  'roi_rank',
  'roi_orig',
  'roi_orig_rank',
  'net_profits_rank',
  'net_profits_orig',
  'net_profits_orig_rank',
  'total_investment_rank',
  'total_investment_orig',
  'total_investment_orig_rank',
  'avg_initial_trfm_value_rank',
  'max_profit_report_rank',
  'min_profit_report_rank',
  'avg_profit_report_norm',
  'avg_profit_report_rank',
  'transfer_team_pts_norm',
  'transfer_team_pts_rank',
  'transfer_competition_pts_norm',
  'transfer_competition_pts_rank',
  'scout_elo',
  'scout_ranking',
  'scout_level',
]);

// Configuración de columnas con nombres amigables
const COLUMN_CONFIG: Record<string, string> = {
  id_scout: 'ID Scout',
  clerkId: 'Clerk ID',
  scout_name: 'Nombre Scout',
  name: 'Nombre',
  surname: 'Apellido',
  date_of_birth: 'Fecha Nac.',
  age: 'Edad',
  nationality: 'Nacionalidad',
  email: 'Email',
  phone: 'Teléfono',
  address: 'Dirección',
  city: 'Ciudad',
  country: 'País',
  favourite_club: 'Club Favorito',
  open_to_work: 'Disponible',
  professional_experience: 'Experiencia',
  twitter_profile: 'Twitter',
  instagram_profile: 'Instagram',
  linkedin_profile: 'LinkedIn',
  url_profile: 'URL Perfil',
  total_reports: 'Total Reportes',
  total_reports_norm: 'Reportes Norm',
  total_reports_rank: 'Reportes Rank',
  original_reports: 'Reportes Orig.',
  original_reports_norm: 'Orig. Norm',
  original_reports_rank: 'Orig. Rank',
  nationality_expertise: 'Expertise Nac.',
  competition_expertise: 'Expertise Comp.',
  avg_potential: 'Potencial Prom.',
  avg_initial_age: 'Edad Inicial Prom.',
  avg_initial_age_norm: 'Edad Inicial Norm',
  roi: 'ROI',
  roi_norm: 'ROI Norm',
  roi_rank: 'ROI Rank',
  roi_orig: 'ROI Orig.',
  roi_orig_rank: 'ROI Orig. Rank',
  net_profits: 'Beneficios',
  net_profits_rank: 'Benef. Rank',
  net_profits_orig: 'Benef. Orig.',
  net_profits_orig_rank: 'Benef. Orig. Rank',
  total_investment: 'Inversión',
  total_investment_rank: 'Inv. Rank',
  total_investment_orig: 'Inv. Orig.',
  total_investment_orig_rank: 'Inv. Orig. Rank',
  avg_initial_trfm_value: 'Valor Inicial Prom.',
  avg_initial_trfm_value_rank: 'Valor Inicial Rank',
  max_profit_report: 'Max. Beneficio',
  max_profit_report_rank: 'Max. Benef. Rank',
  min_profit_report: 'Min. Beneficio',
  min_profit_report_rank: 'Min. Benef. Rank',
  avg_profit_report: 'Benef. Prom.',
  avg_profit_report_norm: 'Benef. Prom. Norm',
  avg_profit_report_rank: 'Benef. Prom. Rank',
  transfer_team_pts: 'Pts Transf. Equipo',
  transfer_team_pts_norm: 'Pts Transf. Eq. Norm',
  transfer_team_pts_rank: 'Pts Transf. Eq. Rank',
  transfer_competition_pts: 'Pts Transf. Comp.',
  transfer_competition_pts_norm: 'Pts Transf. Comp. Norm',
  transfer_competition_pts_rank: 'Pts Transf. Comp. Rank',
  avg_initial_team_elo: 'ELO Equipo Inicial',
  avg_initial_team_level: 'Nivel Equipo Inicial',
  avg_initial_competition_elo: 'ELO Comp. Inicial',
  avg_initial_competition_level: 'Nivel Comp. Inicial',
  scout_elo: 'ELO',
  scout_ranking: 'Ranking',
  scout_level: 'Nivel',
  join_date: 'Fecha Registro',
  createdAt: 'Creado',
  updatedAt: 'Actualizado',
};

// Componente de tabla optimizado con memo
const AdminScoutTable = memo(function AdminScoutTable({ scouts, hiddenColumns }: AdminScoutTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Obtener todas las columnas disponibles del primer scout
  const allColumns = useMemo(() => {
    if (scouts.length === 0) return [];
    return Object.keys(scouts[0]);
  }, [scouts]);

  // Filtrar columnas ocultas
  const visibleColumns = useMemo(() => {
    return allColumns.filter(col => !hiddenColumns.includes(col));
  }, [allColumns, hiddenColumns]);

  // Función de ordenamiento
  const handleSort = (field: keyof Scout) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Scouts ordenados
  const sortedScouts = useMemo(() => {
    if (!sortField) return scouts;

    return [...scouts].sort((a, b) => {
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
  }, [scouts, sortField, sortOrder]);

  // Función para guardar cambios
  const handleSaveCell = async (scoutId: string, fieldName: string, value: string | number | boolean): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/scouts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scoutId,
          fieldName,
          value
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el cambio');
      }

      return true;
    } catch (error) {
      console.error('Error al guardar:', error);
      return false;
    }
  };

  // Renderizar encabezado de columna
  const renderColumnHeader = (column: string) => {
    const displayName = COLUMN_CONFIG[column] || column;
    const isSorted = sortField === column;

    return (
      <th
        key={column}
        className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 border-r border-slate-700"
        onClick={() => handleSort(column as keyof Scout)}
      >
        <div className="flex items-center gap-2">
          <span>{displayName}</span>
          {isSorted ? (
            sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          )}
        </div>
      </th>
    );
  };

  // Renderizar celda
  const renderCell = (scout: Scout, column: string) => {
    const value = scout[column];
    const isEditable = !NON_EDITABLE_FIELDS.has(column);
    const fieldType = getFieldType(column);

    if (column === 'id_scout') {
      return (
        <td key={column} className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 border-r border-slate-700">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">{value as string}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-slate-700"
              onClick={() => router.push(`/admin/scouts/${value}`)}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </td>
      );
    }

    return (
      <td key={column} className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 border-r border-slate-700">
        <EditableCell
          value={value as any}
          playerId={scout.id_scout}
          fieldName={column}
          onSave={handleSaveCell}
          type={fieldType}
        />
      </td>
    );
  };

  if (scouts.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No hay scouts para mostrar
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-[#131921]">
      <table className="min-w-full divide-y divide-slate-700">
        <thead className="bg-slate-800/50 sticky top-0 z-10">
          <tr>
            {visibleColumns.map(column => renderColumnHeader(column))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {sortedScouts.map((scout) => (
            <tr key={scout.id_scout} className="hover:bg-slate-800/30 transition-colors">
              {visibleColumns.map(column => renderCell(scout, column))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default AdminScoutTable;
