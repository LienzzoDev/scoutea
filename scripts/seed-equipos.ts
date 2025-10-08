/**
 * Script para poblar la tabla equipos con 10 equipos de ejemplo
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const equipos = [
  {
    team_name: 'Real Madrid',
    correct_team_name: 'Real Madrid CF',
    team_country: 'Spain',
    short_name: 'RMA',
    founded_year: 1902,
    stadium: 'Santiago Bernabéu',
    competition: 'La Liga',
    competition_country: 'Spain',
    team_trfm_value: 1200000000,
    team_rating: 92.5,
    team_elo: 2100,
    team_level: 'Elite',
    website_url: 'https://www.realmadrid.com',
    logo_url: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg'
  },
  {
    team_name: 'FC Barcelona',
    correct_team_name: 'Futbol Club Barcelona',
    team_country: 'Spain',
    short_name: 'FCB',
    founded_year: 1899,
    stadium: 'Camp Nou',
    competition: 'La Liga',
    competition_country: 'Spain',
    team_trfm_value: 1100000000,
    team_rating: 91.8,
    team_elo: 2080,
    team_level: 'Elite',
    website_url: 'https://www.fcbarcelona.com',
    logo_url: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg'
  },
  {
    team_name: 'Manchester City',
    correct_team_name: 'Manchester City FC',
    team_country: 'England',
    short_name: 'MCI',
    founded_year: 1880,
    stadium: 'Etihad Stadium',
    competition: 'Premier League',
    competition_country: 'England',
    team_trfm_value: 1300000000,
    team_rating: 93.2,
    team_elo: 2120,
    team_level: 'Elite',
    website_url: 'https://www.mancity.com',
    logo_url: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'
  },
  {
    team_name: 'Bayern Munich',
    correct_team_name: 'FC Bayern München',
    team_country: 'Germany',
    short_name: 'FCB',
    founded_year: 1900,
    stadium: 'Allianz Arena',
    competition: 'Bundesliga',
    competition_country: 'Germany',
    team_trfm_value: 1150000000,
    team_rating: 92.0,
    team_elo: 2095,
    team_level: 'Elite',
    website_url: 'https://www.fcbayern.com',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg'
  },
  {
    team_name: 'Paris Saint-Germain',
    correct_team_name: 'Paris Saint-Germain FC',
    team_country: 'France',
    short_name: 'PSG',
    founded_year: 1970,
    stadium: 'Parc des Princes',
    competition: 'Ligue 1',
    competition_country: 'France',
    team_trfm_value: 1050000000,
    team_rating: 90.5,
    team_elo: 2050,
    team_level: 'Elite',
    website_url: 'https://www.psg.fr',
    logo_url: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg'
  },
  {
    team_name: 'Liverpool',
    correct_team_name: 'Liverpool FC',
    team_country: 'England',
    short_name: 'LIV',
    founded_year: 1892,
    stadium: 'Anfield',
    competition: 'Premier League',
    competition_country: 'England',
    team_trfm_value: 1080000000,
    team_rating: 91.2,
    team_elo: 2070,
    team_level: 'Elite',
    website_url: 'https://www.liverpoolfc.com',
    logo_url: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg'
  },
  {
    team_name: 'Inter Milan',
    correct_team_name: 'FC Internazionale Milano',
    team_country: 'Italy',
    short_name: 'INT',
    founded_year: 1908,
    stadium: 'San Siro',
    competition: 'Serie A',
    competition_country: 'Italy',
    team_trfm_value: 750000000,
    team_rating: 88.5,
    team_elo: 2020,
    team_level: 'Top',
    website_url: 'https://www.inter.it',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg'
  },
  {
    team_name: 'Atletico Madrid',
    correct_team_name: 'Club Atlético de Madrid',
    team_country: 'Spain',
    short_name: 'ATM',
    founded_year: 1903,
    stadium: 'Wanda Metropolitano',
    competition: 'La Liga',
    competition_country: 'Spain',
    team_trfm_value: 680000000,
    team_rating: 87.8,
    team_elo: 2010,
    team_level: 'Top',
    website_url: 'https://www.atleticodemadrid.com',
    logo_url: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg'
  },
  {
    team_name: 'Borussia Dortmund',
    correct_team_name: 'Ballspielverein Borussia 09 Dortmund',
    team_country: 'Germany',
    short_name: 'BVB',
    founded_year: 1909,
    stadium: 'Signal Iduna Park',
    competition: 'Bundesliga',
    competition_country: 'Germany',
    team_trfm_value: 620000000,
    team_rating: 86.5,
    team_elo: 1980,
    team_level: 'Top',
    website_url: 'https://www.bvb.de',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg'
  },
  {
    team_name: 'Juventus',
    correct_team_name: 'Juventus FC',
    team_country: 'Italy',
    short_name: 'JUV',
    founded_year: 1897,
    stadium: 'Allianz Stadium',
    competition: 'Serie A',
    competition_country: 'Italy',
    team_trfm_value: 650000000,
    team_rating: 87.0,
    team_elo: 1990,
    team_level: 'Top',
    website_url: 'https://www.juventus.com',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg'
  }
]

async function main() {
  console.log('🚀 Iniciando seed de equipos...')

  // Verificar cuántos equipos ya existen
  const existingCount = await prisma.equipo.count()
  console.log(`📊 Equipos existentes: ${existingCount}`)

  for (const equipo of equipos) {
    try {
      // Verificar si el equipo ya existe
      const existing = await prisma.equipo.findFirst({
        where: { team_name: equipo.team_name }
      })

      if (existing) {
        console.log(`⏭️  ${equipo.team_name} ya existe, omitiendo...`)
        continue
      }

      await prisma.equipo.create({
        data: equipo
      })
      console.log(`✅ ${equipo.team_name} creado`)
    } catch (error) {
      console.error(`❌ Error creando ${equipo.team_name}:`, error)
    }
  }

  const finalCount = await prisma.equipo.count()
  console.log('')
  console.log(`🎉 Seed completado! Total de equipos: ${finalCount}`)
}

main()
  .catch((error) => {
    console.error('❌ Error durante el seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
