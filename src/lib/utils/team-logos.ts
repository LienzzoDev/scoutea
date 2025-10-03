/**
 * Mapeo centralizado de equipos de fútbol con sus logos
 * Incluye URL principal y fallback para cada equipo
 */

export interface TeamLogoData {
  primary: string;
}

export const TEAM_LOGOS: { [key: string]: TeamLogoData } = {
  // Equipos españoles
  "Real Madrid": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Real-Madrid-Logo.png"
  },
  "FC Barcelona": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Barcelona-Logo.png"
  },
  "Atletico Madrid": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Atletico-Madrid-Logo.png"
  },
  "Atlético Madrid": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Atletico-Madrid-Logo.png"
  },
  "Valencia": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Valencia-Logo.png"
  },
  "Sevilla": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Sevilla-Logo.png"
  },
  "Real Sociedad": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Real-Sociedad-Logo.png"
  },
  "Athletic Bilbao": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Athletic-Bilbao-Logo.png"
  },

  // Equipos ingleses
  "Manchester City": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Manchester-City-Logo.png"
  },
  "Arsenal": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png"
  },
  "Manchester United": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Manchester-United-Logo.png"
  },
  "Liverpool": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Liverpool-Logo.png"
  },
  "Chelsea": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Chelsea-Logo.png"
  },
  "Tottenham": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Tottenham-Logo.png"
  },
  "Leicester City": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Leicester-City-Logo.png"
  },
  "West Ham": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/West-Ham-Logo.png"
  },
  "Everton": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Everton-Logo.png"
  },

  // Equipos alemanes
  "Bayern Munich": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Bayern-Munich-Logo.png"
  },
  "Borussia Dortmund": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Borussia-Dortmund-Logo.png"
  },
  "RB Leipzig": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/RB-Leipzig-Logo.png"
  },
  "Bayer Leverkusen": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Bayer-Leverkusen-Logo.png"
  },

  // Equipos franceses
  "Paris Saint-Germain": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Paris-Saint-Germain-Logo.png"
  },
  "PSG": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Paris-Saint-Germain-Logo.png"
  },

  // Equipos italianos
  "Juventus": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Juventus-Logo.png"
  },
  "AC Milan": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/AC-Milan-Logo.png"
  },
  "Inter Milan": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Inter-Milan-Logo.png"
  },
  "Napoli": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Napoli-Logo.png"
  },
  "AS Roma": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/AS-Roma-Logo.png"
  },
  "Lazio": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Lazio-Logo.png"
  },
  "Atalanta": {
    primary: "https://logos-world.net/wp-content/uploads/2020/06/Atalanta-Logo.png"
  },
};

/**
 * Mapeo de nombres de equipos a sus API IDs para las APIs de logos
 * Basado en los mismos IDs que se usan en la página de jobs
 */
export const TEAM_API_IDS: { [key: string]: number } = {
  // Equipos españoles (La Liga)
  "Real Madrid": 86,
  "FC Barcelona": 81,
  "Barcelona": 81,
  "Atletico Madrid": 78,
  "Atlético Madrid": 78,
  "Sevilla FC": 559,
  "Sevilla": 559,
  "Valencia CF": 95,
  "Valencia": 95,
  "Villarreal CF": 94,
  "Villarreal": 94,
  "Real Betis": 90,
  "Betis": 90,
  "Real Sociedad": 92,
  "Athletic Bilbao": 77,
  "Athletic Club": 77,
  "Getafe CF": 82,
  "Getafe": 82,
  "RCD Espanyol": 80,
  "Espanyol": 80,
  "Málaga CF": 89,
  "Málaga": 89,

  // Equipos ingleses (Premier League)
  "Manchester City": 50,
  "Arsenal": 42,
  "Manchester United": 66,
  "Liverpool": 40,
  "Chelsea": 49,
  "Tottenham": 47,
  "Tottenham Hotspur": 47,
  "Leicester City": 46,
  "West Ham": 48,
  "West Ham United": 48,
  "Everton": 45,
  "Newcastle United": 34,
  "Newcastle": 34,
  "Brighton": 51,
  "Brighton & Hove Albion": 51,
  "Aston Villa": 66,
  "Crystal Palace": 52,
  "Fulham": 36,
  "Brentford": 55,
  "Wolverhampton": 39,
  "Wolves": 39,

  // Equipos alemanes (Bundesliga)
  "Bayern Munich": 157,
  "Bayern München": 157,
  "Borussia Dortmund": 165,
  "RB Leipzig": 173,
  "Bayer Leverkusen": 168,
  "Eintracht Frankfurt": 169,
  "Borussia Mönchengladbach": 163,
  "VfL Wolfsburg": 178,
  "Wolfsburg": 178,
  "SC Freiburg": 160,
  "Freiburg": 160,
  "Union Berlin": 28,
  "VfB Stuttgart": 10,
  "Stuttgart": 10,

  // Equipos franceses (Ligue 1)
  "Paris Saint-Germain": 85,
  "PSG": 85,
  "Marseille": 79,
  "Olympique Marseille": 79,
  "AS Monaco": 91,
  "Monaco": 91,
  "Lyon": 80,
  "Olympique Lyon": 80,
  "Lille": 93,
  "LOSC Lille": 93,
  "Rennes": 94,
  "Stade Rennais": 94,

  // Equipos italianos (Serie A)
  "Juventus": 109,
  "AC Milan": 98,
  "Milan": 98,
  "Inter Milan": 108,
  "Inter": 108,
  "Napoli": 113,
  "AS Roma": 100,
  "Roma": 100,
  "Lazio": 110,
  "Atalanta": 102,
  "Fiorentina": 99,
  "ACF Fiorentina": 99,
  "Torino": 586,
  "Bologna": 103,
  "Udinese": 115,
  "Sassuolo": 471,
  "Sampdoria": 584,

  // Equipos portugueses
  "FC Porto": 503,
  "Porto": 503,
  "Benfica": 496,
  "SL Benfica": 496,
  "Sporting CP": 498,
  "Sporting": 498,
  "Sporting Lisbon": 498,

  // Equipos holandeses
  "Ajax": 678,
  "PSV Eindhoven": 674,
  "PSV": 674,
  "Feyenoord": 675,

  // Equipos belgas
  "Club Brugge": 569,
  "Anderlecht": 563,
  "Genk": 572,

  // Equipos austriacos
  "Red Bull Salzburg": 702,
  "Salzburg": 702,

  // Equipos suizos
  "Young Boys": 635,
  "Basel": 636,

  // Equipos escoceses
  "Celtic": 732,
  "Rangers": 731,

  // Equipos turcos
  "Galatasaray": 610,
  "Fenerbahce": 611,
  "Besiktas": 612,

  // Equipos griegos
  "Olympiacos": 523,
  "Panathinaikos": 524,

  // Equipos ucranianos
  "Shakhtar Donetsk": 548,
  "Dynamo Kyiv": 546,

  // Equipos rusos
  "Zenit": 597,
  "CSKA Moscow": 579,
  "Spartak Moscow": 598,

  // Equipos croatas
  "Dinamo Zagreb": 610,

  // Equipos serbios
  "Red Star Belgrade": 576,
  "Partizan": 577,

  // Equipos checos
  "Slavia Prague": 664,
  "Sparta Prague": 665,

  // Equipos daneses
  "FC Copenhagen": 445,
  "Copenhagen": 445,

  // Equipos suecos
  "Malmö FF": 604,
  "Malmö": 604,

  // Equipos noruegos
  "Molde": 703,
  "Rosenborg": 704,

  // Equipos brasileños
  "Flamengo": 1371,
  "Palmeiras": 1372,
  "São Paulo": 1373,
  "Corinthians": 1374,
  "Santos": 1375,
  "Grêmio": 1376,
  "Internacional": 1377,

  // Equipos argentinos
  "Boca Juniors": 451,
  "River Plate": 435,
  "Racing Club": 1062,
  "Independiente": 1063,
  "San Lorenzo": 1064,

  // Equipos mexicanos
  "Club América": 1032,
  "América": 1032,
  "Chivas": 1033,
  "Guadalajara": 1033,
  "Cruz Azul": 1034,
  "Pumas": 1035,
  "UNAM": 1035,

  // Equipos estadounidenses (MLS)
  "LA Galaxy": 1204,
  "Los Angeles FC": 1205,
  "LAFC": 1205,
  "Atlanta United": 1206,
  "New York City FC": 1207,
  "NYCFC": 1207,
  "Seattle Sounders": 1208,
  "Portland Timbers": 1209,

  // Equipos japoneses
  "Kashima Antlers": 1301,
  "Urawa Red Diamonds": 1302,
  "Gamba Osaka": 1303,

  // Equipos australianos
  "Melbourne Victory": 1401,
  "Sydney FC": 1402,
  "Western Sydney Wanderers": 1403,

  // Equipos sudafricanos
  "Kaizer Chiefs": 1501,
  "Orlando Pirates": 1502,
  "Mamelodi Sundowns": 1503,

  // Equipos de otros países
  "Al Hilal": 1601, // Arabia Saudí
  "Al Nassr": 1602, // Arabia Saudí
  "Persepolis": 1701, // Irán
  "Esteghlal": 1702, // Irán
};

/**
 * Obtiene los datos del logo de un equipo
 * @param teamName Nombre del equipo
 * @returns Datos del logo (primary y fallback URLs) o null si no se encuentra
 */
export function getTeamLogoData(teamName: string): TeamLogoData | null {
  if (!teamName) return null;
  return TEAM_LOGOS[teamName] || null;
}

/**
 * Obtiene el API ID de un equipo para usar con las APIs de logos
 * @param teamName Nombre del equipo
 * @returns API ID del equipo o un ID genérico si no se encuentra
 */
export function getTeamApiId(teamName: string): number {
  if (!teamName) return 1; // ID genérico por defecto
  
  // Buscar el ID exacto
  const exactMatch = TEAM_API_IDS[teamName];
  if (exactMatch) return exactMatch;
  
  // Buscar coincidencias parciales (case insensitive)
  const normalizedName = teamName.toLowerCase();
  for (const [key, value] of Object.entries(TEAM_API_IDS)) {
    if (key.toLowerCase().includes(normalizedName) || normalizedName.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Si no se encuentra, generar un ID basado en el hash del nombre
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    const char = teamName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Asegurar que el ID esté en un rango válido (1-2000)
  return Math.abs(hash % 2000) + 1;
}

/**
 * Genera iniciales para equipos no mapeados
 * @param teamName Nombre del equipo
 * @returns Iniciales del equipo (máximo 3 caracteres)
 */
export function generateTeamInitials(teamName: string): string {
  // Crear iniciales del equipo (máximo 3 caracteres)
  return teamName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 3)
    .toUpperCase();
}