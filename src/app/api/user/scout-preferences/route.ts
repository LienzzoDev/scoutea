import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

interface ScoutPreferences {
  selectedCategories?: string[]
}

/**
 * GET /api/user/scout-preferences
 * Obtiene las preferencias de scouts del usuario
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await prisma.usuario.findUnique({
      where: { clerkId: userId },
      select: { scoutPreferences: true }
    })

    if (!user) {
      // Usuario no existe, devolver preferencias por defecto
      return NextResponse.json({
        preferences: {
          selectedCategories: ['scout_level', 'scout_elo', 'total_reports']
        }
      })
    }

    const preferences = (user.scoutPreferences as ScoutPreferences) || {
      selectedCategories: ['scout_level', 'scout_elo', 'total_reports']
    }

    return NextResponse.json({ preferences })

  } catch (error) {
    console.error('Error getting scout preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/scout-preferences
 * Actualiza las preferencias de scouts del usuario
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { selectedCategories } = body

    // Validar que selectedCategories sea un array de strings
    if (selectedCategories && !Array.isArray(selectedCategories)) {
      return NextResponse.json(
        { error: 'selectedCategories must be an array' },
        { status: 400 }
      )
    }

    // Buscar usuario existente
    const existingUser = await prisma.usuario.findUnique({
      where: { clerkId: userId },
      select: { scoutPreferences: true }
    })

    if (!existingUser) {
      // Si el usuario no existe en la DB, no podemos guardar preferencias
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Merge con preferencias existentes
    const currentPreferences = (existingUser.scoutPreferences as ScoutPreferences) || {}
    const newPreferences: ScoutPreferences = {
      ...currentPreferences,
      ...(selectedCategories !== undefined && { selectedCategories })
    }

    // Actualizar preferencias
    await prisma.usuario.update({
      where: { clerkId: userId },
      data: { scoutPreferences: newPreferences }
    })

    return NextResponse.json({
      success: true,
      preferences: newPreferences
    })

  } catch (error) {
    console.error('Error updating scout preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
