'use client'

import { Settings, ChevronDown, X, Check } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

interface Column {
  key: string
  label: string
}

interface ColumnGroup {
  groupName: string
  columns: Column[]
}

interface AdminColumnSelectorProps {
  selectedColumns: string[]
  onColumnToggle: (columnKey: string) => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  minColumns?: number
}

// Definición de todas las columnas agrupadas por categoría
export const ADMIN_COLUMN_GROUPS: ColumnGroup[] = [
  {
    groupName: 'Identificación',
    columns: [
      { key: 'id_player', label: 'ID Player' },
      { key: 'wyscout_id_1', label: 'Wyscout ID 1' },
      { key: 'wyscout_id_2', label: 'Wyscout ID 2' },
      { key: 'wyscout_name_1', label: 'Wyscout Name 1' },
      { key: 'wyscout_name_2', label: 'Wyscout Name 2' },
      { key: 'id_fmi', label: 'ID FMI' },
      { key: 'complete_player_name', label: 'Complete Player Name' },
    ]
  },
  {
    groupName: 'Datos Personales',
    columns: [
      { key: 'date_of_birth', label: 'Date of Birth' },
      { key: 'correct_date_of_birth', label: 'Correct Date of Birth' },
      { key: 'age', label: 'Age' },
      { key: 'age_value', label: 'Age Value' },
      { key: 'age_value_percent', label: 'Age Value %' },
      { key: 'age_coeff', label: 'Age Coeff' },
      { key: 'height', label: 'Height' },
      { key: 'correct_height', label: 'Correct Height' },
      { key: 'foot', label: 'Foot' },
      { key: 'correct_foot', label: 'Correct Foot' },
    ]
  },
  {
    groupName: 'Posición',
    columns: [
      { key: 'position_player', label: 'Position Player' },
      { key: 'correct_position_player', label: 'Correct Position Player' },
      { key: 'position_value', label: 'Position Value' },
      { key: 'position_value_percent', label: 'Position Value %' },
    ]
  },
  {
    groupName: 'Nacionalidad',
    columns: [
      { key: 'nationality_1', label: 'Nationality 1' },
      { key: 'correct_nationality_1', label: 'Correct Nationality 1' },
      { key: 'nationality_value', label: 'Nationality Value' },
      { key: 'nationality_value_percent', label: 'Nationality Value %' },
      { key: 'nationality_2', label: 'Nationality 2' },
      { key: 'correct_nationality_2', label: 'Correct Nationality 2' },
      { key: 'national_tier', label: 'National Tier' },
      { key: 'rename_national_tier', label: 'Rename National Tier' },
      { key: 'correct_national_tier', label: 'Correct National Tier' },
    ]
  },
  {
    groupName: 'Equipo',
    columns: [
      { key: 'pre_team', label: 'Pre Team' },
      { key: 'team_name', label: 'Team Name' },
      { key: 'correct_team_name', label: 'Correct Team Name' },
      { key: 'team_country', label: 'Team Country' },
      { key: 'team_elo', label: 'Team ELO' },
      { key: 'team_level', label: 'Team Level' },
      { key: 'team_level_value', label: 'Team Level Value' },
      { key: 'team_level_value_percent', label: 'Team Level Value %' },
    ]
  },
  {
    groupName: 'Competición',
    columns: [
      { key: 'team_competition', label: 'Team Competition' },
      { key: 'competition_country', label: 'Competition Country' },
      { key: 'team_competition_value', label: 'Team Competition Value' },
      { key: 'team_competition_value_percent', label: 'Team Competition Value %' },
      { key: 'competition_tier', label: 'Competition Tier' },
      { key: 'competition_confederation', label: 'Competition Confederation' },
      { key: 'competition_elo', label: 'Competition ELO' },
      { key: 'competition_level', label: 'Competition Level' },
      { key: 'competition_level_value', label: 'Competition Level Value' },
      { key: 'competition_level_value_percent', label: 'Competition Level Value %' },
    ]
  },
  {
    groupName: 'Cesión / Préstamo',
    columns: [
      { key: 'owner_club', label: 'Owner Club' },
      { key: 'owner_club_country', label: 'Owner Club Country' },
      { key: 'owner_club_value', label: 'Owner Club Value' },
      { key: 'owner_club_value_percent', label: 'Owner Club Value %' },
      { key: 'pre_team_loan_from', label: 'Pre Team Loan From' },
      { key: 'team_loan_from', label: 'Team Loan From' },
      { key: 'correct_team_loan_from', label: 'Correct Team Loan From' },
      { key: 'on_loan', label: 'On Loan' },
      { key: 'existing_club', label: 'Existing Club' },
    ]
  },
  {
    groupName: 'Agencia y Contrato',
    columns: [
      { key: 'agency', label: 'Agency' },
      { key: 'correct_agency', label: 'Correct Agency' },
      { key: 'contract_end', label: 'Contract End' },
      { key: 'correct_contract_end', label: 'Correct Contract End' },
    ]
  },
  {
    groupName: 'Valoración y Rating',
    columns: [
      { key: 'player_rating', label: 'Player Rating' },
      { key: 'player_rating_norm', label: 'Player Rating Norm' },
      { key: 'player_trfm_value', label: 'Player TRFM Value' },
      { key: 'player_trfm_value_norm', label: 'Player TRFM Value Norm' },
      { key: 'player_elo', label: 'Player ELO' },
      { key: 'player_level', label: 'Player Level' },
      { key: 'player_ranking', label: 'Player Ranking' },
    ]
  },
  {
    groupName: 'Métricas y Estadísticas',
    columns: [
      { key: 'stats_evo_3m', label: 'Stats Evo 3M' },
      { key: 'total_fmi_pts_norm', label: 'Total FMI Pts Norm' },
      { key: 'community_potential', label: 'Community Potential' },
    ]
  },
  {
    groupName: 'Multimedia',
    columns: [
      { key: 'photo_coverage', label: 'Photo Coverage' },
      { key: 'video', label: 'Video' },
      { key: 'url_trfm_advisor', label: 'URL TRFM Advisor' },
      { key: 'url_trfm', label: 'URL TRFM' },
      { key: 'url_secondary', label: 'URL Secondary' },
      { key: 'url_instagram', label: 'URL Instagram' },
    ]
  }
]

export default function AdminColumnSelector({
  selectedColumns,
  onColumnToggle,
  onSelectAll,
  onDeselectAll,
  minColumns = 1
}: AdminColumnSelectorProps) {
  const [showSelector, setShowSelector] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  // Obtener columnas seleccionadas con su label
  const getSelectedColumnsData = () => {
    const allColumns = ADMIN_COLUMN_GROUPS.flatMap(group => group.columns)
    return selectedColumns
      .map(key => allColumns.find(col => col.key === key))
      .filter(Boolean) as Column[]
  }

  // Obtener el total de columnas disponibles
  const totalColumns = ADMIN_COLUMN_GROUPS.flatMap(group => group.columns).length
  const allSelected = selectedColumns.length === totalColumns

  const handleColumnToggle = (columnKey: string) => {
    const isSelected = selectedColumns.includes(columnKey)

    if (isSelected && selectedColumns.length <= minColumns) {
      return // No permitir deseleccionar si estamos en el mínimo
    }

    onColumnToggle(columnKey)
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroup(prev => prev === groupName ? null : groupName)
  }

  if (!showSelector) {
    // Vista colapsada - Solo botón
    return (
      <div className="mb-6">
        <Button
          onClick={() => setShowSelector(true)}
          className="flex items-center gap-2 bg-[#1a2332] border-2 border-slate-700 text-white hover:bg-slate-700 hover:border-[#FF5733] transition-all"
        >
          <Settings className="w-4 h-4 text-[#FF5733]" />
          <span>Customize Display</span>
          <span className="text-xs bg-[#FF5733] text-white px-2 py-0.5 rounded-full font-semibold">
            {selectedColumns.length}
          </span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  // Vista expandida - Todo el contenido
  return (
    <div className="bg-[#131921] rounded-lg p-4 border border-slate-700 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-[#FF5733]" />
          <h3 className="font-semibold text-white">Customize Table Columns</h3>
          <span className="text-sm text-slate-400">
            ({selectedColumns.length} selected)
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => setShowSelector(false)}
          className="bg-slate-800 border-2 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all"
        >
          Hide Options
          <ChevronDown className="w-4 h-4 ml-2 transition-transform rotate-180" />
        </Button>
      </div>

      {/* Columnas seleccionadas actualmente */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        {getSelectedColumnsData().map((column) => (
          <div
            key={column.key}
            className="flex items-center gap-2 bg-[#FF5733] text-white px-3 py-1 rounded-full text-sm whitespace-nowrap"
          >
            <span>{column.label}</span>
            <button
              onClick={() => handleColumnToggle(column.key)}
              className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              disabled={selectedColumns.length <= minColumns}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Selector de columnas disponibles */}
      <div className="border-t border-slate-700 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-400">
            Select the columns you want to display in the table:
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onSelectAll}
              disabled={allSelected}
              className="bg-[#FF5733] hover:bg-[#E64A2B] text-white border-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Check className="w-3 h-3 mr-1" />
              Select All
            </Button>
            <Button
              size="sm"
              onClick={onDeselectAll}
              disabled={selectedColumns.length === 0}
              className="bg-slate-800 border-2 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <X className="w-3 h-3 mr-1" />
              Deselect All
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Botones de grupos principales */}
          <div className="flex flex-wrap gap-2">
            {ADMIN_COLUMN_GROUPS.map((group) => {
              const isExpanded = expandedGroup === group.groupName

              return (
                <button
                  key={group.groupName}
                  onClick={() => toggleGroup(group.groupName)}
                  className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all shadow-sm ${
                    isExpanded
                      ? 'bg-[#FF5733] text-white border-[#FF5733] shadow-[#FF5733]/20'
                      : 'bg-[#1a2332] text-slate-300 border-slate-700 hover:border-[#FF5733] hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {group.groupName}
                </button>
              )
            })}
          </div>

          {/* Columnas del grupo expandido */}
          {expandedGroup && ADMIN_COLUMN_GROUPS.find(g => g.groupName === expandedGroup) && (
            <div className="border border-slate-700 rounded-lg p-4 bg-[#1a2332]">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {ADMIN_COLUMN_GROUPS
                  .find(g => g.groupName === expandedGroup)!
                  .columns.map((column) => {
                    const isSelected = selectedColumns.includes(column.key)
                    const canDeselect = isSelected && selectedColumns.length > minColumns

                    return (
                      <button
                        key={column.key}
                        onClick={() => handleColumnToggle(column.key)}
                        disabled={isSelected && !canDeselect}
                        className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                          isSelected
                            ? 'bg-[#FF5733] text-white border-[#FF5733] shadow-sm'
                            : 'bg-[#131921] text-slate-300 border-slate-700 hover:border-[#FF5733] hover:text-white hover:bg-slate-800'
                        } ${isSelected && !canDeselect ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-white border-white'
                            : 'border-current'
                        }`}>
                          {isSelected && <Check className="w-2 h-2 text-[#FF5733]" />}
                        </div>
                        <span className="truncate text-left">{column.label}</span>
                      </button>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        {selectedColumns.length > 10 && (
          <p className="text-xs text-blue-400 mt-4">
            💡 Tip: With many columns selected, use horizontal scroll to navigate the table.
          </p>
        )}
      </div>
    </div>
  )
}
