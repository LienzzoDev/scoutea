"use client";

import { ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";

import EditableCell from "@/components/admin/EditableCell";
import { Button } from "@/components/ui/button";
import { type Team } from "@/hooks/team/useTeams";

// Campos NO editables (campos calculados y IDs del sistema)
const NON_EDITABLE_FIELDS = new Set([
  'id_team',
  'createdAt',
  'updatedAt',
  'team_trfm_value_norm',  // Normalización de team_trfm_value
  'team_rating_norm',      // Normalización de team_rating
]);

// Campos CALCULADOS automáticamente mediante fórmulas
const CALCULATED_FIELDS = new Set([
  // Normalizations
  'team_trfm_value_norm',  // Normalización de team_trfm_value
  'team_rating_norm',      // Normalización de team_rating
]);

// Campos obtenidos mediante SCRAPING de Transfermarkt
const SCRAPED_FIELDS = new Set([
  // Datos básicos
  'team_name',            // Nombre del equipo
  'team_country',         // País del equipo
  'competition',          // Competición del equipo

  // Valores
  'team_trfm_value',      // Valor de mercado del equipo
  'team_rating',          // Rating del equipo

  // Otros datos
  'founded_year',         // Año de fundación
  'stadium',              // Estadio
  'logo_url',             // URL del logo
]);

interface Category {
  key: string;
  label: string;
  getValue: (team: Team) => string | number | null | undefined;
  format?: (value: unknown) => string;
}

interface TeamTableProps {
  teams: Team[];
  selectedCategories: Category[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (categoryKey: string) => void;
  loading?: boolean;
  darkMode?: boolean;
  onEdit?: (teamId: string) => void;
  onDelete?: (teamId: string) => void;
}

export default function TeamTable({
  teams,
  selectedCategories,
  sortBy,
  sortOrder,
  onSort,
  loading,
  darkMode = false,
  onEdit,
  onDelete,
}: TeamTableProps) {
  const router = useRouter();
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const rowScrollRefs = useRef<HTMLDivElement[]>([]);

  // Calcular valores duplicados para team_name, url_trfm, fm_guide
  const duplicateValues = useMemo(() => {
    const teamNameCounts = new Map<string, number>();
    const urlTrfmCounts = new Map<string, number>();
    const fmGuideCounts = new Map<string, number>();

    teams.forEach(team => {
      // Contar team_name
      if (team.team_name) {
        const name = team.team_name.toLowerCase();
        teamNameCounts.set(name, (teamNameCounts.get(name) || 0) + 1);
      }
      // Contar url_trfm
      if (team.url_trfm) {
        const url = team.url_trfm.toLowerCase();
        urlTrfmCounts.set(url, (urlTrfmCounts.get(url) || 0) + 1);
      }
      // Contar fm_guide
      if (team.fm_guide) {
        const url = team.fm_guide.toLowerCase();
        fmGuideCounts.set(url, (fmGuideCounts.get(url) || 0) + 1);
      }
    });

    return {
      teamNames: new Set(
        Array.from(teamNameCounts.entries())
          .filter(([_, count]) => count > 1)
          .map(([name]) => name)
      ),
      urlTrfms: new Set(
        Array.from(urlTrfmCounts.entries())
          .filter(([_, count]) => count > 1)
          .map(([url]) => url)
      ),
      fmGuides: new Set(
        Array.from(fmGuideCounts.entries())
          .filter(([_, count]) => count > 1)
          .map(([url]) => url)
      )
    };
  }, [teams]);

  // Función para verificar si un valor está duplicado
  const isDuplicate = (field: 'team_name' | 'url_trfm' | 'fm_guide', value: string | null | undefined): boolean => {
    if (!value) return false;
    const lowerValue = value.toLowerCase();
    switch (field) {
      case 'team_name':
        return duplicateValues.teamNames.has(lowerValue);
      case 'url_trfm':
        return duplicateValues.urlTrfms.has(lowerValue);
      case 'fm_guide':
        return duplicateValues.fmGuides.has(lowerValue);
      default:
        return false;
    }
  };

  // Función para calcular el ancho de columna basado en el contenido
  const calculateColumnWidth = (category: Category): number => {
    const MIN_WIDTH = 140;
    const PADDING = 32; // 16px padding on each side
    const CHAR_WIDTH = 8; // Aproximadamente 8px por carácter

    // Calcular ancho del header
    let maxWidth = category.label.length * CHAR_WIDTH + PADDING;

    // Calcular ancho del contenido más largo
    teams.forEach(team => {
      const value = category.getValue(team);
      let formattedValue = category.format ? category.format(value) : value;

      if (typeof formattedValue === 'object') {
        formattedValue = JSON.stringify(formattedValue);
      } else if (formattedValue === null || formattedValue === undefined) {
        formattedValue = "N/A";
      } else {
        formattedValue = String(formattedValue);
      }

      const contentWidth = formattedValue.length * CHAR_WIDTH + PADDING;
      maxWidth = Math.max(maxWidth, contentWidth);
    });

    return Math.max(MIN_WIDTH, Math.min(maxWidth, 400)); // Max 400px
  };

  // Función para determinar el tipo de campo
  const getFieldType = (fieldName: string): 'text' | 'number' | 'boolean' | 'url' | 'date' => {
    // Campos de URL
    if (fieldName.startsWith('url_') || fieldName === 'website_url' || fieldName === 'fm_guide' || fieldName === 'logo_url') {
      return 'url';
    }

    // Campos numéricos
    if (fieldName.includes('value') || fieldName.includes('elo') ||
        fieldName.includes('rating') || fieldName.includes('norm') ||
        fieldName === 'founded_year') {
      return 'number';
    }

    // Por defecto, texto
    return 'text';
  };

  // Función para guardar cambios en campos editables
  const handleSaveField = async (
    teamId: string,
    fieldName: string,
    value: string | number | boolean
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
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

      // Refrescar datos sin recargar la página completa
      router.refresh();
      return true;
    } catch (error) {
      console.error('Error updating team field:', error);
      return false;
    }
  };

  // Función para manejar scroll sincronizado
  const handleScroll = (scrollLeft: number) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollLeft;
    }
    rowScrollRefs.current.forEach((ref) => {
      if (ref) {
        ref.scrollLeft = scrollLeft;
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-slate-400">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${darkMode ? 'border-[#FF5733]' : 'border-[#8c1a10]'}`}></div>
          <span>Cargando equipos...</span>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-[#6d6d6d]'}`}>
          No se encontraron equipos
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border overflow-hidden ${
      darkMode
        ? 'bg-[#131921] border-slate-700'
        : 'bg-white border-[#e7e7e7]'
    }`}>
      {/* HEADER */}
      <div className={`border-b flex items-stretch ${
        darkMode
          ? 'bg-[#1a2332] border-slate-700'
          : 'bg-[#f8f9fa] border-[#e7e7e7]'
      }`}>
        {/* Columna fija - ID */}
        <div
          className={`w-24 p-4 border-r flex-shrink-0 cursor-pointer transition-colors sticky left-0 z-10 ${
            darkMode
              ? 'border-slate-700 hover:bg-slate-700/50 bg-[#1a2332]'
              : 'border-[#e7e7e7] hover:bg-gray-50 bg-[#f8f9fa]'
          }`}
          onClick={() => onSort?.('id_team')}
        >
          <div className="flex items-center gap-1">
            <h4 className={`font-semibold text-sm ${
              sortBy === 'id_team'
                ? (darkMode ? 'text-[#FF5733]' : 'text-[#8c1a10]')
                : (darkMode ? 'text-slate-300' : 'text-[#6d6d6d]')
            }`}>
              ID
            </h4>
            {sortBy === 'id_team' ? (
              sortOrder === 'asc' ? (
                <ArrowUp className={`w-3 h-3 ${darkMode ? 'text-[#FF5733]' : 'text-[#8c1a10]'}`} />
              ) : (
                <ArrowDown className={`w-3 h-3 ${darkMode ? 'text-[#FF5733]' : 'text-[#8c1a10]'}`} />
              )
            ) : (
              <ArrowUpDown className={`w-3 h-3 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`} />
            )}
          </div>
        </div>

        {/* Columna fija - Team Info */}
        <div
          className={`w-80 p-4 border-r flex-shrink-0 cursor-pointer transition-colors ${
            darkMode
              ? 'border-slate-700 hover:bg-slate-700/50'
              : 'border-[#e7e7e7] hover:bg-gray-50'
          }`}
          onClick={() => onSort?.('team_name')}
        >
          <div className="flex items-center gap-1">
            <h4 className={`font-semibold text-sm ${
              sortBy === 'team_name'
                ? (darkMode ? 'text-[#FF5733]' : 'text-[#8c1a10]')
                : (darkMode ? 'text-slate-300' : 'text-[#6d6d6d]')
            }`}>
              Equipo
            </h4>
            {sortBy === 'team_name' ? (
              sortOrder === 'asc' ? (
                <ArrowUp className={`w-3 h-3 ${darkMode ? 'text-[#FF5733]' : 'text-[#8c1a10]'}`} />
              ) : (
                <ArrowDown className={`w-3 h-3 ${darkMode ? 'text-[#FF5733]' : 'text-[#8c1a10]'}`} />
              )
            ) : (
              <ArrowUpDown className={`w-3 h-3 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`} />
            )}
          </div>
        </div>

        {/* Headers scrolleables */}
        <div
          ref={headerScrollRef}
          className="flex-1 overflow-x-auto scrollbar-hide"
          onScroll={(e) => handleScroll(e.currentTarget.scrollLeft)}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div
            className="flex items-stretch"
            style={{
              minWidth: `${selectedCategories.reduce((sum, cat) => sum + calculateColumnWidth(cat), 0)}px`,
            }}
          >
            {selectedCategories.map((category, index, array) => {
              const isActive = sortBy === category.key;
              const isCalculated = CALCULATED_FIELDS.has(category.key);
              const isScraped = SCRAPED_FIELDS.has(category.key);
              
              const getSortIcon = () => {
                if (!isActive) return <ArrowUpDown className={`w-3 h-3 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`} />;
                const iconColor = darkMode ? 'text-[#FF5733]' : 'text-[#8c1a10]';
                return sortOrder === 'asc'
                  ? <ArrowUp className={`w-3 h-3 ${iconColor}`} />
                  : <ArrowDown className={`w-3 h-3 ${iconColor}`} />;
              };

              const columnWidth = calculateColumnWidth(category);

              return (
                <div
                  key={category.key}
                  className={`p-4 text-center border-r last:border-r-0 flex-shrink-0 self-stretch cursor-pointer transition-colors relative ${
                    darkMode
                      ? `border-slate-700 hover:bg-slate-700/50 ${isActive ? 'bg-slate-700/50' : ''}`
                      : `border-[#e7e7e7] hover:bg-gray-50 ${isActive ? 'bg-gray-50' : ''}`
                  }`}
                  style={{
                    width: `${columnWidth}px`,
                  }}
                  onClick={() => onSort?.(category.key)}
                >
                  {/* Indicador de campo calculado - esquina superior derecha */}
                  {isCalculated && (
                    <div 
                      className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-sm shadow-sm"
                      title="Campo calculado automáticamente mediante fórmula"
                    />
                  )}
                  {/* Indicador de campo scrapeado - esquina superior izquierda */}
                  {isScraped && (
                    <div 
                      className="absolute top-1 left-1 w-2 h-2 bg-gradient-to-br from-purple-400 to-violet-500 rounded-sm shadow-sm"
                      title="Campo obtenido mediante scraping de Transfermarkt"
                    />
                  )}
                  <div className="flex items-center justify-center gap-1">
                    <h4 className={`font-semibold text-sm ${
                      isActive
                        ? (darkMode ? 'text-[#FF5733]' : 'text-[#8c1a10]')
                        : (darkMode ? 'text-slate-300' : 'text-[#6d6d6d]')
                    }`}>
                      {category.label}
                    </h4>
                    {getSortIcon()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna fija - Actions */}
        <div className={`w-24 p-4 text-center border-l flex-shrink-0 ${
          darkMode ? 'border-slate-700' : 'border-[#e7e7e7]'
        }`}>
          <h4 className={`font-semibold text-sm ${darkMode ? 'text-slate-300' : 'text-[#6d6d6d]'}`}>
            Acciones
          </h4>
        </div>
      </div>

      {/* FILAS DE EQUIPOS */}
      <div className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-[#e7e7e7]'}`}>
        {teams.map((team, index) => (
          <div
            key={team.id_team}
            className={`flex items-stretch transition-colors ${
              darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
            }`}
          >
            {/* Columna fija - ID */}
            <div className={`w-24 p-4 border-r flex-shrink-0 sticky left-0 z-10 ${
              darkMode ? 'border-slate-700 bg-[#131921]' : 'border-[#e7e7e7] bg-white'
            }`}>
              <p className={`font-medium text-sm ${darkMode ? 'text-slate-300' : 'text-[#6d6d6d]'}`}>
                {team.displayId ?? team.id_team}
              </p>
            </div>

            {/* Columna fija - Team Info */}
            <div className={`w-80 p-4 border-r flex-shrink-0 ${
              darkMode ? 'border-slate-700' : 'border-[#e7e7e7]'
            }`}>
              <h3 className={`${isDuplicate('team_name', team.team_name) ? 'font-semibold' : 'font-normal'} ${darkMode ? 'text-white' : 'text-[#000000]'}`}>
                {team.team_name}
              </h3>
            </div>

            {/* Valores scrolleables */}
            <div
              ref={(el) => {
                if (el) rowScrollRefs.current[index] = el;
              }}
              className="flex-1 overflow-x-auto scrollbar-hide"
              onScroll={(e) => handleScroll(e.currentTarget.scrollLeft)}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <div
                className="flex items-stretch"
                style={{
                  minWidth: `${selectedCategories.reduce((sum, cat) => sum + calculateColumnWidth(cat), 0)}px`,
                }}
              >
                {selectedCategories.map((category, catIndex, array) => {
                  const value = category.getValue(team);
                  const isEditable = !NON_EDITABLE_FIELDS.has(category.key);
                  const fieldType = getFieldType(category.key);
                  const columnWidth = calculateColumnWidth(category);

                  // Verificar si es un campo que puede tener duplicados
                  const isUrlField = category.key === 'url_trfm' || category.key === 'fm_guide';
                  const hasDuplicate = isUrlField && isDuplicate(category.key as 'url_trfm' | 'fm_guide', value as string | null);

                  let formattedValue = category.format
                    ? category.format(value)
                    : value || "N/A";

                  // Ensure formattedValue is always a string
                  if (typeof formattedValue === 'object') {
                    formattedValue = JSON.stringify(formattedValue);
                  } else if (formattedValue === null || formattedValue === undefined) {
                    formattedValue = "N/A";
                  } else {
                    formattedValue = String(formattedValue);
                  }

                  return (
                    <div
                      key={`${team.id_team}-${category.key}`}
                      className={`text-center border-r last:border-r-0 flex-shrink-0 self-stretch p-4 ${
                        darkMode ? 'border-slate-700' : 'border-[#e7e7e7]'
                      }`}
                      style={{
                        width: `${columnWidth}px`,
                      }}
                    >
                      {category.key === 'url_trfm_broken' ? (
                        // Mostrar icono de alerta si url_trfm está roto, o guión si está OK
                        <div className="flex items-center justify-center" title={team.url_trfm_broken ? "URL TRFM roto - detectado en scraping" : "URL TRFM OK"}>
                          {team.url_trfm_broken ? (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </div>
                      ) : isEditable ? (
                        <EditableCell
                          value={value ?? null}
                          playerId={team.id_team}
                          fieldName={category.key}
                          onSave={handleSaveField}
                          type={fieldType}
                          isBold={hasDuplicate}
                        />
                      ) : (
                        <p className={`${hasDuplicate ? 'font-semibold' : 'font-medium'} break-words ${
                          darkMode ? 'text-white' : 'text-[#000000]'
                        }`}>
                          {formattedValue}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna fija - Actions */}
            <div className={`w-24 p-4 text-center border-l flex-shrink-0 ${
              darkMode ? 'border-slate-700' : 'border-[#e7e7e7]'
            }`}>
              <div className="flex items-center justify-center gap-2">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(team.id_team);
                    }}
                    title="Editar equipo"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(team.id_team);
                    }}
                    title="Eliminar equipo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Leyenda de campos automáticos */}
      <div className={`px-4 py-3 border-t ${
        darkMode 
          ? 'bg-[#0f1419] border-slate-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-sm shadow-sm" />
            <span>Campo calculado automáticamente mediante fórmula</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-gradient-to-br from-purple-400 to-violet-500 rounded-sm shadow-sm" />
            <span>Campo obtenido mediante scraping de Transfermarkt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
