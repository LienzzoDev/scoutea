import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('🌱 Seeding more scouts...')

    // Crear más scouts de prueba con mayor variedad
    const additionalScouts = [
      {
        id_scout: 'scout-6',
        scout_name: 'Thomas Mueller',
        name: 'Thomas',
        surname: 'Mueller',
        nationality: 'Germany',
        country: 'Germany',
        scout_level: 'Elite',
        scout_elo: 1950,
        total_reports: 89,
        roi: 22.1,
        max_profit_report: 4500000,
        nationality_expertise: 'Germany',
        competition_expertise: 'Bundesliga',
        age: 38,
        scout_ranking: 5,
        open_to_work: true,
        email: 'thomas@scoutea.com',
        url_profile: 'https://example.com/thomas'
      },
      {
        id_scout: 'scout-7',
        scout_name: 'Isabella Silva',
        name: 'Isabella',
        surname: 'Silva',
        nationality: 'Brazil',
        country: 'Brazil',
        scout_level: 'Expert',
        scout_elo: 1820,
        total_reports: 52,
        roi: 16.8,
        max_profit_report: 2800000,
        nationality_expertise: 'Brazil',
        competition_expertise: 'Brasileirão',
        age: 31,
        scout_ranking: 12,
        open_to_work: true,
        email: 'isabella@scoutea.com',
        url_profile: 'https://example.com/isabella'
      },
      {
        id_scout: 'scout-8',
        scout_name: 'James Wilson',
        name: 'James',
        surname: 'Wilson',
        nationality: 'England',
        country: 'England',
        scout_level: 'Advanced',
        scout_elo: 1750,
        total_reports: 41,
        roi: 13.5,
        max_profit_report: 2200000,
        nationality_expertise: 'England',
        competition_expertise: 'Premier League',
        age: 34,
        scout_ranking: 19,
        open_to_work: false,
        email: 'james@scoutea.com',
        url_profile: 'https://example.com/james'
      },
      {
        id_scout: 'scout-9',
        scout_name: 'Yuki Tanaka',
        name: 'Yuki',
        surname: 'Tanaka',
        nationality: 'Japan',
        country: 'Japan',
        scout_level: 'Intermediate',
        scout_elo: 1580,
        total_reports: 23,
        roi: 9.2,
        max_profit_report: 1200000,
        nationality_expertise: 'Japan',
        competition_expertise: 'J-League',
        age: 26,
        scout_ranking: 45,
        open_to_work: true,
        email: 'yuki@scoutea.com',
        url_profile: 'https://example.com/yuki'
      },
      {
        id_scout: 'scout-10',
        scout_name: 'Ahmed Hassan',
        name: 'Ahmed',
        surname: 'Hassan',
        nationality: 'Egypt',
        country: 'Egypt',
        scout_level: 'Advanced',
        scout_elo: 1690,
        total_reports: 35,
        roi: 12.1,
        max_profit_report: 1750000,
        nationality_expertise: 'Egypt',
        competition_expertise: 'Egyptian Premier League',
        age: 39,
        scout_ranking: 28,
        open_to_work: true,
        email: 'ahmed@scoutea.com',
        url_profile: 'https://example.com/ahmed'
      },
      {
        id_scout: 'scout-11',
        scout_name: 'Olga Petrov',
        name: 'Olga',
        surname: 'Petrov',
        nationality: 'Russia',
        country: 'Russia',
        scout_level: 'Expert',
        scout_elo: 1810,
        total_reports: 48,
        roi: 15.7,
        max_profit_report: 2600000,
        nationality_expertise: 'Russia',
        competition_expertise: 'Russian Premier League',
        age: 33,
        scout_ranking: 14,
        open_to_work: false,
        email: 'olga@scoutea.com',
        url_profile: 'https://example.com/olga'
      },
      {
        id_scout: 'scout-12',
        scout_name: 'Diego Morales',
        name: 'Diego',
        surname: 'Morales',
        nationality: 'Colombia',
        country: 'Colombia',
        scout_level: 'Intermediate',
        scout_elo: 1620,
        total_reports: 27,
        roi: 10.8,
        max_profit_report: 1400000,
        nationality_expertise: 'Colombia',
        competition_expertise: 'Liga BetPlay',
        age: 29,
        scout_ranking: 38,
        open_to_work: true,
        email: 'diego@scoutea.com',
        url_profile: 'https://example.com/diego'
      },
      {
        id_scout: 'scout-13',
        scout_name: 'Emma Andersson',
        name: 'Emma',
        surname: 'Andersson',
        nationality: 'Sweden',
        country: 'Sweden',
        scout_level: 'Advanced',
        scout_elo: 1730,
        total_reports: 39,
        roi: 13.9,
        max_profit_report: 2000000,
        nationality_expertise: 'Sweden',
        competition_expertise: 'Allsvenskan',
        age: 30,
        scout_ranking: 22,
        open_to_work: true,
        email: 'emma@scoutea.com',
        url_profile: 'https://example.com/emma'
      },
      {
        id_scout: 'scout-14',
        scout_name: 'Kwame Asante',
        name: 'Kwame',
        surname: 'Asante',
        nationality: 'Ghana',
        country: 'Ghana',
        scout_level: 'Beginner',
        scout_elo: 1420,
        total_reports: 15,
        roi: 6.5,
        max_profit_report: 800000,
        nationality_expertise: 'Ghana',
        competition_expertise: 'Ghana Premier League',
        age: 24,
        scout_ranking: 67,
        open_to_work: true,
        email: 'kwame@scoutea.com',
        url_profile: 'https://example.com/kwame'
      },
      {
        id_scout: 'scout-15',
        scout_name: 'Luca Bianchi',
        name: 'Luca',
        surname: 'Bianchi',
        nationality: 'Italy',
        country: 'Italy',
        scout_level: 'Elite',
        scout_elo: 1890,
        total_reports: 73,
        roi: 19.3,
        max_profit_report: 3800000,
        nationality_expertise: 'Italy',
        competition_expertise: 'Serie A',
        age: 42,
        scout_ranking: 7,
        open_to_work: false,
        email: 'luca@scoutea.com',
        url_profile: 'https://example.com/luca'
      }
    ]

    // Verificar cuáles scouts ya existen para evitar duplicados
    const existingScoutIds = await prisma.scout.findMany({
      where: {
        id_scout: {
          in: additionalScouts.map(s => s.id_scout)
        }
      },
      select: { id_scout: true }
    })

    const existingIds = new Set(existingScoutIds.map(s => s.id_scout))
    const scoutsToCreate = additionalScouts.filter(s => !existingIds.has(s.id_scout))

    if (scoutsToCreate.length === 0) {
      return NextResponse.json({ 
        message: 'Todos los scouts adicionales ya existen en la base de datos',
        existing: existingIds.size
      })
    }

    // Crear scouts en la base de datos
    const createdScouts = await Promise.all(
      scoutsToCreate.map(scout => 
        prisma.scout.create({ data: scout })
      )
    )

    console.log('✅ Additional scouts created successfully:', createdScouts.length)

    return NextResponse.json({ 
      message: `${createdScouts.length} scouts adicionales creados exitosamente`,
      scouts: createdScouts.map(s => ({ id: s.id_scout, name: s.scout_name })),
      total: await prisma.scout.count()
    })
  } catch (error) {
    console.error('❌ Error seeding additional scouts:', error)
    return NextResponse.json(
      { 
        error: 'Error creando scouts adicionales',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}