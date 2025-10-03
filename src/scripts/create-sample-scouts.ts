import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function createSampleScouts(): Promise<{ success: boolean; message: string; scouts?: any[] }> {
  try {
    console.log('🚀 Creating sample scouts...');

    // Verificar si ya existen scouts
    const existingScouts = await prisma.scout.count();
    if (existingScouts > 0) {
      console.log('✅ Scouts already exist in database:', existingScouts);
      return {
        success: true,
        message: `Database already has ${existingScouts} scouts`,
      };
    }

    // Datos de scouts de prueba
    const sampleScoutsData = [
      {
        id_scout: 'scout-sample-1',
        scout_name: 'Carlos Rodríguez',
        name: 'Carlos',
        surname: 'Rodríguez',
        nationality: 'Spain',
        email: 'carlos@scoutea.com',
        country: 'Spain',
        scout_level: 'Expert',
        scout_elo: 1850,
        total_reports: 45,
        original_reports: 35,
        roi: 15.2,
        max_profit_report: 2500000,
        nationality_expertise: 'Spain',
        competition_expertise: 'La Liga',
        age: 32,
        scout_ranking: 15,
        open_to_work: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_scout: 'scout-sample-2',
        scout_name: 'María González',
        name: 'María',
        surname: 'González',
        nationality: 'Argentina',
        email: 'maria@scoutea.com',
        country: 'Argentina',
        scout_level: 'Advanced',
        scout_elo: 1720,
        total_reports: 32,
        original_reports: 28,
        roi: 12.8,
        max_profit_report: 1800000,
        nationality_expertise: 'Argentina',
        competition_expertise: 'Primera División',
        age: 28,
        scout_ranking: 23,
        open_to_work: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_scout: 'scout-sample-3',
        scout_name: 'Juan Pérez',
        name: 'Juan',
        surname: 'Pérez',
        nationality: 'Mexico',
        email: 'juan@scoutea.com',
        country: 'Mexico',
        scout_level: 'Expert',
        scout_elo: 1790,
        total_reports: 38,
        original_reports: 30,
        roi: 14.1,
        max_profit_report: 2100000,
        nationality_expertise: 'Mexico',
        competition_expertise: 'Liga MX',
        age: 35,
        scout_ranking: 18,
        open_to_work: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_scout: 'scout-sample-4',
        scout_name: 'Sophie Martin',
        name: 'Sophie',
        surname: 'Martin',
        nationality: 'France',
        email: 'sophie@scoutea.com',
        country: 'France',
        scout_level: 'Elite',
        scout_elo: 1920,
        total_reports: 67,
        original_reports: 55,
        roi: 18.5,
        max_profit_report: 3200000,
        nationality_expertise: 'France',
        competition_expertise: 'Ligue 1',
        age: 29,
        scout_ranking: 8,
        open_to_work: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id_scout: 'scout-sample-5',
        scout_name: 'Marco Rossi',
        name: 'Marco',
        surname: 'Rossi',
        nationality: 'Italy',
        email: 'marco@scoutea.com',
        country: 'Italy',
        scout_level: 'Advanced',
        scout_elo: 1680,
        total_reports: 29,
        original_reports: 25,
        roi: 11.3,
        max_profit_report: 1600000,
        nationality_expertise: 'Italy',
        competition_expertise: 'Serie A',
        age: 41,
        scout_ranking: 31,
        open_to_work: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Crear scouts en la base de datos
    const createdScouts = await prisma.scout.createMany({
      data: sampleScoutsData,
      skipDuplicates: true
    });

    console.log('✅ Sample scouts created:', createdScouts.count);

    return {
      success: true,
      message: `Created ${createdScouts.count} sample scouts`,
      scouts: sampleScoutsData
    };
  } catch (error) {
    console.error('❌ Error creating sample scouts:', error);
    return {
      success: false,
      message: `Failed to create sample scouts: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createSampleScouts()
}