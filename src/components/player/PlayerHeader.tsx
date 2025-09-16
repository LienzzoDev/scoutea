"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  // Debug: Log player data in header
  console.log('PlayerHeader: received player data:', player);
  console.log('PlayerHeader: player_name:', player?.player_name);

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#6d6d6d] mb-6">
        <span>Wonderkids</span>
        <span>›</span>
        <span>Players</span>
        <span>›</span>
        <span className="text-[#2e3138]">
          {player.player_name || "Player Name"}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#2e3138]">
          {player.player_name || "Player Name"}
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