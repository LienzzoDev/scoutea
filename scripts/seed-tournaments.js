const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const sampleTournaments = [
  {
    nombre: 'Copa de Verano 2024',
    descripcion: 'Torneo de fútbol de verano para equipos juveniles de la región',
    pais: 'España',
    ciudad: 'Madrid',
    fecha_inicio: new Date('2024-07-15T10:00:00Z'),
    fecha_fin: new Date('2024-07-20T18:00:00Z'),
    tipo_torneo: 'juvenil',
    categoria: 'U18',
    genero: 'masculino',
    estado: 'planificado',
    max_equipos: 16,
    equipos_inscritos: 8,
    premio_primero: 1000,
    premio_segundo: 500,
    premio_tercero: 250,
    organizador: 'Federación Madrileña de Fútbol',
    contacto_email: 'copa@fmm.es',
    contacto_telefono: '+34 91 123 4567',
    sitio_web: 'https://www.fmm.es/copa-verano',
    reglas_especiales: 'Partidos de 80 minutos, máximo 5 cambios por equipo',
    requisitos_inscripcion: 'Equipos registrados en la FMF, seguro deportivo obligatorio',
    fecha_limite_inscripcion: new Date('2024-07-10T23:59:59Z'),
    es_publico: true,
    es_gratuito: true,
    moneda: 'EUR'
  },
  {
    nombre: 'Torneo Internacional de Clubes',
    descripcion: 'Competición internacional para clubes profesionales de Europa',
    pais: 'España',
    ciudad: 'Barcelona',
    fecha_inicio: new Date('2024-08-01T09:00:00Z'),
    fecha_fin: new Date('2024-08-15T21:00:00Z'),
    tipo_torneo: 'profesional',
    categoria: 'Senior',
    genero: 'masculino',
    estado: 'en_curso',
    max_equipos: 32,
    equipos_inscritos: 32,
    premio_primero: 50000,
    premio_segundo: 25000,
    premio_tercero: 10000,
    organizador: 'UEFA',
    contacto_email: 'info@uefa.com',
    contacto_telefono: '+41 44 244 0000',
    sitio_web: 'https://www.uefa.com',
    reglas_especiales: 'Reglamento FIFA, VAR disponible',
    requisitos_inscripcion: 'Licencia UEFA, certificado médico actualizado',
    fecha_limite_inscripcion: new Date('2024-07-15T23:59:59Z'),
    es_publico: true,
    es_gratuito: false,
    costo_inscripcion: 5000,
    moneda: 'EUR'
  },
  {
    nombre: 'Copa Femenina Sub-21',
    descripcion: 'Torneo exclusivo para equipos femeninos sub-21',
    pais: 'España',
    ciudad: 'Valencia',
    fecha_inicio: new Date('2024-09-01T10:00:00Z'),
    fecha_fin: new Date('2024-09-05T18:00:00Z'),
    tipo_torneo: 'juvenil',
    categoria: 'U21',
    genero: 'femenino',
    estado: 'planificado',
    max_equipos: 12,
    equipos_inscritos: 6,
    premio_primero: 2000,
    premio_segundo: 1000,
    premio_tercero: 500,
    organizador: 'Federación Valenciana de Fútbol',
    contacto_email: 'femenino@fvf.es',
    contacto_telefono: '+34 96 123 4567',
    sitio_web: 'https://www.fvf.es',
    reglas_especiales: 'Partidos de 70 minutos, máximo 7 cambios',
    requisitos_inscripcion: 'Jugadoras nacidas después del 1 de enero de 2003',
    fecha_limite_inscripcion: new Date('2024-08-25T23:59:59Z'),
    es_publico: true,
    es_gratuito: true,
    moneda: 'EUR'
  },
  {
    nombre: 'Liga Nacional de Veteranos',
    descripcion: 'Competición para jugadores mayores de 35 años',
    pais: 'España',
    ciudad: 'Sevilla',
    fecha_inicio: new Date('2024-06-01T09:00:00Z'),
    fecha_fin: new Date('2024-06-30T21:00:00Z'),
    tipo_torneo: 'nacional',
    categoria: 'Veteranos',
    genero: 'masculino',
    estado: 'finalizado',
    max_equipos: 20,
    equipos_inscritos: 18,
    premio_primero: 3000,
    premio_segundo: 1500,
    premio_tercero: 750,
    organizador: 'Asociación de Veteranos del Fútbol',
    contacto_email: 'veteranos@avf.es',
    contacto_telefono: '+34 95 123 4567',
    sitio_web: 'https://www.avf.es',
    reglas_especiales: 'Partidos de 60 minutos, sin cambios limitados',
    requisitos_inscripcion: 'Jugadores mayores de 35 años, certificado médico',
    fecha_limite_inscripcion: new Date('2024-05-25T23:59:59Z'),
    es_publico: true,
    es_gratuito: false,
    costo_inscripcion: 200,
    moneda: 'EUR'
  },
  {
    nombre: 'Torneo Mixto de Verano',
    descripcion: 'Competición mixta para equipos de todas las edades',
    pais: 'España',
    ciudad: 'Bilbao',
    fecha_inicio: new Date('2024-07-25T10:00:00Z'),
    fecha_fin: new Date('2024-07-28T18:00:00Z'),
    tipo_torneo: 'nacional',
    categoria: 'Senior',
    genero: 'mixto',
    estado: 'planificado',
    max_equipos: 24,
    equipos_inscritos: 12,
    premio_primero: 1500,
    premio_segundo: 750,
    premio_tercero: 375,
    organizador: 'Club Deportivo Bilbao',
    contacto_email: 'torneo@cdbilbao.es',
    contacto_telefono: '+34 94 123 4567',
    sitio_web: 'https://www.cdbilbao.es',
    reglas_especiales: 'Mínimo 3 jugadoras en campo, partidos de 70 minutos',
    requisitos_inscripcion: 'Equipos mixtos, seguro deportivo obligatorio',
    fecha_limite_inscripcion: new Date('2024-07-20T23:59:59Z'),
    es_publico: true,
    es_gratuito: false,
    costo_inscripcion: 100,
    moneda: 'EUR'
  }
]

async function seedTournaments() {
  try {
    console.log('🌱 Iniciando seed de torneos...')
    
    // Verificar si ya existen torneos
    const existingTournaments = await prisma.torneo.count()
    if (existingTournaments > 0) {
      console.log(`✅ Ya existen ${existingTournaments} torneos en la base de datos`)
      return
    }
    
    // Crear torneos de prueba
    for (const tournament of sampleTournaments) {
      const created = await prisma.torneo.create({
        data: tournament
      })
      console.log(`✅ Torneo creado: ${created.nombre}`)
    }
    
    console.log(`🎉 Se han creado ${sampleTournaments.length} torneos de prueba`)
    
  } catch (error) {
    console.error('❌ Error al crear torneos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTournaments()
