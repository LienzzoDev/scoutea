/**
 * Script para verificar campos problemáticos en la base de datos
 */

import { prisma } from '../src/lib/db'

async function checkProblematicFields() {
  console.log('🔍 Verificando campos problemáticos en la base de datos...\n')

  // Tomar los primeros 5 jugadores para inspección
  const players = await prisma.jugador.findMany({
    take: 5,
    select: {
      player_name: true,
      id_fmi: true,
      url_trfm: true,
      url_instagram: true,
      correct_date_of_birth: true,
      age_value: true,
      age_value_percent: true,
      age_coeff: true,
      pre_team: true,
      correct_team_name: true,
      team_country: true,
      team_elo: true,
      team_level: true,
    }
  })

  console.log(`📊 Primeros ${players.length} jugadores:\n`)

  players.forEach((player, index) => {
    console.log(`\n${index + 1}. ${player.player_name}`)
    console.log('   ─────────────────────────────────')
    console.log(`   id_fmi: ${player.id_fmi ?? 'NULL'}`)
    console.log(`   url_trfm: ${player.url_trfm ?? 'NULL'}`)
    console.log(`   url_instagram: ${player.url_instagram ?? 'NULL'}`)
    console.log(`   correct_date_of_birth: ${player.correct_date_of_birth ?? 'NULL'}`)
    console.log(`   age_value: ${player.age_value ?? 'NULL'}`)
    console.log(`   age_value_percent: ${player.age_value_percent ?? 'NULL'}`)
    console.log(`   age_coeff: ${player.age_coeff ?? 'NULL'}`)
    console.log(`   pre_team: ${player.pre_team ?? 'NULL'}`)
    console.log(`   correct_team_name: ${player.correct_team_name ?? 'NULL'}`)
    console.log(`   team_country: ${player.team_country ?? 'NULL'}`)
    console.log(`   team_elo: ${player.team_elo ?? 'NULL'}`)
    console.log(`   team_level: ${player.team_level ?? 'NULL'}`)
  })

  // Contar cuántos jugadores tienen estos campos en NULL
  console.log('\n\n📊 Estadísticas de campos NULL:\n')

  const totalPlayers = await prisma.jugador.count()

  const stats = {
    id_fmi_null: await prisma.jugador.count({ where: { id_fmi: null } }),
    url_trfm_null: await prisma.jugador.count({ where: { url_trfm: null } }),
    url_instagram_null: await prisma.jugador.count({ where: { url_instagram: null } }),
    correct_date_of_birth_null: await prisma.jugador.count({ where: { correct_date_of_birth: null } }),
    age_value_null: await prisma.jugador.count({ where: { age_value: null } }),
    age_value_percent_null: await prisma.jugador.count({ where: { age_value_percent: null } }),
    age_coeff_null: await prisma.jugador.count({ where: { age_coeff: null } }),
    pre_team_null: await prisma.jugador.count({ where: { pre_team: null } }),
    correct_team_name_null: await prisma.jugador.count({ where: { correct_team_name: null } }),
    team_country_null: await prisma.jugador.count({ where: { team_country: null } }),
    team_elo_null: await prisma.jugador.count({ where: { team_elo: null } }),
    team_level_null: await prisma.jugador.count({ where: { team_level: null } }),
  }

  Object.entries(stats).forEach(([field, nullCount]) => {
    const percentage = ((nullCount / totalPlayers) * 100).toFixed(1)
    console.log(`   ${field}: ${nullCount}/${totalPlayers} (${percentage}%)`)
  })

  console.log('\n✅ Verificación completada')
}

checkProblematicFields()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
