/**
 * Script para rellenar los campos initial_* de los jugadores existentes.
 *
 * Para cada jugador sin initial_player_trfm_value:
 * - Si tiene reportes, usa los datos del primer reporte (por report_date ASC)
 * - Si no tiene reportes, usa los valores actuales del jugador y createdAt como fecha
 *
 * Ejecutar: npx tsx scripts/backfill-initial-values.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Buscando jugadores sin datos iniciales...')

  const players = await prisma.jugador.findMany({
    where: {
      initial_player_trfm_value: null,
    },
    select: {
      id_player: true,
      player_name: true,
      player_trfm_value: true,
      team_name: true,
      team_level: true,
      team_elo: true,
      team_competition: true,
      competition_level: true,
      competition_elo: true,
      age: true,
      createdAt: true,
      reportes: {
        orderBy: { report_date: 'asc' },
        take: 1,
        select: {
          initial_player_trfm_value: true,
          initial_team: true,
          initial_team_level: true,
          initial_team_elo: true,
          initial_competition: true,
          initial_competition_level: true,
          initial_competition_elo: true,
          initial_age: true,
          report_date: true,
        },
      },
    },
  })

  console.log(`📊 Encontrados ${players.length} jugadores sin datos iniciales`)

  let fromReports = 0
  let fromCurrent = 0
  let errors = 0

  for (const player of players) {
    try {
      const firstReport = player.reportes[0]

      if (firstReport) {
        // Usar datos del primer reporte
        await prisma.jugador.update({
          where: { id_player: player.id_player },
          data: {
            initial_player_trfm_value: firstReport.initial_player_trfm_value ?? player.player_trfm_value,
            initial_trfm_value_date: firstReport.report_date ?? player.createdAt,
            initial_team_name: firstReport.initial_team ?? player.team_name,
            initial_team_level: firstReport.initial_team_level ?? player.team_level,
            initial_team_elo: firstReport.initial_team_elo ?? player.team_elo,
            initial_competition: firstReport.initial_competition ?? player.team_competition,
            initial_competition_level: firstReport.initial_competition_level ?? player.competition_level,
            initial_competition_elo: firstReport.initial_competition_elo ?? player.competition_elo,
            initial_age: firstReport.initial_age ?? player.age,
          },
        })
        fromReports++
      } else {
        // Usar valores actuales del jugador
        await prisma.jugador.update({
          where: { id_player: player.id_player },
          data: {
            initial_player_trfm_value: player.player_trfm_value,
            initial_trfm_value_date: player.createdAt,
            initial_team_name: player.team_name,
            initial_team_level: player.team_level,
            initial_team_elo: player.team_elo,
            initial_competition: player.team_competition,
            initial_competition_level: player.competition_level,
            initial_competition_elo: player.competition_elo,
            initial_age: player.age,
          },
        })
        fromCurrent++
      }
    } catch (error) {
      console.error(`❌ Error actualizando jugador ${player.id_player} (${player.player_name}):`, error)
      errors++
    }
  }

  console.log('\n✅ Backfill completado:')
  console.log(`  - Desde reportes: ${fromReports}`)
  console.log(`  - Desde valores actuales: ${fromCurrent}`)
  console.log(`  - Errores: ${errors}`)
  console.log(`  - Total procesados: ${fromReports + fromCurrent}`)
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
