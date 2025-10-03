"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useBreadcrumbNavigation } from "@/hooks/useBreadcrumbNavigation";
import type { Player } from "@/types/player";

interface PlayerHeaderProps {
  player: Player;
  isPlayerInList: boolean;
  isSaving: boolean;
  listLoading: boolean;
  onToggleList: () => void;
}

export default function PlayerHeader({
  player,
  isPlayerInList,
  isSaving,
  listLoading,
  onToggleList,
}: PlayerHeaderProps) {
  const { navigateToHome, navigateToPlayers } = useBreadcrumbNavigation();

  // Debug: Log player data in header only when it changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('PlayerHeader: received player data:', player);
      console.log('PlayerHeader: player_name:', player?.player_name);
    }
  }, [player]);

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6d6d6d] mb-6">
        <button
          onClick={navigateToHome}
          className="hover:text-[#8c1a10] hover:underline transition-colors cursor-pointer"
          title="Ir al dashboard principal"
        >
          Wonderkids
        </button>
        <span className="text-gray-400">›</span>
        <button
          onClick={navigateToPlayers}
          className="hover:text-[#8c1a10] hover:underline transition-colors cursor-pointer"
          title="Volver a la página anterior"
        >
          Players
        </button>
        <span className="text-gray-400">›</span>
        <span className="text-[#2e3138] font-medium">
          {player.player_name || "Player Name"}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#2e3138]">{player.player_name || "Player Name"}
        </h1>
        <Button
          onClick={onToggleList}
          disabled={isSaving || listLoading}
          className={`${
            isPlayerInList
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-[#8c1a10] hover:bg-[#8c1a10]/90 text-white"
          } flex items-center gap-2`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isPlayerInList ? "Removing..." : "Adding..."}
            </>
          ) : (
            <>
              {isPlayerInList ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  In My List
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  Add to List
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </>
  );
}