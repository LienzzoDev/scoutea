import { NATIONALITIES } from '../constants/nationalities';
import { prisma } from '../lib/db';

async function main() {
  console.log('🔍 Starting Nationality Audit...');

  // 1. Get all players with non-null nationality
  const players = await prisma.jugador.findMany({
    where: {
      nationality_1: {
        not: null
      }
    },
    select: {
      id_player: true,
      player_name: true,
      nationality_1: true
    }
  });

  console.log(`📊 Found ${players.length} players with nationality.`);

  // 2. Identify invalid nationalities
  const invalidPlayers = players.filter(p => {
    if (!p.nationality_1) return false;
    // @ts-ignore - We are checking if the value exists in the array, even if TS thinks it might not match the type
    return !NATIONALITIES.includes(p.nationality_1 as any);
  });

  // 3. Group by invalid nationality for easier cleanup summary
  const invalidCounts: Record<string, number> = {};
  invalidPlayers.forEach(p => {
    const nat = p.nationality_1 as string;
    invalidCounts[nat] = (invalidCounts[nat] || 0) + 1;
  });

  console.log(`⚠️ Found ${invalidPlayers.length} players with invalid nationalities.`);
  
  if (Object.keys(invalidCounts).length > 0) {
    console.log('\n❌ Invalid Nationalities Summary:');
    console.table(Object.entries(invalidCounts).map(([nationality, count]) => ({ nationality, count })));
    
    console.log('\n📝 Detail (First 10):');
    invalidPlayers.slice(0, 10).forEach(p => {
      console.log(`- ${p.player_name}: "${p.nationality_1}"`);
    });
  } else {
    console.log('✅ All nationalities are valid according to the standard list!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
