"use client";

import { Facebook, Twitter, Linkedin, Send, Instagram } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { formatMoneyFull } from "@/lib/utils/format-money";
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
    <div className="w-80 flex flex-col gap-4 self-start relative">
      <div className="bg-white rounded-lg p-6 space-y-4 relative">
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

        {/* Transfer Market Button */}
        {player.url_trfm ? (
          <a
            href={player.url_trfm}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-4 block"
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

        {/* Level, Elo, Ranking */}
        {(player.player_rating || player.player_ranking) && (
          <div className="w-full grid grid-cols-3 gap-2 text-center pt-2">
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

        {/* Social Media - Bottom Right of Card */}
        {(player.facebook_profile ||
          player.twitter_profile ||
          player.linkedin_profile ||
          player.telegram_profile ||
          player.instagram_profile) && (
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {/* Facebook */}
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

            {/* Twitter */}
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

            {/* LinkedIn */}
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

            {/* Telegram */}
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

            {/* Instagram */}
            {player.instagram_profile && (
              <a
                href={player.instagram_profile}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                <Instagram className="w-5 h-5 text-[#6d6d6d] hover:text-[#E1306C]" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Stats Container (Market Value & Report Rating) */}
      <div className="bg-white rounded-lg p-6 flex items-center justify-between">
        {/* Market Value */}
        <div className="flex flex-col items-center flex-1 border-r border-gray-100">
          <p className="text-2xl font-bold text-[#8c1a10]">
            {player.player_trfm_value ? formatMoneyFull(player.player_trfm_value) : '-'}
          </p>
          <p className="text-xs text-[#6d6d6d]">Market Value</p>
        </div>

        {/* Average Report Rating */}
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center gap-1 mb-1">
             {[...Array(5)].map((_, i) => (
                <svg 
                  key={i}
                  width="20" 
                  height="21" 
                  viewBox="0 0 33 34" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-5 h-5"
                >
                  <mask id={`mask_rating_${i}`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="33" height="34">
                    <rect x="0.666992" y="0.833496" width="32.333" height="32.333" fill="#D9D9D9"/>
                  </mask>
                  <g mask={`url(#mask_rating_${i})`}>
                    <path 
                      d="M14.6106 27.5083L15.0148 25.6222C15.0822 25.3303 15.2225 25.0889 15.4358 24.8981C15.6491 24.7072 15.9129 24.5893 16.2273 24.5444L20.4036 24.2076C20.6955 24.1627 20.965 24.2188 21.212 24.376C21.459 24.5332 21.6386 24.7465 21.7509 25.0159L22.2897 26.2958C23.1654 25.7794 23.9513 25.1563 24.6473 24.4265C25.3434 23.6968 25.9272 22.8829 26.3987 21.9847L25.9946 21.7826C25.7476 21.603 25.5679 21.3841 25.4557 21.1259C25.3434 20.8677 25.321 20.5926 25.3883 20.3007L26.3314 16.1917C26.3987 15.9223 26.5391 15.6977 26.7524 15.5181C26.9657 15.3385 27.207 15.2262 27.4765 15.1813C27.3642 14.62 27.2239 14.0755 27.0555 13.5478C26.8871 13.0202 26.6682 12.5093 26.3987 12.0154C26.1966 12.1276 25.9777 12.1782 25.742 12.0154C25.5062 12.1557 25.2985 12.0827 25.1189 11.948L21.5488 9.79247C21.3018 9.6353 21.1222 9.42199 21.0099 9.15255C20.8976 8.88311 20.8752 8.60244 20.9425 8.31054L21.212 7.16542C20.5159 6.85107 19.803 6.61531 19.0733 6.45813C18.3435 6.30096 17.597 6.22237 16.8335 6.22237C16.5192 6.22237 16.1936 6.23921 15.8568 6.27289C15.52 6.30657 15.1944 6.35709 14.8801 6.42445L15.8905 8.71471C16.0028 8.98415 16.0308 9.26482 15.9747 9.55671C15.9186 9.84861 15.7782 10.0844 15.5537 10.264L12.3877 13.0258C12.1632 13.2279 11.8994 13.3401 11.5963 13.3626C11.2931 13.385 11.0181 13.3177 10.7711 13.1605L7.67252 11.2744C7.15609 12.1276 6.75754 13.0426 6.47687 14.0193C6.1962 14.9961 6.05587 15.9896 6.05587 17C6.05587 17.3593 6.10077 17.9431 6.19059 18.7514L9.15445 18.482C9.4688 18.4371 9.75508 18.4876 10.0133 18.6335C10.2715 18.7795 10.4567 18.9984 10.569 19.2903L12.1857 23.1298C12.2979 23.3993 12.326 23.68 12.2699 23.9718C12.2137 24.2637 12.0734 24.4995 11.8489 24.6791L10.569 25.7569C11.1753 26.206 11.8208 26.5765 12.5056 26.8683C13.1905 27.1602 13.8921 27.3736 14.6106 27.5083ZM17.0356 21.7153C16.7437 21.7602 16.4743 21.704 16.2273 21.5469C15.9803 21.3897 15.8007 21.1764 15.6884 20.9069L13.8697 16.7306C13.7574 16.4612 13.7406 16.1805 13.8192 15.8886C13.8977 15.5967 14.0493 15.3609 14.2738 15.1813L17.7092 12.2848C17.9113 12.0827 18.1583 11.9705 18.4502 11.948C18.7421 11.9256 19.0115 11.9929 19.2585 12.1501L23.0307 14.373C23.2777 14.5302 23.4685 14.7435 23.6033 15.0129C23.738 15.2824 23.7717 15.563 23.7043 15.8549L22.6265 20.2333C22.5592 20.5252 22.4245 20.7666 22.2224 20.9575C22.0203 21.1483 21.7733 21.2662 21.4814 21.3111L17.0356 21.7153ZM16.8335 30.4721C14.9699 30.4721 13.2185 30.1185 11.5794 29.4112C9.94032 28.7039 8.51452 27.744 7.30204 26.5315C6.08955 25.3191 5.12966 23.8933 4.42238 22.2542C3.71509 20.6151 3.36145 18.8637 3.36145 17C3.36145 15.1364 3.71509 13.385 4.42238 11.7459C5.12966 10.1068 6.08955 8.68103 7.30204 7.46854C8.51452 6.25605 9.94032 5.29617 11.5794 4.58888C13.2185 3.8816 14.9699 3.52795 16.8335 3.52795C18.6972 3.52795 20.4485 3.8816 22.0877 4.58888C23.7268 5.29617 25.1526 6.25605 26.365 7.46854C27.5775 8.68103 28.5374 10.1068 29.2447 11.7459C29.952 13.385 30.3056 15.1364 30.3056 17C30.3056 18.8637 29.952 20.6151 29.2447 22.2542C28.5374 23.8933 27.5775 25.3191 26.365 26.5315C25.1526 27.744 23.7268 28.7039 22.0877 29.4112C20.4485 30.1185 18.6972 30.4721 16.8335 30.4721Z" 
                      fill={i < Math.round(player.average_report_rating || 0) ? "#ef4444" : "#e5e7eb"}
                    />
                  </g>
                </svg>
             ))}
          </div>
          <p className="text-xs text-[#6d6d6d]">Report Rating</p>
          {player.average_report_rating && player.average_report_rating > 0 && (
             <span className="text-xs font-bold text-[#8c1a10] mt-1">{player.average_report_rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </div>
  );
}