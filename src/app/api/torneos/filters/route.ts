import { NextResponse } from 'next/server'

import { TournamentService } from '@/lib/services/tournament-service'

// GET /api/torneos/filters - Obtener opciones de filtros
export async function GET() {
  try {
    const filterOptions = await TournamentService.getFilterOptions()
    
    // Si no hay datos, devolver opciones por defecto
    const defaultOptions = {
      tiposTorneo: ['nacional', 'internacional', 'juvenil', 'profesional'],
      categorias: ['Sub-15', 'Sub-17', 'Sub-19', 'Sub-21', 'Absoluta'],
      generos: ['masculino', 'femenino', 'mixto'],
      estados: ['planificado', 'en_curso', 'finalizado', 'cancelado'],
      paises: ['España', 'Francia', 'Alemania', 'Italia', 'Portugal', 'Reino Unido']
    }
    
    // Combinar opciones de la base de datos con las por defecto
    const combinedOptions = {
      tiposTorneo: filterOptions.tiposTorneo.length > 0 ? filterOptions.tiposTorneo : defaultOptions.tiposTorneo,
      categorias: filterOptions.categorias.length > 0 ? filterOptions.categorias : defaultOptions.categorias,
      generos: filterOptions.generos.length > 0 ? filterOptions.generos : defaultOptions.generos,
      estados: filterOptions.estados.length > 0 ? filterOptions.estados : defaultOptions.estados,
      paises: filterOptions.paises.length > 0 ? filterOptions.paises : defaultOptions.paises
    }
    
    return NextResponse.json(combinedOptions)
  } catch (error) {
    console.error('Error fetching filter options:', error)
    
    // En caso de error, devolver opciones por defecto
    const defaultOptions = {
      tiposTorneo: ['nacional', 'internacional', 'juvenil', 'profesional'],
      categorias: ['Sub-15', 'Sub-17', 'Sub-19', 'Sub-21', 'Absoluta'],
      generos: ['masculino', 'femenino', 'mixto'],
      estados: ['planificado', 'en_curso', 'finalizado', 'cancelado'],
      paises: ['España', 'Francia', 'Alemania', 'Italia', 'Portugal', 'Reino Unido']
    }
    
    return NextResponse.json(defaultOptions)
  }
}
