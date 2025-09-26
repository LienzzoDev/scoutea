import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('🌱 Seeding scouts...')

    // Verificar si ya existen scouts
    const existingScouts = await prisma.scout.count()
    if (existingScouts > 0) {
      return NextResponse.json({ 
        message: `Ya existen ${existingScouts} scouts en la base de datos`,
        scouts: existingScouts
      })
    }

    // Crear scouts de prueba
    const scoutsToCreate = [
      {
        id_scout: 'scout-1',
        scout_name: 'Carlos Rodríguez',
        name: 'Carlos',
        surname: 'Rodríguez',
        nationality: 'Spain',
        country: 'Spain',
        scout_level: 'Expert',
        scout_elo: 1850,
        total_reports: 45,
        roi: 15.2,
        max_profit_report: 2500000,
        nationality_expertise: 'Spain',
        competition_expertise: 'La Liga',
        age: 32,
        scout_ranking: 15,
        open_to_work: true,
        email: 'carlos@scoutea.com',
        url_profile: 'https://example.com/carlos'
      },
      {
        id_scout: 'scout-2',
        scout_name: 'María González',
        name: 'María',
        surname: 'González',
        nationality: 'Argentina',
        country: 'Argentina',
        scout_level: 'Advanced',
        scout_elo: 1720,
        total_reports: 32,
        roi: 12.8,
        max_profit_report: 1800000,
        nationality_expertise: 'Argentina',
        competition_expertise: 'Primera División',
        age: 28,
        scout_ranking: 23,
        open_to_work: false,
        email: 'maria@scoutea.com',
        url_profile: 'https://example.com/maria'
      },
      {
        id_scout: 'scout-3',
        scout_name: 'Juan Pérez',
        name: 'Juan',
        surname: 'Pérez',
        nationality: 'Mexico',
        country: 'Mexico',
        scout_level: 'Expert',
        scout_elo: 1790,
        total_reports: 38,
        roi: 14.1,
        max_profit_report: 2100000,
        nationality_expertise: 'Mexico',
        competition_expertise: 'Liga MX',
        age: 35,
        scout_ranking: 18,
        open_to_work: true,
        email: 'juan@scoutea.com',
        url_profile: 'https://example.com/juan'
      },
      {
        id_scout: 'scout-4',
        scout_name: 'Sophie Martin',
        name: 'Sophie',
        surname: 'Martin',
        nationality: 'France',
        country: 'France',
        scout_level: 'Elite',
        scout_elo: 1920,
        total_reports: 67,
        roi: 18.5,
        max_profit_report: 3200000,
        nationality_expertise: 'France',
        competition_expertise: 'Ligue 1',
        age: 29,
        scout_ranking: 8,
        open_to_work: true,
        email: 'sophie@scoutea.com',
        url_profile: 'https://example.com/sophie'
      },
      {
        id_scout: 'scout-5',
        scout_name: 'Marco Rossi',
        name: 'Marco',
        surname: 'Rossi',
        nationality: 'Italy',
        country: 'Italy',
        scout_level: 'Advanced',
        scout_elo: 1680,
        total_reports: 29,
        roi: 11.3,
        max_profit_report: 1600000,
        nationality_expertise: 'Italy',
        competition_expertise: 'Serie A',
        age: 41,
        scout_ranking: 31,
        open_to_work: false,
        email: 'marco@scoutea.com',
        url_profile: 'https://example.com/marco'
      }
    ]

    // Crear scouts en la base de datos
    const createdScouts = await Promise.all(
      scoutsToCreate.map(scout => 
        prisma.scout.create({ data: scout })
      )
    )

    console.log('✅ Scouts created successfully:', createdScouts.length)

    return NextResponse.json({ 
      message: `${createdScouts.length} scouts creados exitosamente`,
      scouts: createdScouts.map(s => ({ id: s.id_scout, name: s.scout_name }))
    })
  } catch (error) {
    console.error('❌ Error seeding scouts:', error)
    return NextResponse.json(
      { 
        error: 'Error creando scouts',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}