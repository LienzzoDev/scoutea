import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLAYER_ROLES = [
  'GK Dominator',
  'GK Reactive',
  'GK Initiator',
  'Central Def Aggressor',
  'Central Def Spreader',
  'Central Def Anchor',
  'Wide Def Overlapper',
  'Wide Def Progressor',
  'Wide Def Safety',
  'Deep Mid Box to Box',
  'Deep Mid Distributor',
  'Deep Mid Builder',
  'Advanced Mid Box Crasher',
  'Advanced Mid Creator',
  'Advanced Mid Orchestrator',
  'Wide Att Outlet',
  'Wide Att Unlocker',
  'Wide Att Threat',
  'Central Att Roamer',
  'Central Att Target',
  'Central Att Finisher',
];

// Función para generar percentajes aleatorios que sumen ~100%
function generateRolePercentages(position: string): { role_name: string; percentage: number }[] {
  const roles = PLAYER_ROLES.map(role => ({ role_name: role, percentage: 0 }));

  // Asignar porcentajes según la posición
  if (position?.includes('FW') || position?.includes('ST') || position?.includes('CF')) {
    // Delanteros - más peso en roles de ataque central
    roles[18].percentage = Math.random() * 20 + 25; // Central Att Roamer
    roles[19].percentage = Math.random() * 15 + 10; // Central Att Target
    roles[20].percentage = Math.random() * 30 + 30; // Central Att Finisher
    roles[15].percentage = Math.random() * 15 + 5;  // Wide Att Outlet
    roles[17].percentage = Math.random() * 10;      // Wide Att Threat
  } else if (position?.includes('MF') || position?.includes('AM') || position?.includes('CM')) {
    // Mediocampistas
    roles[13].percentage = Math.random() * 20 + 15; // Advanced Mid Creator
    roles[14].percentage = Math.random() * 20 + 10; // Advanced Mid Orchestrator
    roles[12].percentage = Math.random() * 20 + 10; // Advanced Mid Box Crasher
    roles[10].percentage = Math.random() * 15 + 10; // Deep Mid Distributor
    roles[9].percentage = Math.random() * 15 + 5;   // Deep Mid Box to Box
    roles[11].percentage = Math.random() * 10 + 5;  // Deep Mid Builder
  } else if (position?.includes('DF') || position?.includes('CB') || position?.includes('FB') || position?.includes('WB')) {
    // Defensas
    roles[3].percentage = Math.random() * 20 + 15;  // Central Def Aggressor
    roles[4].percentage = Math.random() * 20 + 15;  // Central Def Spreader
    roles[5].percentage = Math.random() * 25 + 20;  // Central Def Anchor
    roles[6].percentage = Math.random() * 15 + 5;   // Wide Def Overlapper
    roles[7].percentage = Math.random() * 10 + 5;   // Wide Def Progressor
    roles[8].percentage = Math.random() * 10 + 5;   // Wide Def Safety
  } else if (position?.includes('GK')) {
    // Porteros
    roles[0].percentage = Math.random() * 30 + 30;  // GK Dominator
    roles[1].percentage = Math.random() * 30 + 20;  // GK Reactive
    roles[2].percentage = Math.random() * 30 + 20;  // GK Initiator
  }

  return roles;
}

async function main() {
  console.log('🌱 Seeding player roles...');

  // Obtener los primeros 20 jugadores
  const players = await prisma.jugador.findMany({
    take: 20,
    select: {
      id_player: true,
      player_name: true,
      position_player: true,
    },
  });

  console.log(`Found ${players.length} players to seed`);

  for (const player of players) {
    console.log(`\nSeeding roles for ${player.player_name} (${player.position_player})`);

    const rolePercentages = generateRolePercentages(player.position_player || '');

    // Insertar roles para este jugador
    for (const role of rolePercentages) {
      await prisma.playerRole.upsert({
        where: {
          player_id_role_name: {
            player_id: player.id_player,
            role_name: role.role_name,
          },
        },
        update: {
          percentage: role.percentage,
        },
        create: {
          player_id: player.id_player,
          role_name: role.role_name,
          percentage: role.percentage,
        },
      });
    }

    console.log(`✓ Created ${rolePercentages.length} roles for ${player.player_name}`);
  }

  console.log('\n✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
