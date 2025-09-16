"use client";

import { Facebook, Twitter, Linkedin, Send } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import type { Player } from "@/types/player";

interface PlayerSidebarProps {
  player: Player;
}

export default function PlayerSidebar({ player }: PlayerSidebarProps) {
  return (
    <div className="w-80 bg-white rounded-lg p-6 space-y-6 self-start">
      {/* Player Card */}
      <div className="relative">
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <Image
            src="/logo-member.svg"
            alt="Scoutea Member Logo"
            width={120}
            height={120}
            className="object-contain opacity-40"
          />
        </div>
        
        {/* Team badge overlay - Top */}
        <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/80 text-white px-3 py-2 rounded-full">
          <span className="text-lg">⚽</span>
          <span className="text-sm font-medium">
            {player.team_name || "FC Barcelona"}
          </span>
        </div>
        
        {/* Player name and nationality overlay - Bottom */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-black/80 text-white px-3 py-2 rounded-full">
          <span className="text-lg">🇪🇸</span>
          <span className="text-sm font-medium">
            {player.player_name || "Player Name"}
          </span>
        </div>
      </div>

      {/* Social Media - Solo mostrar si hay al menos una red social */}
      {(player.facebook_profile ||
        player.twitter_profile ||
        player.linkedin_profile ||
        player.telegram_profile ||
        player.instagram_profile) && (
        <div>
          <p className="text-[#6d6d6d] text-sm mb-3">On social media</p>
          <div className="flex gap-3">
            {/* Facebook - Solo mostrar si hay datos */}
            {player.facebook_profile && (
              <a
                href={player.facebook_profile}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Facebook className="w-5 h-5 text-[#6d6d6d] hover:text-[#1877f2]" />
              </a>
            )}

            {/* Twitter - Solo mostrar si hay datos */}
            {player.twitter_profile && (
              <a
                href={player.twitter_profile}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Twitter className="w-5 h-5 text-[#6d6d6d] hover:text-[#1da1f2]" />
              </a>
            )}

            {/* LinkedIn - Solo mostrar si hay datos */}
            {player.linkedin_profile && (
              <a
                href={player.linkedin_profile}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Linkedin className="w-5 h-5 text-[#6d6d6d] hover:text-[#0077b5]" />
              </a>
            )}

            {/* Telegram - Solo mostrar si hay datos */}
            {player.telegram_profile && (
              <a
                href={player.telegram_profile}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Send className="w-5 h-5 text-[#6d6d6d] hover:text-[#0088cc]" />
              </a>
            )}

            {/* Instagram - Solo mostrar si hay datos */}
            {player.instagram_profile && (
              <a
                href={player.instagram_profile}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <div className="w-5 h-5 bg-gradient-to-r from-[#f09433] to-[#e6683c] to-[#dc2743] to-[#cc2366] to-[#bc1888] rounded-sm flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Transfer Market Button */}
      <Button
        variant="outline"
        className="w-full border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white bg-transparent flex items-center justify-center gap-2"
      >
        Transfer market
        <span className="ml-2">↗</span>
      </Button>

      {/* Rating */}
      <div>
        <p className="text-[#6d6d6d] text-sm mb-2">
          Soccer player rating
        </p>
        <p className="text-2xl font-bold text-[#8c1a10] mb-2">
          9.000.000 €
        </p>
        <p className="text-sm text-[#6d6d6d]">Rank</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#3cc500] rounded-full"></div>
          <span className="text-sm font-medium">A (7,75) | Rank 495</span>
        </div>
      </div>
    </div>
  );
}