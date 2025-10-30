/**
 * Script para verificar qué campos está devolviendo el endpoint /api/admin/players
 */

import { prisma } from '../src/lib/db'

async function testApiResponse() {
  console.log('🔍 Simulando respuesta del endpoint /api/admin/players...\n')

  // Simular el select que usa el endpoint
  const listSelect = {
    id_player: true,
    old_id: true,
    player_name: true,
    wyscout_id_1: true,
    wyscout_id_2: true,
    wyscout_name_1: true,
    wyscout_name_2: true,
    id_fmi: true,
    complete_player_name: true,
    date_of_birth: true,
    correct_date_of_birth: true,
    age: true,
    age_value: true,
    age_value_percent: true,
    age_coeff: true,
    height: true,
    correct_height: true,
    foot: true,
    correct_foot: true,
    position_player: true,
    correct_position_player: true,
    position_value: true,
    position_value_percent: true,
    nationality_1: true,
    correct_nationality_1: true,
    nationality_value: true,
    nationality_value_percent: true,
    nationality_2: true,
    correct_nationality_2: true,
    national_tier: true,
    rename_national_tier: true,
    correct_national_tier: true,
    pre_team: true,
    team_name: true,
    correct_team_name: true,
    team_country: true,
    team_elo: true,
    team_level: true,
    team_level_value: true,
    team_level_value_percent: true,
    team_competition: true,
    competition_country: true,
    team_competition_value: true,
    team_competition_value_percent: true,
    competition_tier: true,
    competition_confederation: true,
    competition_elo: true,
    competition_level: true,
    competition_level_value: true,
    competition_level_value_percent: true,
    owner_club: true,
    owner_club_country: true,
    owner_club_value: true,
    owner_club_value_percent: true,
    pre_team_loan_from: true,
    team_loan_from: true,
    correct_team_loan_from: true,
    on_loan: true,
    existing_club: true,
    agency: true,
    correct_agency: true,
    contract_end: true,
    correct_contract_end: true,
    player_rating: true,
    player_rating_norm: true,
    player_trfm_value: true,
    player_trfm_value_norm: true,
    player_elo: true,
    player_level: true,
    player_ranking: true,
    stats_evo_3m: true,
    total_fmi_pts_norm: true,
    community_potential: true,
    photo_coverage: true,
    video: true,
    url_trfm_advisor: true,
    url_trfm: true,
    url_secondary: true,
    url_instagram: true,
    createdAt: true,
    updatedAt: true
  }

  const players = await prisma.jugador.findMany({
    take: 2,
    orderBy: {
      id_player: 'asc'
    },
    select: listSelect
  })

  console.log(`📊 Respuesta simulada del endpoint (${players.length} jugadores):\n`)

  // Verificar campos problemáticos específicos
  const problematicFields = [
    'id_fmi', 'url_trfm', 'url_instagram', 'correct_date_of_birth',
    'age_value', 'age_value_percent', 'age_coeff', 'pre_team',
    'correct_team_name', 'team_country', 'team_elo', 'team_level'
  ]

  players.forEach((player, index) => {
    console.log(`\n${index + 1}. ${player.player_name}`)
    console.log('   ─────────────────────────────────')

    problematicFields.forEach(field => {
      const value = player[field as keyof typeof player]
      const displayValue = value === null || value === undefined ? '❌ NULL/UNDEFINED' : `✅ ${value}`
      console.log(`   ${field}: ${displayValue}`)
    })
  })

  // Verificar cuántos campos tiene el objeto
  const firstPlayer = players[0]
  if (firstPlayer) {
    const fieldCount = Object.keys(firstPlayer).length
    console.log(`\n\n📊 Total de campos devueltos: ${fieldCount}`)
    console.log(`📋 Campos incluidos en el select: ${Object.keys(listSelect).length}`)

    if (fieldCount === Object.keys(listSelect).length) {
      console.log('✅ Todos los campos del select están siendo devueltos')
    } else {
      console.log('⚠️ Algunos campos del select no están siendo devueltos')
    }
  }

  console.log('\n✅ Verificación completada')
}

testApiResponse()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
