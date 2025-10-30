"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useBreadcrumbNavigation } from "@/hooks/useBreadcrumbNavigation";
import { getValidImageUrl } from "@/lib/utils/image-utils";
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

  // Validar que la foto no sea una imagen por defecto de Transfermarkt
  const validProfilePhoto = getValidImageUrl(player.photo_coverage);

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
        <div className="flex items-center gap-4">
          {/* Profile Photo */}
          {validProfilePhoto ? (
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm">
              <Image
                src={validProfilePhoto}
                alt={player.player_name || "Player"}
                fill
                className="object-cover"
                sizes="80px"
                priority
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-gray-200 shadow-sm">
              <span className="text-2xl font-bold text-gray-500">
                {player.player_name?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
          )}

          <h1 className="text-3xl font-bold text-[#2e3138]">{player.player_name || "Player Name"}
          </h1>
        </div>

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