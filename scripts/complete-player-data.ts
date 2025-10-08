import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Completing player data for player-sample-1...')

  const playerId = 'player-sample-1'

  // Actualizar el jugador con todos los datos completos
  const player = await prisma.jugador.update({
    where: { id_player: playerId },
    data: {
      // Nombre completo
      complete_player_name: 'Alejandro Martínez García',

      // Nacionalidad
      nationality_1: 'Spain',
      correct_nationality_1: 'Spain',
      nationality_2: null,
      correct_nationality_2: null,

      // Nivel nacional
      national_tier: 'Tier 1',
      rename_national_tier: 'Primera División',
      correct_national_tier: 'Tier 1',

      // Agente
      agency: 'Stellar Group',
      correct_agency: 'Stellar Group',

      // Equipo
      team_name: 'Real Betis Balompié',
      correct_team_name: 'Real Betis Balompié',
      team_country: 'Spain',
      team_level: 'Top Tier',
      team_level_value: 5,
      team_level_value_percent: 100,
      team_elo: 1650,

      // Préstamo
      on_loan: false,
      team_loan_from: null,
      correct_team_loan_from: null,
      owner_club: null,
      owner_club_country: null,

      // Contrato
      contract_end: new Date('2026-06-30'),
      correct_contract_end: new Date('2026-06-30'),

      // Competición
      team_competition: 'La Liga',
      competition_country: 'Spain',
      competition_tier: 'Tier 1',
      competition_confederation: 'UEFA',
      competition_level: 'Top 5 League',
      competition_level_value: 5,
      competition_level_value_percent: 100,
      competition_elo: 1800,

      // Posición
      position_player: 'Central Midfielder',
      correct_position_player: 'CM',

      // Físico
      foot: 'Right',
      correct_foot: 'Right',
      height: 178,
      correct_height: 178,

      // Fechas
      date_of_birth: new Date('2001-03-15'),
      correct_date_of_birth: new Date('2001-03-15'),

      // Valor y rating
      player_trfm_value: 8.5, // 8.5 millones
      player_rating: 78.5,

      // Edad
      age: 23,
      age_value: 85.5,
      age_value_percent: 95,
      age_coeff: 1.1,

      // Valores de posición
      position_value: 80,
      position_value_percent: 88,

      // Valores de nacionalidad
      nationality_value: 75,
      nationality_value_percent: 82,
    }
  })

  console.log('✅ Successfully updated player data!')
  console.log(`\n📊 Player: ${player.complete_player_name || player.player_name}`)
  console.log(`   Nationality: ${player.nationality_1}`)
  console.log(`   Team: ${player.team_name} (${player.team_country})`)
  console.log(`   Competition: ${player.team_competition} (Tier ${player.competition_tier})`)
  console.log(`   Position: ${player.position_player}`)
  console.log(`   Age: ${player.age} years`)
  console.log(`   Market Value: €${player.player_trfm_value}M`)
  console.log(`   Rating: ${player.player_rating}/100`)
  console.log(`   Contract expires: ${player.contract_end?.toLocaleDateString()}`)
  console.log(`   Agent: ${player.agency}`)
  console.log(`   Team ELO: ${player.team_elo}`)
  console.log(`   Competition ELO: ${player.competition_elo}`)

  console.log(`\n📍 View at: http://localhost:3000/member/player/${player.id_player}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
