/**
 * 📥 ENDPOINT DE IMPORTACIÓN DE ATRIBUTOS FMI
 *
 * ✅ PROPÓSITO: Importar datos de atributos desde JSON (Football Manager)
 * ✅ BENEFICIO: Permite al admin cargar atributos FMI masivamente
 * ✅ RUTA: POST /api/admin/import-fmi
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// Helper function to convert undefined to null for Prisma
function toNullable(value: number | undefined): number | null {
  return value ?? null
}

interface FMIPlayerData {
  Id: number // Wyscout ID
  CA: number
  PA: number
  AskingPrice: number
  MatchSharpness: number
  Condition: number
  Jadedness: number
  Height: number
  Weight: number
  Morale: number
  WorldReputation: number
  CurrentReputation: number
  HomeReputation: number
  Born: string
  IntCaps: number
  IntGoals: number
  U21Caps: number
  U21Goals: number
  Number: number
  RCA: number
  ActualRating: number
  PotentialRating: number
  GoalKeeperAttributes: Record<string, number>
  MentalAttributes: Record<string, number>
  PhysicalAttributes: Record<string, number>
  HiddenAttributes: Record<string, number>
  TechnicalAttributes: Record<string, number>
  PersonalityAttributes: Record<string, number>
  Positions: Record<string, number>
  Nation: {
    Id: number
    Name: string
    ShortName: string
    Reputation: number
  }
}

/**
 * POST /api/admin/import-fmi - Importar atributos FMI
 */
export async function POST(request: NextRequest) {
  try {
    // 🔐 VERIFICAR AUTENTICACIÓN Y PERMISOS
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión.' },
        { status: 401 }
      )
    }

    // 👮‍♂️ VERIFICAR PERMISOS DE ADMIN
    const userRole = sessionClaims?.public_metadata?.role
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo los administradores pueden importar datos.' },
        { status: 403 }
      )
    }

    // 📝 OBTENER DATOS DEL BODY
    let fmiData: FMIPlayerData | FMIPlayerData[]
    try {
      fmiData = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Datos inválidos. El body debe ser JSON válido.' },
        { status: 400 }
      )
    }

    // Convertir a array si es un solo objeto
    const playersData = Array.isArray(fmiData) ? fmiData : [fmiData]

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // 🔄 PROCESAR CADA JUGADOR
    for (const playerData of playersData) {
      try {
        const wyscoutId = playerData.Id.toString()

        // 🔍 BUSCAR JUGADOR POR WYSCOUT ID
        const player = await prisma.jugador.findFirst({
          where: {
            OR: [
              { wyscout_id_1: wyscoutId },
              { wyscout_id_2: wyscoutId }
            ]
          }
        })

        if (!player) {
          results.failed++
          results.errors.push(`Jugador con Wyscout ID ${wyscoutId} no encontrado`)
          continue
        }

        // 📊 CALCULAR TOTAL FMI POINTS
        const totalFMIPoints = calculateTotalFMIPoints(playerData)

        // 🔄 ACTUALIZAR/CREAR ATRIBUTOS
        await prisma.atributos.upsert({
          where: {
            id_player: player.id_player
          },
          update: {
            // Atributos generales FMI
            id_fmi: playerData.Id,
            total_fmi_pts: playerData.CA + playerData.PA, // Suma de CA + PA como aproximación inicial

            // Atributos técnicos
            corners_fmi: toNullable(playerData.TechnicalAttributes.Corners),
            crossing_fmi: toNullable(playerData.TechnicalAttributes.Crossing),
            dribbling_fmi: toNullable(playerData.TechnicalAttributes.Dribbling),
            finishing_fmi: toNullable(playerData.TechnicalAttributes.Finishing),
            first_touch_fmi: toNullable(playerData.TechnicalAttributes.FirstTouch),
            free_kick_taking_fmi: toNullable(playerData.TechnicalAttributes.Freekicks),
            heading_fmi: toNullable(playerData.TechnicalAttributes.Heading),
            long_shots_fmi: toNullable(playerData.TechnicalAttributes.LongShots),
            passing_fmi: toNullable(playerData.TechnicalAttributes.Passing),
            penalty_taking_fmi: toNullable(playerData.TechnicalAttributes.PenaltyTaking),
            tackling_fmi: toNullable(playerData.TechnicalAttributes.Tackling),
            technique_fmi: toNullable(playerData.TechnicalAttributes.Technique),
            marking_fmi: toNullable(playerData.TechnicalAttributes.Marking),
            long_throws_fmi: toNullable(playerData.TechnicalAttributes.Longthrows),

            // Atributos mentales
            off_the_ball_fmi: toNullable(playerData.MentalAttributes.OffTheBall),
            positioning_fmi: toNullable(playerData.MentalAttributes.Positioning),
            aggression_fmi: toNullable(playerData.MentalAttributes.Aggression),
            anticipation_fmi: toNullable(playerData.MentalAttributes.Anticipation),
            bravery_fmi: toNullable(playerData.MentalAttributes.Bravery),
            composure_fmi: toNullable(playerData.MentalAttributes.Composure),
            concentration_fmi: toNullable(playerData.MentalAttributes.Concentration),
            decisions_fmi: toNullable(playerData.MentalAttributes.Decisions),
            determination_fmi: toNullable(playerData.MentalAttributes.Determination),
            flair_fmi: toNullable(playerData.MentalAttributes.Flair),
            leadership_fmi: toNullable(playerData.MentalAttributes.Leadership),
            team_work_fmi: toNullable(playerData.MentalAttributes.Teamwork),
            vision_fmi: toNullable(playerData.MentalAttributes.Vision),
            work_rate_fmi: toNullable(playerData.MentalAttributes.Workrate),

            // Atributos físicos
            acceleration_fmi: toNullable(playerData.PhysicalAttributes.Acceleration),
            agility_fmi: toNullable(playerData.PhysicalAttributes.Agility),
            balance_fmi: toNullable(playerData.PhysicalAttributes.Balance),
            jumping_fmi: toNullable(playerData.PhysicalAttributes.Jumping),
            natural_fitness_fmi: toNullable(playerData.PhysicalAttributes.NaturalFitness),
            pace_fmi: toNullable(playerData.PhysicalAttributes.Pace),
            stamina_fmi: toNullable(playerData.PhysicalAttributes.Stamina),
            strength_fmi: toNullable(playerData.PhysicalAttributes.Strength),
            left_foot_fmi: toNullable(playerData.PhysicalAttributes.LeftFoot),
            right_foot_fmi: toNullable(playerData.PhysicalAttributes.RightFoot),

            // Atributos de portero
            aerial_ability_fmi: toNullable(playerData.GoalKeeperAttributes.AerialAbility),
            command_of_area_fmi: toNullable(playerData.GoalKeeperAttributes.CommandOfArea),
            communication_fmi: toNullable(playerData.GoalKeeperAttributes.Communication),
            eccentricity_fmi: toNullable(playerData.GoalKeeperAttributes.Eccentricity),
            handling_fmi: toNullable(playerData.GoalKeeperAttributes.Handling),
            kicking_fmi: toNullable(playerData.GoalKeeperAttributes.Kicking),
            one_on_ones_fmi: toNullable(playerData.GoalKeeperAttributes.OneOnOnes),
            tendency_to_punch_fmi: toNullable(playerData.GoalKeeperAttributes.TendencyToPunch),
            reflexes_fmi: toNullable(playerData.GoalKeeperAttributes.Reflexes),
            rushing_out_fmi: toNullable(playerData.GoalKeeperAttributes.RushingOut),
            throwing_fmi: toNullable(playerData.GoalKeeperAttributes.Throwing),

            // Atributos ocultos
            consistency_fmi: toNullable(playerData.HiddenAttributes.Consistency),
            dirtiness_fmi: toNullable(playerData.HiddenAttributes.Dirtiness),
            important_matches_fmi: toNullable(playerData.HiddenAttributes.ImportantMatches),
            injury_proness_fmi: toNullable(playerData.HiddenAttributes.InjuryProness),
            versality_fmi: toNullable(playerData.HiddenAttributes.Versatility),

            // Atributos de personalidad
            adaptability_fmi: toNullable(playerData.PersonalityAttributes.Adaptability),
            ambition_fmi: toNullable(playerData.PersonalityAttributes.Ambition),
            loyalty_fmi: toNullable(playerData.PersonalityAttributes.Loyalty),
            pressure_fmi: toNullable(playerData.PersonalityAttributes.Pressure),
            professional_fmi: toNullable(playerData.PersonalityAttributes.Professional),
            sportsmanship_fmi: toNullable(playerData.PersonalityAttributes.Sportsmanship),
            temperament_fmi: toNullable(playerData.PersonalityAttributes.Temperament),
            controversy_fmi: toNullable(playerData.PersonalityAttributes.Controversy)
          },
          create: {
            id_player: player.id_player,

            // Atributos generales FMI
            id_fmi: playerData.Id,
            total_fmi_pts: playerData.CA + playerData.PA, // Suma de CA + PA como aproximación inicial

            // Atributos técnicos
            corners_fmi: toNullable(playerData.TechnicalAttributes.Corners),
            crossing_fmi: toNullable(playerData.TechnicalAttributes.Crossing),
            dribbling_fmi: toNullable(playerData.TechnicalAttributes.Dribbling),
            finishing_fmi: toNullable(playerData.TechnicalAttributes.Finishing),
            first_touch_fmi: toNullable(playerData.TechnicalAttributes.FirstTouch),
            free_kick_taking_fmi: toNullable(playerData.TechnicalAttributes.Freekicks),
            heading_fmi: toNullable(playerData.TechnicalAttributes.Heading),
            long_shots_fmi: toNullable(playerData.TechnicalAttributes.LongShots),
            passing_fmi: toNullable(playerData.TechnicalAttributes.Passing),
            penalty_taking_fmi: toNullable(playerData.TechnicalAttributes.PenaltyTaking),
            tackling_fmi: toNullable(playerData.TechnicalAttributes.Tackling),
            technique_fmi: toNullable(playerData.TechnicalAttributes.Technique),
            marking_fmi: toNullable(playerData.TechnicalAttributes.Marking),
            long_throws_fmi: toNullable(playerData.TechnicalAttributes.Longthrows),

            // Atributos mentales
            off_the_ball_fmi: toNullable(playerData.MentalAttributes.OffTheBall),
            positioning_fmi: toNullable(playerData.MentalAttributes.Positioning),
            aggression_fmi: toNullable(playerData.MentalAttributes.Aggression),
            anticipation_fmi: toNullable(playerData.MentalAttributes.Anticipation),
            bravery_fmi: toNullable(playerData.MentalAttributes.Bravery),
            composure_fmi: toNullable(playerData.MentalAttributes.Composure),
            concentration_fmi: toNullable(playerData.MentalAttributes.Concentration),
            decisions_fmi: toNullable(playerData.MentalAttributes.Decisions),
            determination_fmi: toNullable(playerData.MentalAttributes.Determination),
            flair_fmi: toNullable(playerData.MentalAttributes.Flair),
            leadership_fmi: toNullable(playerData.MentalAttributes.Leadership),
            team_work_fmi: toNullable(playerData.MentalAttributes.Teamwork),
            vision_fmi: toNullable(playerData.MentalAttributes.Vision),
            work_rate_fmi: toNullable(playerData.MentalAttributes.Workrate),

            // Atributos físicos
            acceleration_fmi: toNullable(playerData.PhysicalAttributes.Acceleration),
            agility_fmi: toNullable(playerData.PhysicalAttributes.Agility),
            balance_fmi: toNullable(playerData.PhysicalAttributes.Balance),
            jumping_fmi: toNullable(playerData.PhysicalAttributes.Jumping),
            natural_fitness_fmi: toNullable(playerData.PhysicalAttributes.NaturalFitness),
            pace_fmi: toNullable(playerData.PhysicalAttributes.Pace),
            stamina_fmi: toNullable(playerData.PhysicalAttributes.Stamina),
            strength_fmi: toNullable(playerData.PhysicalAttributes.Strength),
            left_foot_fmi: toNullable(playerData.PhysicalAttributes.LeftFoot),
            right_foot_fmi: toNullable(playerData.PhysicalAttributes.RightFoot),

            // Atributos de portero
            aerial_ability_fmi: toNullable(playerData.GoalKeeperAttributes.AerialAbility),
            command_of_area_fmi: toNullable(playerData.GoalKeeperAttributes.CommandOfArea),
            communication_fmi: toNullable(playerData.GoalKeeperAttributes.Communication),
            eccentricity_fmi: toNullable(playerData.GoalKeeperAttributes.Eccentricity),
            handling_fmi: toNullable(playerData.GoalKeeperAttributes.Handling),
            kicking_fmi: toNullable(playerData.GoalKeeperAttributes.Kicking),
            one_on_ones_fmi: toNullable(playerData.GoalKeeperAttributes.OneOnOnes),
            tendency_to_punch_fmi: toNullable(playerData.GoalKeeperAttributes.TendencyToPunch),
            reflexes_fmi: toNullable(playerData.GoalKeeperAttributes.Reflexes),
            rushing_out_fmi: toNullable(playerData.GoalKeeperAttributes.RushingOut),
            throwing_fmi: toNullable(playerData.GoalKeeperAttributes.Throwing),

            // Atributos ocultos
            consistency_fmi: toNullable(playerData.HiddenAttributes.Consistency),
            dirtiness_fmi: toNullable(playerData.HiddenAttributes.Dirtiness),
            important_matches_fmi: toNullable(playerData.HiddenAttributes.ImportantMatches),
            injury_proness_fmi: toNullable(playerData.HiddenAttributes.InjuryProness),
            versality_fmi: toNullable(playerData.HiddenAttributes.Versatility),

            // Atributos de personalidad
            adaptability_fmi: toNullable(playerData.PersonalityAttributes.Adaptability),
            ambition_fmi: toNullable(playerData.PersonalityAttributes.Ambition),
            loyalty_fmi: toNullable(playerData.PersonalityAttributes.Loyalty),
            pressure_fmi: toNullable(playerData.PersonalityAttributes.Pressure),
            professional_fmi: toNullable(playerData.PersonalityAttributes.Professional),
            sportsmanship_fmi: toNullable(playerData.PersonalityAttributes.Sportsmanship),
            temperament_fmi: toNullable(playerData.PersonalityAttributes.Temperament),
            controversy_fmi: toNullable(playerData.PersonalityAttributes.Controversy)
          }
        })

        // 🔄 ACTUALIZAR TOTAL FMI POINTS NORMALIZADO EN JUGADOR
        await prisma.jugador.update({
          where: { id_player: player.id_player },
          data: {
            total_fmi_pts_norm: totalFMIPoints
          }
        })

        results.success++

      } catch (error) {
        results.failed++
        results.errors.push(
          `Error procesando jugador ${playerData.Id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    // 📊 LOG DE AUDITORÍA
    console.log('✅ FMI Import completed:', {
      totalProcessed: playersData.length,
      successful: results.success,
      failed: results.failed,
      importedBy: userId,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: `Importación completada: ${results.success} exitosos, ${results.failed} fallidos`,
      results
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Error in FMI import:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor durante la importación.' },
      { status: 500 }
    )
  }
}

/**
 * Calcula el total de puntos FMI normalizados
 */
function calculateTotalFMIPoints(playerData: FMIPlayerData): number {
  // Suma de todos los atributos relevantes
  const mentalSum = Object.values(playerData.MentalAttributes).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)
  const physicalSum = Object.values(playerData.PhysicalAttributes).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)
  const technicalSum = Object.values(playerData.TechnicalAttributes).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)

  const totalAttributes = mentalSum + physicalSum + technicalSum

  // Normalizar a escala 0-100
  const maxPossible = (14 + 10 + 14) * 20 // Máximo posible si todos los atributos fueran 20
  const normalized = (totalAttributes / maxPossible) * 100

  return Math.round(normalized * 100) / 100 // Redondear a 2 decimales
}
