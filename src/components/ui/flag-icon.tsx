"use client";

import Image from "next/image";

interface FlagIconProps {
  nationality?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-10 h-10",
};

export default function FlagIcon({ 
  nationality, 
  size = "md", 
  className = "" 
}: FlagIconProps) {
  // Función para obtener bandera de país
  const getCountryFlag = (nationality: string, size: string) => {
    if (!nationality) return null;

    // Mapeo de nacionalidades a códigos de país
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

    const resolution = size === "sm" ? "w80" : size === "md" ? "w160" : "w320";
    return `https://flagcdn.com/${resolution}/${countryCode}.png`;
  };

  const flagUrl = nationality ? getCountryFlag(nationality, size) : null;

  if (!flagUrl) {
    return <div className={`${sizeClasses[size]} ${className}`} />;
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <Image
        src={flagUrl}
        alt={`${nationality} flag`}
        fill
        className="rounded-sm object-cover drop-shadow-sm"
        style={{ imageRendering: "crisp-edges" }}
        quality={95}
        onError={(e) => {
          const parent = e.currentTarget.parentElement;
          if (parent) {
            parent.style.display = "none";
          }
        }}
      />
    </div>
  );
}