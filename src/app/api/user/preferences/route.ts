import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

interface DashboardPreferences {
  selectedCategories?: string[]
  hiddenColumns?: string[]
}

/**
 * GET /api/user/preferences
 * Obtiene las preferencias del dashboard del usuario
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
      select: { dashboardPreferences: true }
    })

    if (!user) {
      // Usuario no existe, devolver preferencias por defecto
      return NextResponse.json({
        preferences: {
          selectedCategories: ['position', 'age', 'team'],
          hiddenColumns: []
        }
      })
    }

    const preferences = (user.dashboardPreferences as DashboardPreferences) || {
      selectedCategories: ['position', 'age', 'team'],
      hiddenColumns: []
    }

    return NextResponse.json({ preferences })

  } catch (error) {
    console.error('Error getting user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/preferences
 * Actualiza las preferencias del dashboard del usuario
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
    const { selectedCategories, hiddenColumns } = body

    // Validar que selectedCategories sea un array de strings
    if (selectedCategories && !Array.isArray(selectedCategories)) {
      return NextResponse.json(
        { error: 'selectedCategories must be an array' },
        { status: 400 }
      )
    }

    // Validar que hiddenColumns sea un array de strings
    if (hiddenColumns && !Array.isArray(hiddenColumns)) {
      return NextResponse.json(
        { error: 'hiddenColumns must be an array' },
        { status: 400 }
      )
    }

    // Buscar usuario existente
    const existingUser = await prisma.usuario.findUnique({
      where: { clerkId: userId },
      select: { dashboardPreferences: true }
    })

    if (!existingUser) {
      // Si el usuario no existe en la DB, no podemos guardar preferencias
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Merge con preferencias existentes
    const currentPreferences = (existingUser.dashboardPreferences as DashboardPreferences) || {}
    const newPreferences: DashboardPreferences = {
      ...currentPreferences,
      ...(selectedCategories !== undefined && { selectedCategories }),
      ...(hiddenColumns !== undefined && { hiddenColumns })
    }

    // Actualizar preferencias
    await prisma.usuario.update({
      where: { clerkId: userId },
      data: { dashboardPreferences: newPreferences }
    })

    return NextResponse.json({
      success: true,
      preferences: newPreferences
    })

  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
