"use client";

import Image from "next/image";

import { getTeamLogoData, generateTeamInitials } from "@/lib/utils/team-logos";

interface EntityData {
  // Player fields
  id_player?: string;
  player_name?: string;
  nationality_1?: string;
  team_name?: string;
  photo_coverage?: string;
  player_rating?: number;

  // Scout fields
  id_scout?: string;
  scout_name?: string;
  name?: string;
  surname?: string;
  nationality?: string;
  country?: string;
  scout_level?: string;
  scout_elo?: number;
  url_profile?: string;
}

interface EntityAvatarProps {
  entity: EntityData;
  type: "player" | "scout";
  size?: "sm" | "md" | "lg" | "xl";
  showFlag?: boolean;
  showBadge?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const flagSizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

const badgeSizeClasses = {
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-7 h-7",
  xl: "w-10 h-10",
};

const iconSizes = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const textSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-xl",
};

export default function EntityAvatar({
  entity,
  type,
  size = "md",
  showFlag = true,
  showBadge = true,
  className = "",
}: EntityAvatarProps) {
  // Función para validar si una string es una URL válida
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false;

    // Check if it's a valid URL (http/https) or a valid path starting with /
    const isAbsoluteUrl = url.startsWith('http://') || url.startsWith('https://');
    const isRelativePath = url.startsWith('/');

    return isAbsoluteUrl || isRelativePath;
  };

  // Función para obtener la imagen principal
  const getEntityImage = (): string =>{
    if (type === "player") {
      const photoUrl = entity.photo_coverage;
      return isValidImageUrl(photoUrl) ? photoUrl! : "/default-avatar.svg";
    } else {
      const profileUrl = entity.url_profile;
      return isValidImageUrl(profileUrl) ? profileUrl! : "/default-avatar.svg";
    }
  };

  // Función para obtener el nombre de la entidad
  const getEntityName = () => {
    if (type === "player") {
      return entity.player_name || "Player";
    } else {
      return entity.scout_name || entity.name || "Scout";
    }
  };

  // Función para obtener la nacionalidad
  const getNationality = () => {
    if (type === "player") {
      return entity.nationality_1;
    } else {
      return entity.nationality || entity.country;
    }
  };

  // Función para obtener bandera de país con múltiples resoluciones
  const getCountryFlag = (nationality: string, size: string) => {
    if (!nationality) return null;

    // Mapeo de nacionalidades a códigos de país (simplificado)
    const countryMap: { [key: string]: string } = {
      Spain: "es",
      España: "es",
      France: "fr",
      Francia: "fr",
      Germany: "de",
      Alemania: "de",
      Italy: "it",
      Italia: "it",
      England: "gb",
      Inglaterra: "gb",
      Brazil: "br",
      Brasil: "br",
      Argentina: "ar",
      Portugal: "pt",
      Netherlands: "nl",
      "Países Bajos": "nl",
      Belgium: "be",
      Bélgica: "be",
      Croatia: "hr",
      Croacia: "hr",
      Poland: "pl",
      Polonia: "pl",
      Norway: "no",
      Noruega: "no",
      Denmark: "dk",
      Dinamarca: "dk",
      Sweden: "se",
      Suecia: "se",
      Switzerland: "ch",
      Suiza: "ch",
      Austria: "at",
      "United States": "us",
      "Estados Unidos": "us",
      Canada: "ca",
      Canadá: "ca",
      Mexico: "mx",
      México: "mx",
      Colombia: "co",
      Venezuela: "ve",
      Ecuador: "ec",
      Peru: "pe",
      Perú: "pe",
      Chile: "cl",
      Uruguay: "uy",
      Paraguay: "py",
      Japan: "jp",
      Japón: "jp",
      "South Korea": "kr",
      "Corea del Sur": "kr",
      Australia: "au",
      Morocco: "ma",
      Marruecos: "ma",
      Tunisia: "tn",
      Túnez: "tn",
      Algeria: "dz",
      Argelia: "dz",
      Egypt: "eg",
      Egipto: "eg",
      Nigeria: "ng",
      Ghana: "gh",
      Senegal: "sn",
      "Ivory Coast": "ci",
      "Costa de Marfil": "ci",
      Cameroon: "cm",
      Camerún: "cm",
      "South Africa": "za",
      Sudáfrica: "za",
    };

    const countryCode = countryMap[nationality];
    if (!countryCode) return null;

    // Usar resolución alta para pantallas de alta densidad (2x-3x el tamaño CSS)
    const resolution =
      size === "sm"
        ? "w80"
        : size === "md"
        ? "w160"
        : size === "lg"
        ? "w320"
        : "w640";
    return `https://flagcdn.com/${resolution}/${countryCode}.png`;
  };



  // Función para obtener color basado en el nivel del scout
  const getScoutLevelColor = (level?: string): string => {
    if (!level) return "bg-gray-500";

    switch (level.toLowerCase()) {
      case "elite":
      case "world class":
        return "bg-purple-500";
      case "excellent":
      case "top":
        return "bg-blue-500";
      case "very good":
      case "good":
        return "bg-green-500";
      case "average":
        return "bg-yellow-500";
      case "below average":
        return "bg-orange-500";
      case "poor":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const entityImage = getEntityImage();
  const entityName = getEntityName();
  const nationality = getNationality();
  const flagUrl = showFlag ? getCountryFlag(nationality || "", size) : null;
  const teamBadgeData =
    showBadge && type === "player" && entity.team_name
      ? getTeamLogoData(entity.team_name)
      : null;

  // Función para crear fallback con iniciales (solo para scouts)
  const createInitialsFallback = (parentElement: HTMLElement) => {
    if (type !== "scout") return;

    const surname = entity.surname || "";
    const initials = `${entityName.charAt(0)}${surname.charAt(
      0
    )}`.toUpperCase();
    const bgColor = getScoutLevelColor(entity.scout_level);

    parentElement.innerHTML = `
      <div class="${
        sizeClasses[size]
      } ${bgColor} rounded-full flex items-center justify-center">
        ${
          initials.length > 1
            ? `<span class="${textSizes[size]} font-semibold text-white">${initials}</span>`
            : `<svg class="${iconSizes[size]} text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`
        }
      </div>
    `;
  };

  // Avatar con imagen unificado (players y scouts)
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <Image
        src={entityImage}
        alt={entityName}
        width={size === "sm" ? 32 : size === "md" ? 48 : size === "lg" ? 64 : 96}
        height={size === "sm" ? 32 : size === "md" ? 48 : size === "lg" ? 64 : 96}
        className="rounded-full object-cover w-full h-full"
        quality={75}

        sizes={`(min-resolution: 2dppx) ${
          size === "sm"
            ? "64px"
            : size === "md"
            ? "96px"
            : size === "lg"
            ? "128px"
            : "192px"
        }, ${
          size === "sm"
            ? "32px"
            : size === "md"
            ? "48px"
            : size === "lg"
            ? "64px"
            : "96px"
        }`}
        onError={(e) =>{
          // Fallback: usar imagen por defecto
          const target = e.target as HTMLImageElement;
          target.src = "/default-avatar.svg";
          
          // Fallback adicional para scouts: mostrar iniciales si no hay imagen por defecto
          if (type === "scout") {
            target.onerror = () => {
              const parent = target.parentElement?.parentElement;
              if (parent) {
                createInitialsFallback(parent);
              }
            };
          }
        }}
      />

      {/* Bandera */}
      {flagUrl && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${flagSizeClasses[size]}`}
        >
          <Image
            src={flagUrl}
            alt={`${nationality} flag`}
            width={size === "sm" ? 16 : size === "md" ? 20 : size === "lg" ? 24 : 32}
            height={size === "sm" ? 16 : size === "md" ? 20 : size === "lg" ? 24 : 32}
            className="rounded-sm object-cover drop-shadow-sm w-full h-full"
            style={{ imageRendering: "crisp-edges" }}
            quality={75}
            sizes={`(min-resolution: 2dppx) ${
              size === "sm"
                ? "32px"
                : size === "md"
                ? "40px"
                : size === "lg"
                ? "48px"
                : "64px"
            }, ${
              size === "sm"
                ? "16px"
                : size === "md"
                ? "20px"
                : size === "lg"
                ? "24px"
                : "32px"
            }`}
            onError={(e) =>{
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.style.display = "none";
              }
            }}
          />
        </div>
      )}

      {/* Escudo del equipo (solo para players) */}
      {showBadge && type === "player" && entity.team_name && (
        <div
          className={`absolute -bottom-0.5 -left-0.5 ${badgeSizeClasses[size]}`}
        >
          {teamBadgeData ? (
            <Image
              src={teamBadgeData.primary}
              alt={`${entity.team_name} badge`}
              width={size === "sm" ? 20 : size === "md" ? 24 : size === "lg" ? 28 : 40}
              height={size === "sm" ? 20 : size === "md" ? 24 : size === "lg" ? 28 : 40}
              className="rounded-sm object-cover drop-shadow-sm w-full h-full"
              style={{ imageRendering: "crisp-edges" }}
              quality={75}
              onError={(e) =>{
                // Si falla la imagen, mostrar fallback de texto
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const initials = generateTeamInitials(entity.team_name || '');
                  parent.innerHTML = `
                    <div class="${badgeSizeClasses[size]} bg-gray-500 rounded-sm flex items-center justify-center text-white font-bold" style="font-size: ${size === "sm" ? "8px" : size === "md" ? "10px" : "12px"};">
                      ${initials}
                    </div>
                  `;
                }
              }}
            />
          ) : (
            // Fallback de texto directo si no hay datos del equipo
            <div className={`${badgeSizeClasses[size]} bg-gray-500 rounded-sm flex items-center justify-center text-white font-bold`} 
                 style={{ fontSize: size === "sm" ? "8px" : size === "md" ? "10px" : "12px" }}>
              {generateTeamInitials(entity.team_name || '')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
