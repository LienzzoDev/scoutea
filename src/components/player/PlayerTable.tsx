"use client";

import { ArrowRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";

import BookmarkButton from "@/components/ui/bookmark-button";
import PlayerAvatar from "@/components/ui/player-avatar";
import FlagIcon from "@/components/ui/flag-icon";
import TeamBadge from "@/components/ui/team-badge";
import type { Player } from "@/types/player";

interface Category {
  key: string;
  label: string;
  getValue: (player: Player) => string | number | null | undefined;
  format?: (value: unknown) => string;
}

interface PlayerTableProps {
  players: Player[];
  selectedCategories: Category[];
  isInList: (_playerId: string) => boolean;
  addToList: (_playerId: string) => Promise<boolean>;
  removeFromList: (_playerId: string) => Promise<boolean>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (categoryKey: string) => void;
}

export default function PlayerTable({
  players,
  selectedCategories,
  isInList,
  addToList,
  removeFromList,
  sortBy,
  sortOrder,
  onSort,
}: PlayerTableProps) {
  const _router = useRouter();
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

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6d6d6d] text-lg">
          No se encontraron jugadores
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#e7e7e7] overflow-hidden">
      {/* HEADER */}
      <div className="bg-[#f8f9fa] border-b border-[#e7e7e7] flex">
        {/* Columna fija - Player Info */}
        <div className="w-80 p-4 border-r border-[#e7e7e7] flex-shrink-0">
          <h4 className="font-semibold text-[#6d6d6d] text-sm">
            Player Info
          </h4>
        </div>

        {/* Headers scrolleables */}
        <div
          ref={headerScrollRef}
          className="flex-1 overflow-x-auto scrollbar-hide"
          onScroll={(e) => handleScroll(e.currentTarget.scrollLeft)}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div
            className="flex"
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
                if (!isActive) return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
                return sortOrder === 'asc' 
                  ? <ArrowUp className="w-3 h-3 text-[#8c1a10]" />
                  : <ArrowDown className="w-3 h-3 text-[#8c1a10]" />;
              };

              return (
                <div
                  key={category.key}
                  className={`p-4 text-center border-r border-[#e7e7e7] last:border-r-0 flex-shrink-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-gray-50' : ''
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
                      isActive ? 'text-[#8c1a10]' : 'text-[#6d6d6d]'
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
        <div className="w-20 p-4 text-center border-l border-[#e7e7e7] flex-shrink-0">
          <h4 className="font-semibold text-[#6d6d6d] text-sm">
            Actions
          </h4>
        </div>
      </div>

      {/* FILAS DE JUGADORES */}
      <div className="divide-y divide-[#e7e7e7]">
        {players.map((player, index) => (
          <div
            key={player.id_player}
            className="flex cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() =>
              _router.push(`/member/player/${player.id_player}`)
            }
          >
            {/* Columna fija - Player Info */}
            <div className="w-80 p-4 border-r border-[#e7e7e7] flex-shrink-0">
              <div className="flex items-center gap-4">
                <PlayerAvatar player={player} size="md" showFlag={false} showBadge={false} />
                <div>
                  <h3 className="font-semibold text-[#000000]">
                    {player.player_name}
                  </h3>
                  <p className="text-[#6d6d6d] text-sm">{player.age ? `${player.age} años` : "Edad N/A"} • {" "}
                    {player.nationality_1 || "Nacionalidad N/A"}
                  </p>
                  {player.position_player && (
                    <p className="text-[#8c1a10] text-xs font-medium mt-1">
                      {player.position_player}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Valores scrolleables */}
            <div
              ref={(el) =>{
                if (el) rowScrollRefs.current[index] = el;
              }}
              className="flex-1 overflow-x-auto scrollbar-hide" onScroll={(e) =>
                handleScroll(e.currentTarget.scrollLeft)
              }
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <div
                className="flex"
                style={{
                  minWidth: `${Math.max(
                    selectedCategories.length * 140,
                    100
                  )}px`,
                }}
              >{selectedCategories.map((category, catIndex, array) => {
                  const value = category.getValue(player);
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
                      key={`${player.id_player}-${category.key}`}
                      className={`text-center border-r border-[#e7e7e7] last:border-r-0 flex-shrink-0 ${
                        category.key === "nationality" || category.key === "team" 
                          ? "p-3" 
                          : "p-4"
                      }`}
                      style={{
                        minWidth: "140px",
                        width:
                          array.length <= 4
                            ? `${100 / array.length}%`
                            : "140px",
                      }}
                    >
                      {/* Columna de Nacionalidad - mostrar bandera */}
                      {category.key === "nationality" ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FlagIcon 
                            nationality={player.nationality_1}
                            size="lg"
                          />
                          <p className="font-medium text-[#000000] text-xs text-center">
                            {formattedValue}
                          </p>
                        </div>
                      ) : category.key === "team" ? (
                        /* Columna de Equipo - mostrar escudo */
                        <div className="flex flex-col items-center justify-center gap-2">
                          <TeamBadge 
                            teamName={player.team_name}
                            size="lg"
                          />
                          <p className="font-medium text-[#000000] text-xs text-center">
                            {formattedValue}
                          </p>
                        </div>
                      ) : (
                        /* Otras columnas - mostrar solo texto */
                        <p className="font-medium text-[#000000]">
                          {formattedValue}
                        </p>
                      )}
                      {category.key === "competition" && player.team_name && (
                          <p className="text-[#6d6d6d] text-xs mt-1 truncate">
                            {player.team_name}
                          </p>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna fija - Actions */}
            <div className="w-20 p-4 text-center border-l border-[#e7e7e7] flex-shrink-0">
              <div className="flex items-center justify-center gap-2">
                <BookmarkButton
                  entityId={player.id_player}
                  isBookmarked={isInList(player.id_player)}
                  onToggle={async (playerId) => {
                    if (isInList(playerId)) {
                      await removeFromList(playerId);
                      return false;
                    } else {
                      await addToList(playerId);
                      return true;
                    }
                  }}
                />
                <ArrowRight
                  className="w-4 h-4 text-[#8c1a10] cursor-pointer hover:text-[#8c1a10]/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    _router.push(`/member/player/${player.id_player}`);
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}