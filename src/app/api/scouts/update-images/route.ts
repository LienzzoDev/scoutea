import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    console.log('🖼️ Updating scout profile images...')

    // Mapeo de scouts con URLs de imágenes reales usando UI Avatars
    const scoutImageUpdates = [
      {
        id_scout: 'scout-1',
        url_profile: 'https://ui-avatars.com/api/?name=Carlos+Rodriguez&size=200&background=8c1a10&color=fff&bold=true'
      },
      {
        id_scout: 'scout-2',
        url_profile: 'https://ui-avatars.com/api/?name=Maria+Gonzalez&size=200&background=2563eb&color=fff&bold=true'
      },
      {
        id_scout: 'scout-3',
        url_profile: 'https://ui-avatars.com/api/?name=Juan+Perez&size=200&background=059669&color=fff&bold=true'
      },
      {
        id_scout: 'scout-4',
        url_profile: 'https://ui-avatars.com/api/?name=Sophie+Martin&size=200&background=7c3aed&color=fff&bold=true'
      },
      {
        id_scout: 'scout-5',
        url_profile: 'https://ui-avatars.com/api/?name=Marco+Rossi&size=200&background=dc2626&color=fff&bold=true'
      },
      {
        id_scout: 'scout-6',
        url_profile: 'https://ui-avatars.com/api/?name=Thomas+Mueller&size=200&background=ea580c&color=fff&bold=true'
      },
      {
        id_scout: 'scout-7',
        url_profile: 'https://ui-avatars.com/api/?name=Isabella+Silva&size=200&background=0891b2&color=fff&bold=true'
      },
      {
        id_scout: 'scout-8',
        url_profile: 'https://ui-avatars.com/api/?name=James+Wilson&size=200&background=4338ca&color=fff&bold=true'
      },
      {
        id_scout: 'scout-9',
        url_profile: 'https://ui-avatars.com/api/?name=Yuki+Tanaka&size=200&background=be185d&color=fff&bold=true'
      },
      {
        id_scout: 'scout-10',
        url_profile: 'https://ui-avatars.com/api/?name=Ahmed+Hassan&size=200&background=0d9488&color=fff&bold=true'
      },
      {
        id_scout: 'scout-11',
        url_profile: 'https://ui-avatars.com/api/?name=Olga+Petrov&size=200&background=7c2d12&color=fff&bold=true'
      },
      {
        id_scout: 'scout-12',
        url_profile: 'https://ui-avatars.com/api/?name=Diego+Morales&size=200&background=1d4ed8&color=fff&bold=true'
      },
      {
        id_scout: 'scout-13',
        url_profile: 'https://ui-avatars.com/api/?name=Emma+Andersson&size=200&background=c2410c&color=fff&bold=true'
      },
      {
        id_scout: 'scout-14',
        url_profile: 'https://ui-avatars.com/api/?name=Kwame+Asante&size=200&background=166534&color=fff&bold=true'
      },
      {
        id_scout: 'scout-15',
        url_profile: 'https://ui-avatars.com/api/?name=Luca+Bianchi&size=200&background=9333ea&color=fff&bold=true'
      }
    ]

    // Actualizar cada scout
    const updatePromises = scoutImageUpdates.map(update => 
      prisma.scout.update({
        where: { id_scout: update.id_scout },
        data: { url_profile: update.url_profile }
      })
    )

    const updatedScouts = await Promise.all(updatePromises)

    console.log('✅ Scout images updated successfully:', updatedScouts.length)

    return NextResponse.json({ 
      message: `${updatedScouts.length} scout images updated successfully`,
      scouts: updatedScouts.map(s => ({ 
        id: s.id_scout, 
        name: s.scout_name, 
        image: s.url_profile 
      }))
    })
  } catch (error) {
    console.error('❌ Error updating scout images:', error)
    return NextResponse.json(
      { 
        error: 'Error updating scout images',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}