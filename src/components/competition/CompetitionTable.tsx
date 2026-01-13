"use client";

import { ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";

import EditableCell from "@/components/admin/EditableCell";
import { Button } from "@/components/ui/button";
import type { Competition } from "@/lib/services/competition-service";

// Campos NO editables (campos calculados y IDs del sistema)
const NON_EDITABLE_FIELDS = new Set([
  'id_competition',
  'createdAt',
  'updatedAt',
  'competition_trfm_value_norm',  // Normalización de competition_trfm_value
  'competition_rating_norm',      // Normalización de competition_rating
]);

// Campos CALCULADOS automáticamente mediante fórmulas
const CALCULATED_FIELDS = new Set([
  'competition_trfm_value_norm',
  'competition_rating_norm',
]);

// Campos obtenidos mediante SCRAPING de Transfermarkt
const SCRAPED_FIELDS = new Set([
  'competition_name',
  'competition_country',
  'competition_trfm_value',
  'competition_rating',
]);

interface Category {
  key: string;
  label: string;
  getValue: (competition: Competition) => string | number | null | undefined;
  format?: (value: unknown) => string;
}

interface CompetitionTableProps {
  competitions: Competition[];
  selectedCategories: Category[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (categoryKey: string) => void;
  loading?: boolean;
  darkMode?: boolean;
  onEdit?: (competitionId: string) => void;
  onDelete?: (competitionId: string) => void;
}

export default function CompetitionTable({
  competitions,
  selectedCategories,
  sortBy,
  sortOrder,
  onSort,
  loading,
  darkMode = false,
  onEdit,
  onDelete,
}: CompetitionTableProps) {
  const router = useRouter();
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const rowScrollRefs = useRef<HTMLDivElement[]>([]);

  // Calcular valores duplicados para competition_name y url_trfm
  const duplicateValues = useMemo(() => {
    const competitionNameCounts = new Map<string, number>();
    const urlTrfmCounts = new Map<string, number>();

    competitions.forEach(comp => {
      // Contar competition_name
      const name = comp.competition_name || comp.name;
      if (name) {
        const lowerName = name.toLowerCase();
        competitionNameCounts.set(lowerName, (competitionNameCounts.get(lowerName) || 0) + 1);
      }
      // Contar url_trfm
      if (comp.url_trfm) {
        const lowerUrl = comp.url_trfm.toLowerCase();
        urlTrfmCounts.set(lowerUrl, (urlTrfmCounts.get(lowerUrl) || 0) + 1);
      }
    });

    return {
      competitionNames: new Set(
        Array.from(competitionNameCounts.entries())
          .filter(([_, count]) => count > 1)
          .map(([name]) => name)
      ),
      urlTrfms: new Set(
        Array.from(urlTrfmCounts.entries())
          .filter(([_, count]) => count > 1)
          .map(([url]) => url)
      )
    };
  }, [competitions]);

  // Función para verificar si un valor está duplicado
  const isDuplicate = (field: 'competition_name' | 'url_trfm', value: string | null | undefined): boolean => {
    if (!value) return false;
    const lowerValue = value.toLowerCase();
    switch (field) {
      case 'competition_name':
        return duplicateValues.competitionNames.has(lowerValue);
      case 'url_trfm':
        return duplicateValues.urlTrfms.has(lowerValue);
      default:
        return false;
    }
  };

  // Función para calcular el ancho de columna basado en el contenido
  const calculateColumnWidth = (category: Category): number => {
    const MIN_WIDTH = 140;
    const PADDING = 32;
    const CHAR_WIDTH = 8;

    let maxWidth = category.label.length * CHAR_WIDTH + PADDING;

    competitions.forEach(competition => {
      const value = category.getValue(competition);
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

    return Math.max(MIN_WIDTH, Math.min(maxWidth, 400));
  };

  // Función para determinar el tipo de campo
  const getFieldType = (fieldName: string): 'text' | 'number' | 'boolean' | 'url' | 'date' => {
    // Campos de URL
    if (fieldName.startsWith('url_')) {
      return 'url';
    }

    // Campos numéricos
    if (fieldName.includes('value') || fieldName.includes('elo') ||
        fieldName.includes('rating') || fieldName.includes('norm') ||
        fieldName.includes('tier')) {
      return 'number';
    }

    // Por defecto, texto
    return 'text';
  };

  // Función para guardar cambios en campos editables
  const handleSaveField = async (
    competitionId: string | number,
    fieldName: string,
    value: string | number | boolean
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/competitions/${competitionId}`, {
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
      console.error('Error updating competition field:', error);
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

  if (competitions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-[#6d6d6d]'}`}>
          No se encontraron competiciones
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
          onClick={() => onSort?.('id_competition')}
        >
          <div className="flex items-center gap-1">
            <h4 className={`font-semibold text-sm ${
              sortBy === 'id_competition'
                ? (darkMode ? 'text-[#FF5733]' : 'text-[#8c1a10]')
                : (darkMode ? 'text-slate-300' : 'text-[#6d6d6d]')
            }`}>
              ID
            </h4>
            {sortBy === 'id_competition' ? (
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

        {/* Columna fija - Competition Info */}
        <div
          className={`w-64 p-4 border-r flex-shrink-0 cursor-pointer transition-colors ${
            darkMode
              ? 'border-slate-700 hover:bg-slate-700/50'
              : 'border-[#e7e7e7] hover:bg-gray-50'
          }`}
          onClick={() => onSort?.('competition_name')}
        >
          <div className="flex items-center gap-1">
            <h4 className={`font-semibold text-sm ${
              sortBy === 'competition_name'
                ? (darkMode ? 'text-[#FF5733]' : 'text-[#8c1a10]')
                : (darkMode ? 'text-slate-300' : 'text-[#6d6d6d]')
            }`}>
              Competición
            </h4>
            {sortBy === 'competition_name' ? (
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
            {selectedCategories.map((category) => {
              const isActive = sortBy === category.key;
              const isCalculated = CALCULATED_FIELDS.has(category.key);
              const isScraped = SCRAPED_FIELDS.has(category.key);
              const columnWidth = calculateColumnWidth(category);

              const getSortIcon = () => {
                if (!isActive) return <ArrowUpDown className={`w-3 h-3 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`} />;
                const iconColor = darkMode ? 'text-[#FF5733]' : 'text-[#8c1a10]';
                return sortOrder === 'asc'
                  ? <ArrowUp className={`w-3 h-3 ${iconColor}`} />
                  : <ArrowDown className={`w-3 h-3 ${iconColor}`} />;
              };

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
                      title="Campo calculado automaticamente mediante formula"
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

      {/* FILAS DE COMPETICIONES */}
      <div className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-[#e7e7e7]'}`}>
        {competitions.map((competition, index) => {
          const displayName = competition.competition_name || competition.name || 'Sin nombre';
          const isNameDuplicate = isDuplicate('competition_name', displayName);

          return (
            <div
              key={competition.id_competition}
              className={`flex items-stretch transition-colors ${
                darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
              }`}
            >
              {/* Columna fija - ID */}
              <div className={`w-24 p-4 border-r flex-shrink-0 sticky left-0 z-10 ${
                darkMode ? 'border-slate-700 bg-[#131921]' : 'border-[#e7e7e7] bg-white'
              }`}>
                <p className={`font-medium text-sm ${darkMode ? 'text-slate-300' : 'text-[#6d6d6d]'}`}>
                  {competition.displayId ?? competition.id_competition.substring(0, 8) + '...'}
                </p>
              </div>

              {/* Columna fija - Competition Info (solo nombre) - Editable */}
              <div className={`w-64 p-4 border-r flex-shrink-0 ${
                darkMode ? 'border-slate-700' : 'border-[#e7e7e7]'
              }`}>
                <EditableCell
                  value={displayName}
                  playerId={competition.id_competition}
                  fieldName="competition_name"
                  onSave={handleSaveField}
                  type="text"
                  isBold={isNameDuplicate}
                />
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
                  {selectedCategories.map((category) => {
                    const value = category.getValue(competition);
                    const isEditable = !NON_EDITABLE_FIELDS.has(category.key);
                    const fieldType = getFieldType(category.key);
                    const columnWidth = calculateColumnWidth(category);

                    // Verificar si url_trfm esta duplicada
                    const isUrlTrfmDuplicate = category.key === 'url_trfm' && isDuplicate('url_trfm', value as string | null | undefined);

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
                        key={`${competition.id_competition}-${category.key}`}
                        className={`text-center border-r last:border-r-0 flex-shrink-0 self-stretch p-4 ${
                          darkMode ? 'border-slate-700' : 'border-[#e7e7e7]'
                        }`}
                        style={{
                          width: `${columnWidth}px`,
                        }}
                      >
                        {isEditable ? (
                          <EditableCell
                            value={value ?? null}
                            playerId={competition.id_competition}
                            fieldName={category.key}
                            onSave={handleSaveField}
                            type={fieldType}
                            isBold={isUrlTrfmDuplicate}
                          />
                        ) : (
                          <p className={`break-words ${
                            isUrlTrfmDuplicate ? 'font-semibold' : 'font-medium'
                          } ${
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
              }`}
              onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center gap-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${darkMode ? 'text-slate-400 hover:text-[#FF5733] hover:bg-slate-700' : 'text-slate-600 hover:text-[#8c1a10]'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(competition.id_competition);
                      }}
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
                        onDelete(competition.id_competition);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda de campos automaticos */}
      <div className={`px-4 py-3 border-t ${
        darkMode
          ? 'bg-[#0f1419] border-slate-700'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-sm shadow-sm" />
            <span>Campo calculado automaticamente mediante formula</span>
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
