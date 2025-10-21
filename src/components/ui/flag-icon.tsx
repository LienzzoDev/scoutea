"use client";

import Image from "next/image";

interface FlagIconProps {
  nationality?: string | null;
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

    // Normalizar el nombre (trimear, remover espacios extra)
    const normalizedNationality = nationality.trim().replace(/\s+/g, ' ');

    // Mapeo de nacionalidades a códigos de país
    const countryMap: { [key: string]: string } = {
      // Spanish variants
      Spain: "es",
      España: "es",
      Spanish: "es",
      Español: "es",
      Española: "es",

      France: "fr",
      Francia: "fr",
      French: "fr",
      Francés: "fr",
      Francesa: "fr",

      Germany: "de",
      Alemania: "de",
      German: "de",
      Alemán: "de",
      Alemana: "de",

      Italy: "it",
      Italia: "it",
      Italian: "it",
      Italiano: "it",
      Italiana: "it",

      England: "gb",
      Inglaterra: "gb",
      "United Kingdom": "gb",
      "Reino Unido": "gb",
      English: "gb",
      Inglés: "gb",
      Inglesa: "gb",
      British: "gb",
      Británico: "gb",
      Británica: "gb",

      Brazil: "br",
      Brasil: "br",
      Brazilian: "br",
      Brasileño: "br",
      Brasileña: "br",

      Argentina: "ar",
      Argentinian: "ar",
      Argentino: "ar",
      Argentinian: "ar",

      Portugal: "pt",
      Portuguese: "pt",
      Portugués: "pt",
      Portuguesa: "pt",

      Netherlands: "nl",
      "Países Bajos": "nl",
      Holanda: "nl",
      Holland: "nl",
      Dutch: "nl",
      Holandés: "nl",
      Holandesa: "nl",

      Belgium: "be",
      Bélgica: "be",
      Belgian: "be",
      Belga: "be",

      Croatia: "hr",
      Croacia: "hr",
      Croatian: "hr",
      Croata: "hr",

      Poland: "pl",
      Polonia: "pl",
      Polish: "pl",
      Polaco: "pl",
      Polaca: "pl",

      Norway: "no",
      Noruega: "no",
      Norwegian: "no",
      Noruego: "no",
      Noruega: "no",

      Denmark: "dk",
      Dinamarca: "dk",
      Danish: "dk",
      Danés: "dk",
      Danesa: "dk",

      Sweden: "se",
      Suecia: "se",
      Swedish: "se",
      Sueco: "se",
      Sueca: "se",

      Switzerland: "ch",
      Suiza: "ch",
      Swiss: "ch",
      Suizo: "ch",
      Suiza: "ch",

      Austria: "at",
      Austrian: "at",
      Austriaco: "at",
      Austriaca: "at",

      "United States": "us",
      "Estados Unidos": "us",
      USA: "us",
      "EE.UU.": "us",
      American: "us",
      Americano: "us",
      Americana: "us",

      Canada: "ca",
      Canadá: "ca",
      Canadian: "ca",
      Canadiense: "ca",

      Mexico: "mx",
      México: "mx",
      Mexican: "mx",
      Mexicano: "mx",
      Mexicana: "mx",

      Colombia: "co",
      Colombian: "co",
      Colombiano: "co",
      Colombiana: "co",

      Venezuela: "ve",
      Venezuelan: "ve",
      Venezolano: "ve",
      Venezolana: "ve",

      Ecuador: "ec",
      Ecuadorian: "ec",
      Ecuatoriano: "ec",
      Ecuatoriana: "ec",

      Peru: "pe",
      Perú: "pe",
      Peruvian: "pe",
      Peruano: "pe",
      Peruana: "pe",

      Chile: "cl",
      Chilean: "cl",
      Chileno: "cl",
      Chilena: "cl",

      Uruguay: "uy",
      Uruguayan: "uy",
      Uruguayo: "uy",
      Uruguaya: "uy",

      Paraguay: "py",
      Paraguayan: "py",
      Paraguayo: "py",
      Paraguaya: "py",

      Japan: "jp",
      Japón: "jp",
      Japanese: "jp",
      Japonés: "jp",
      Japonesa: "jp",

      "South Korea": "kr",
      "Corea del Sur": "kr",
      Korean: "kr",
      Coreano: "kr",
      Coreana: "kr",

      Australia: "au",
      Australian: "au",
      Australiano: "au",
      Australiana: "au",

      Morocco: "ma",
      Marruecos: "ma",
      Moroccan: "ma",
      Marroquí: "ma",

      Tunisia: "tn",
      Túnez: "tn",
      Tunisian: "tn",
      Tunecino: "tn",
      Tunecina: "tn",

      Algeria: "dz",
      Argelia: "dz",
      Algerian: "dz",
      Argelino: "dz",
      Argelina: "dz",

      Egypt: "eg",
      Egipto: "eg",
      Egyptian: "eg",
      Egipcio: "eg",
      Egipcia: "eg",

      Nigeria: "ng",
      Nigerian: "ng",
      Nigeriano: "ng",
      Nigeriana: "ng",

      Ghana: "gh",
      Ghanaian: "gh",
      Ghanés: "gh",
      Ghanesa: "gh",

      Senegal: "sn",
      Senegalese: "sn",
      Senegalés: "sn",
      Senegalesa: "sn",

      "Ivory Coast": "ci",
      "Costa de Marfil": "ci",
      Ivorian: "ci",
      Marfileño: "ci",
      Marfileña: "ci",

      Cameroon: "cm",
      Camerún: "cm",
      Cameroonian: "cm",
      Camerunés: "cm",
      Camerunesa: "cm",

      "South Africa": "za",
      Sudáfrica: "za",
      "South African": "za",
      Sudafricano: "za",
      Sudafricana: "za",
    };

    // Intentar búsqueda exacta (case-insensitive)
    const exactMatch = Object.keys(countryMap).find(
      key => key.toLowerCase() === normalizedNationality.toLowerCase()
    );

    const countryCode = exactMatch ? countryMap[exactMatch] : null;

    if (!countryCode) {
      console.warn(`⚠️ No flag mapping found for nationality: "${nationality}"`);
      return null;
    }

    const resolution = size === "sm" ? "w80" : size === "md" ? "w160" : "w320";
    return `https://flagcdn.com/${resolution}/${countryCode}.png`;
  };

  const flagUrl = nationality ? getCountryFlag(nationality, size) : null;

  if (!flagUrl) {
    // Si no hay bandera, mostrar un div vacío
    return <div className={`${sizeClasses[size]} ${className} bg-gray-200 rounded-sm`} />;
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
