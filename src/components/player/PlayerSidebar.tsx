"use client";

import { Facebook, Twitter, Linkedin, Send } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils/format-money";
import { getValidImageUrl } from "@/lib/utils/image-utils";
import type { Player } from "@/types/player";

interface PlayerSidebarProps {
  player: Player;
}

export default function PlayerSidebar({ player }: PlayerSidebarProps) {
  // Obtener URLs de imágenes válidas (null si son placeholders de Transfermarkt)
  const validGalleryPhoto = getValidImageUrl(player.gallery_photo);
  const validProfilePhoto = getValidImageUrl(player.photo_coverage);

  return (
    <div className="w-80 bg-white rounded-lg p-6 space-y-4 self-start">
      {/* Player Card */}
      <div className="relative">
        {validGalleryPhoto ? (
          <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden relative">
            <Image
              src={validGalleryPhoto}
              alt={player.player_name || "Player"}
              fill
              className="object-cover"
              sizes="320px"
              priority
            />
          </div>
        ) : validProfilePhoto ? (
          <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden relative">
            <Image
              src={validProfilePhoto}
              alt={player.player_name || "Player"}
              fill
              className="object-cover"
              sizes="320px"
            />
          </div>
        ) : (
          <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <Image
              src="/logo-member.svg"
              alt="Scoutea Member Logo"
              width={120}
              height={120}
              className="object-contain opacity-40"
            />
          </div>
        )}
        
        {/* Team badge overlay - Top */}
        {player.team_name && (
          <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/80 text-white px-3 py-2 rounded-full">
            <span className="text-lg">⚽</span>
            <span className="text-sm font-medium">{player.team_name}</span>
          </div>
        )}
        
        {/* Player name and nationality overlay - Bottom */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-black/80 text-white px-3 py-2 rounded-full">
          <span className="text-lg">🇪🇸</span>
          <span className="text-sm font-medium">{player.player_name || "Player Name"}
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
      {player.url_trfm ? (
        <a
          href={player.url_trfm}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button
            variant="outline"
            className="w-full border-[#8c1a10] text-[#8c1a10] hover:bg-[#8c1a10] hover:text-white bg-transparent flex items-center justify-center gap-2"
          >
            www.transfermarkt.com
            <span className="ml-2">↗</span>
          </Button>
        </a>
      ) : (
        <Button
          variant="outline"
          className="w-full border-gray-300 text-gray-400 cursor-not-allowed bg-transparent flex items-center justify-center gap-2"
          disabled
        >
          www.transfermarkt.com
          <span className="ml-2">↗</span>
        </Button>
      )}

      {/* Rating & Market Value */}
      <div className="flex flex-col items-center space-y-3">
        {/* Level, Elo, Ranking */}
        {(player.player_rating || player.player_ranking) && (
          <div className="w-full grid grid-cols-3 gap-2 text-center border-b border-gray-100 pb-3">
            {/* Level */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-[#6d6d6d] uppercase">Nivel</span>
              <span className={`text-xl font-bold ${
                (player.player_rating || 0) >= 90 ? 'text-[#3cc500]' :
                (player.player_rating || 0) >= 70 ? 'text-blue-500' :
                (player.player_rating || 0) >= 50 ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {(player.player_rating || 0) >= 90 ? 'A' :
                 (player.player_rating || 0) >= 70 ? 'B' :
                 (player.player_rating || 0) >= 50 ? 'C' : 'D'}
              </span>
            </div>

            {/* Elo */}
            <div className="flex flex-col items-center border-l border-r border-gray-100">
              <span className="text-xs text-[#6d6d6d] uppercase">Elo</span>
              <span className="text-xl font-bold text-[#2e3138]">
                {player.player_rating ? (player.player_rating / 10).toFixed(1) : '-'}
              </span>
            </div>

            {/* Ranking */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-[#6d6d6d] uppercase">Ranking</span>
              <span className="text-xl font-bold text-[#2e3138]">
                {player.player_ranking ? `#${player.player_ranking}` : '-'}
              </span>
            </div>
          </div>
        )}

        {/* Market Value */}
        {player.player_trfm_value && (
          <div className="text-center pt-1">
            <p className="text-2xl font-bold text-[#8c1a10]">
              {formatMoney(player.player_trfm_value)}
            </p>
            <p className="text-xs text-[#6d6d6d]">Market Value</p>
          </div>
        )}

        {/* Average Report Rating */}
        {player.average_report_rating && player.average_report_rating > 0 && (
          <div className="text-center pt-2 border-t border-gray-100 w-full mt-2">
            <p className="text-sm text-[#6d6d6d] mb-1">Report Rating</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-bold text-[#2e3138]">{player.average_report_rating}</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full flex items-center justify-center ${
                      i < Math.floor(player.average_report_rating || 0) ? 'bg-[#8c1a10]' : 'bg-gray-300'
                    }`}
                  >
                    <span className="text-white text-[8px]">⚽</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}