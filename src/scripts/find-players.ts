/**
 * Script para encontrar jugadores reales en la base de datos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findRealPlayers() {
  console.log("🔍 BUSCANDO JUGADORES REALES EN LA BASE DE DATOS");
  console.log("=".repeat(50));
  
  try {
    // Buscar jugadores con atributos disponibles
    const playersWithAttributes = await prisma.jugador.findMany({
      where: {
        atributos: {
          isNot: null
        }
      },
      include: {
        atributos: true,
        playerStats3m: true
      },
      take: 10,
      orderBy: {
        player_rating: 'desc'
      }
    });
    
    console.log(`✅ Encontrados ${playersWithAttributes.length} jugadores con atributos:`);
    console.log("");
    
    playersWithAttributes.forEach((player, index) => {
      console.log(`${index + 1}. ${player.player_name}`);
      console.log(`   ID: ${player.id_player}`);
      console.log(`   Posición: ${player.position_player}`);
      console.log(`   Rating: ${player.player_rating}`);
      console.log(`   Equipo: ${player.team_name}`);
      console.log(`   Atributos: ${player.atributos ? 'Sí' : 'No'}`);
      console.log(`   Stats 3M: ${player.playerStats3m ? 'Sí' : 'No'}`);
      console.log("");
    });
    
    // Contar totales
    const totalPlayers = await prisma.jugador.count();
    const playersWithAttrs = await prisma.jugador.count({
      where: {
        atributos: {
          isNot: null
        }
      }
    });
    const playersWithStats = await prisma.jugador.count({
      where: {
        playerStats3m: {
          isNot: null
        }
      }
    });
    
    console.log("📊 ESTADÍSTICAS DE LA BASE DE DATOS:");
    console.log(`   Total jugadores: ${totalPlayers}`);
    console.log(`   Con atributos FMI: ${playersWithAttrs}`);
    console.log(`   Con estadísticas 3M: ${playersWithStats}`);
    
    // Buscar algunos jugadores famosos por nombre
    const famousNames = ['Messi', 'Ronaldo', 'Haaland', 'Mbappé', 'Modric'];
    console.log("\n🌟 BUSCANDO JUGADORES FAMOSOS:");
    
    for (const name of famousNames) {
      const players = await prisma.jugador.findMany({
        where: {
          player_name: {
            contains: name,
            mode: 'insensitive'
          }
        },
        include: {
          atributos: true
        },
        take: 3
      });
      
      if (players.length > 0) {
        console.log(`\n   ${name}:`);
        players.forEach(player => {
          console.log(`     ${player.player_name} (${player.id_player}) - Atributos: ${player.atributos ? 'Sí' : 'No'}`);
        });
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

findRealPlayers();