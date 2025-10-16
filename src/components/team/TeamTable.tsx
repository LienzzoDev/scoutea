"use client";

import { ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import TeamBadge from "@/components/ui/team-badge";

interface Team {
  id_team: string;
  team_name: string;
  correct_team_name?: string | null;
  team_country?: string | null;
  url_trfm_advisor?: string | null;
  url_trfm?: string | null;
  owner_club?: string | null;
  owner_club_country?: string | null;
  pre_competition?: string | null;
  competition?: string | null;
  correct_competition?: string | null;
  competition_country?: string | null;
  team_trfm_value?: number | null;
  team_trfm_value_norm?: number | null;
  team_rating?: number | null;
  team_rating_norm?: number | null;
  team_elo?: number | null;
  team_level?: string | null;
  short_name?: string | null;
  founded_year?: number | null;
  stadium?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
}

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
              minWidth: `${Math.max(
                selectedCategories.length * 140,
                100
              )}px`,
            }}
          >
            {selectedCategories.map((category, index, array) => {
              const isActive = sortBy === category.key;
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
                  className={`p-4 text-center border-r last:border-r-0 flex-shrink-0 self-stretch cursor-pointer transition-colors ${
                    darkMode
                      ? `border-slate-700 hover:bg-slate-700/50 ${isActive ? 'bg-slate-700/50' : ''}`
                      : `border-[#e7e7e7] hover:bg-gray-50 ${isActive ? 'bg-gray-50' : ''}`
                  }`}
                  style={{
                    minWidth: "140px",
                    width:
                      array.length <= 4
                        ? `${100 / array.length}%`
                        : "140px",
                  }}
                  onClick={() => onSort?.(category.key)}
                >
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
            className={`flex items-stretch cursor-pointer transition-colors ${
              darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
            }`}
            onClick={() => router.push(`/admin/equipos/${team.id_team}`)}
          >
            {/* Columna fija - Team Info */}
            <div className={`w-80 p-4 border-r flex-shrink-0 ${
              darkMode ? 'border-slate-700' : 'border-[#e7e7e7]'
            }`}>
              <div className="flex items-center gap-4">
                <TeamBadge teamName={team.team_name} size="lg" />
                <div>
                  <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-[#000000]'}`}>
                    {team.team_name}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-[#6d6d6d]'}`}>
                    {team.correct_team_name || team.team_name}
                  </p>
                  {team.short_name && (
                    <p className={`text-xs font-medium mt-1 ${
                      darkMode ? 'text-[#FF5733]' : 'text-[#8c1a10]'
                    }`}>
                      {team.short_name}
                    </p>
                  )}
                </div>
              </div>
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
                  minWidth: `${Math.max(
                    selectedCategories.length * 140,
                    100
                  )}px`,
                }}
              >
                {selectedCategories.map((category, catIndex, array) => {
                  const value = category.getValue(team);
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
                        minWidth: "140px",
                        width:
                          array.length <= 4
                            ? `${100 / array.length}%`
                            : "140px",
                      }}
                    >
                      <p className={`font-medium break-words ${
                        darkMode ? 'text-white' : 'text-[#000000]'
                      }`}>
                        {formattedValue}
                      </p>
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
                      onEdit(team.id_team);
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
                      onDelete(team.id_team);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
