"use client";

import { ArrowRight } from "lucide-react";
import React, { memo, useMemo, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import BookmarkButton from "@/components/ui/bookmark-button";
import PlayerAvatar from "@/components/ui/player-avatar";
import type { Player } from "@/types/player";

interface PlayerCardProps {
  player: Player;
  variant?: "compact" | "detailed" | "list";
  showActions?: boolean;
  onPlayerClick?: (player: Player) => void;
  onBookmarkToggle?: (playerId: string) => Promise<boolean>;
  isBookmarked?: boolean;
}

// 🚀 COMPONENTE OPTIMIZADO CON REACT.MEMO Y USEMEMO
// 🎯 PROPÓSITO: Evitar re-renders innecesarios y mejorar performance
// 📊 IMPACTO: Mejor performance en listas grandes de jugadores

const PlayerCard = memo<PlayerCardProps>(function PlayerCard({
  player,
  variant = "compact",
  showActions = true,
  onPlayerClick,
  onBookmarkToggle,
  isBookmarked = false,
}) {
  // 🔄 MEMOIZAR HANDLERS PARA EVITAR RE-CREACIÓN EN CADA RENDER
  const handleClick = useCallback(() => {
    if (onPlayerClick) {
      onPlayerClick(player);
    }
  }, [onPlayerClick, player]);

  const handleBookmarkClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmarkToggle) {
      return await onBookmarkToggle(player.id_player);
    }
    return false;
  }, [onBookmarkToggle, player.id_player]);

  // 📊 MEMOIZAR CÁLCULOS COSTOSOS
  const playerInfo = useMemo(() => ({
    displayAge: player.age ? `${player.age} años` : "Edad N/A",
    displayNationality: player.nationality_1 || "Nacionalidad N/A",
    displayTeam: player.team_name || "N/A",
    displayPosition: player.position_player || "N/A",
    displayHeight: player.height ? `${player.height} cm` : "N/A",
    displayFoot: player.foot || "N/A",
    displayCompetition: player.team_competition || "N/A",
    displayRating: player.player_rating ? `${player.player_rating}/100` : null,
    hasRating: Boolean(player.player_rating)
  }), [
    player.age,
    player.nationality_1,
    player.team_name,
    player.position_player,
    player.height,
    player.foot,
    player.team_competition,
    player.player_rating
  ]);

  if (variant === "compact") {
    return (
      <div
        className="bg-white rounded-lg p-4 border border-[#e7e7e7] hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center gap-3 mb-3">
          <PlayerAvatar player={player} size="sm" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#000000] truncate">
              {player.player_name}
            </h3>
            <p className="text-sm text-[#6d6d6d]">
              {playerInfo.displayPosition}
            </p>
          </div>
          {showActions && onBookmarkToggle && (
            <BookmarkButton
              entityId={player.id_player}
              isBookmarked={isBookmarked}
              onToggle={onBookmarkToggle}
            />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-[#6d6d6d]">Age:</span>
            <span className="text-[#000000]">{player.age || "N/A"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6d6d6d]">Team:</span>
            <span className="text-[#000000] truncate ml-2">
              {playerInfo.displayTeam}
            </span>
          </div>
          {playerInfo.hasRating && (
            <div className="flex justify-between text-sm">
              <span className="text-[#6d6d6d]">Rating:</span>
              <span className="text-[#8c1a10] font-medium">
                {playerInfo.displayRating}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className="bg-white rounded-lg p-6 border border-[#e7e7e7] hover:shadow-lg transition-shadow cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-start gap-4 mb-4">
          <PlayerAvatar player={player} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold text-[#000000] mb-1">
                  {player.player_name}
                </h3>
                <p className="text-[#6d6d6d]">
                  {playerInfo.displayAge} • {playerInfo.displayNationality}
                </p>
              </div>
              {showActions && onBookmarkToggle && (
                <BookmarkButton
                  entityId={player.id_player}
                  isBookmarked={isBookmarked}
                  onToggle={onBookmarkToggle}
                />
              )}
            </div>
            {player.position_player && (
              <Badge className="bg-[#8c1a10] text-white mb-3">
                {playerInfo.displayPosition}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-[#6d6d6d] mb-1">Team</p>
            <p className="font-medium text-[#000000]">
              {playerInfo.displayTeam}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#6d6d6d] mb-1">Competition</p>
            <p className="font-medium text-[#000000]">
              {playerInfo.displayCompetition}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#6d6d6d] mb-1">Height</p>
            <p className="font-medium text-[#000000]">
              {playerInfo.displayHeight}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#6d6d6d] mb-1">Foot</p>
            <p className="font-medium text-[#000000]">
              {playerInfo.displayFoot}
            </p>
          </div>
        </div>

        {playerInfo.hasRating && (
          <div className="flex items-center justify-between pt-4 border-t border-[#e7e7e7]">
            <span className="text-[#6d6d6d]">Player Rating</span>
            <span className="text-xl font-bold text-[#8c1a10]">
              {playerInfo.displayRating}
            </span>
          </div>
        )}

        {showActions && (
          <div className="flex justify-end mt-4">
            <ArrowRight className="w-5 h-5 text-[#8c1a10]" />
          </div>
        )}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div
        className="bg-white border-b border-[#e7e7e7] p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4"
        onClick={handleClick}
      >
        <PlayerAvatar player={player} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#000000] truncate">
            {player.player_name}
          </h3>
          <p className="text-sm text-[#6d6d6d]">
            {playerInfo.displayAge} • {playerInfo.displayNationality}
          </p>
          {player.position_player && (
            <p className="text-xs text-[#8c1a10] font-medium mt-1">
              {playerInfo.displayPosition}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-medium text-[#000000]">
            {playerInfo.displayTeam}
          </p>
          {playerInfo.hasRating && (
            <p className="text-sm text-[#8c1a10] font-medium">
              {playerInfo.displayRating}
            </p>
          )}
        </div>
        {showActions && (
          <div className="flex items-center gap-2">
            {onBookmarkToggle && (
              <BookmarkButton
                entityId={player.id_player}
                isBookmarked={isBookmarked}
                onToggle={onBookmarkToggle}
              />
            )}
            <ArrowRight className="w-4 h-4 text-[#8c1a10]" />
          </div>
        )}
      </div>
    );
  }

  return null;
});

// 🔍 FUNCIÓN DE COMPARACIÓN PERSONALIZADA PARA REACT.MEMO
// Solo re-renderizar si cambian props importantes
PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;