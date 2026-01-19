import { NATIONALITIES } from '../constants/nationalities';
import { prisma } from '../lib/db';

// Common demonyms/typos to Standard Country Name
// Add more here as needed based on audit results
const CORRECTIONS: Record<string, string> = {
  'french': 'France',
  'italian': 'Italy',
  'spanish': 'Spain',
  'german': 'Germany',
  'english': 'England',
  'portuguese': 'Portugal',
  'brazilian': 'Brazil',
  'argentinian': 'Argentina',
  'argentine': 'Argentina',
  'dutch': 'Netherlands',
  'belgian': 'Belgium',
  'danish': 'Denmark',
  'swedish': 'Sweden',
  'norwegian': 'Norway',
  'finnish': 'Finland',
  'russian': 'Russia',
  'polish': 'Poland',
  'croatian': 'Croatia',
  'serbian': 'Serbia',
  'greek': 'Greece',
  'turkish': 'Turkey',
  'american': 'United States',
  'usa': 'United States',
  'uk': 'United Kingdom', // Or specific country if known
  // Add common lowercase variants just in case
  'france': 'France',
  'italy': 'Italy',
  'spain': 'Spain',
  'germany': 'Germany'
};

async function main() {
  console.log('🧹 Starting Nationality Normalization...');

  // 1. Get all players with non-null nationality
  const players = await prisma.jugador.findMany({
    where: {
      nationality_1: {
        not: null
      }
    },
    select: {
      id_player: true,
      nationality_1: true
    }
  });

  let fixedCount = 0;
  let unfixedCount = 0;

  for (const player of players) {
    if (!player.nationality_1) continue;
    
    // Check if valid
    // @ts-ignore
    if (NATIONALITIES.includes(player.nationality_1)) {
      continue;
    }

    const currentNat = player.nationality_1;
    const lowerNat = currentNat.toLowerCase();
    
    // Check for correction
    const correction = CORRECTIONS[lowerNat] || CORRECTIONS[currentNat];

    if (correction) {
      console.log(`🔧 Fixing Player ${player.id_player}: "${currentNat}" -> "${correction}"`);
      await prisma.jugador.update({
        where: { id_player: player.id_player },
        data: { nationality_1: correction }
      });
      fixedCount++;
    } else {
      console.log(`⚠️ Could not auto-fix Player ${player.id_player}: "${currentNat}"`);
      unfixedCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Fixed: ${fixedCount}`);
  console.log(`❌ Unfixed (Manual review needed): ${unfixedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
