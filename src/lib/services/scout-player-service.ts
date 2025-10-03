import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ScoutPlayerRelation {
  scoutId: string
  playerId: string
  reportId: string
  scout: {
    id_scout: string
    scout_name: string | null
    name: string | null
  }
  player: {
    id_player: string
    player_name: string
    position_player: string | null
  }
  report: {
    id_report: string
    report_date: Date | null
    report_type: string | null
    roi: number | null
    profit: number | null
  }
}

export class ScoutPlayerService {
  /**
   * Obtiene todos los jugadores reportados por un scout específico
   */
  static async getScoutPlayers(scoutId: string) {
    const reports = await prisma.reporte.findMany({
      where: {
        scout_id: scoutId,
        id_player: { not: null },
      },
      orderBy: {
        report_date: 'desc',
      },
    })

    // Si no hay reportes, devolver array vacío
    if (reports.length === 0) {
      return []
    }

    // Agrupar por jugador y obtener el reporte más reciente de cada uno
    const playerReportsMap = new Map()

    for (const report of reports) {
      if (report.id_player && !playerReportsMap.has(report.id_player)) {
        const player = await prisma.jugador.findUnique({
          where: { id_player: report.id_player },
          select: {
            id_player: true,
            player_name: true,
            position_player: true,
            nationality_1: true,
            team_name: true,
            player_rating: true,
            age: true,
          },
        })

        if (player) {
          playerReportsMap.set(report.id_player, {
            player,
            latestReport: {
              id_report: report.id_report,
              report_date: report.report_date,
              report_type: report.report_type,
              roi: report.roi,
              profit: report.profit,
              potential: report.form_potential ? parseFloat(report.form_potential) : null,
            },
            totalReports: reports.filter(r => r.id_player === report.id_player).length,
          })
        }
      }
    }

    return Array.from(playerReportsMap.values())
  }

  /**
   * Obtiene todos los reportes de un scout específico con información del jugador
   */
  static async getScoutReports(scoutId: string) {
    // Primero obtenemos los reportes del scout
    const reports = await prisma.reporte.findMany({
      where: {
        scout_id: scoutId,
      },
      orderBy: {
        report_date: 'desc',
      },
    })

    // Luego obtenemos la información adicional
    const reportsWithDetails = []
    for (const report of reports) {
      let player = null
      let scout = null

      if (report.id_player) {
        player = await prisma.jugador.findUnique({
          where: { id_player: report.id_player },
          select: {
            id_player: true,
            player_name: true,
            position_player: true,
            nationality_1: true,
            team_name: true,
            player_rating: true,
          },
        })
      }

      if (report.scout_id) {
        scout = await prisma.scout.findUnique({
          where: { id_scout: report.scout_id },
          select: {
            id_scout: true,
            scout_name: true,
            name: true,
          },
        })
      }

      reportsWithDetails.push({
        ...report,
        player,
        scout,
      })
    }

    return reportsWithDetails
  }

  /**
   * Obtiene todos los reportes sobre un jugador específico con información del scout
   */
  static async getPlayerReports(playerId: string) {
    // Primero obtenemos los reportes del jugador
    const reports = await prisma.reporte.findMany({
      where: {
        id_player: playerId,
      },
      orderBy: {
        report_date: 'desc',
      },
    })

    // Luego obtenemos la información adicional
    const reportsWithDetails = []
    for (const report of reports) {
      let player = null
      let scout = null

      if (report.id_player) {
        player = await prisma.jugador.findUnique({
          where: { id_player: report.id_player },
          select: {
            id_player: true,
            player_name: true,
            position_player: true,
          },
        })
      }

      if (report.scout_id) {
        scout = await prisma.scout.findUnique({
          where: { id_scout: report.scout_id },
          select: {
            id_scout: true,
            scout_name: true,
            name: true,
            nationality: true,
            scout_level: true,
          },
        })
      }

      reportsWithDetails.push({
        ...report,
        player,
        scout,
      })
    }

    return reportsWithDetails
  }

  /**
   * Obtiene estadísticas de la relación scout-player
   */
  static async getScoutPlayerStats(scoutId: string) {
    const reports = await prisma.reporte.findMany({
      where: {
        scout_id: scoutId,
      },
    })

    const uniquePlayers = new Set(reports.map(r => r.id_player).filter(Boolean))
    const totalReports = reports.length
    const avgROI = reports.reduce((sum, r) => sum + (r.roi || 0), 0) / totalReports
    const avgProfit = reports.reduce((sum, r) => sum + (r.profit || 0), 0) / totalReports

    const playersByPosition = reports.reduce(
      (acc, report) => {
        const position = report.position_player || 'Unknown'
        acc[position] = (acc[position] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalReports,
      uniquePlayersReported: uniquePlayers.size,
      averageROI: avgROI,
      averageProfit: avgProfit,
      playersByPosition,
      recentReports: reports.slice(0, 5),
    }
  }

  /**
   * Crea una nueva relación scout-player-report
   */
  static async createScoutPlayerReport(data: {
    scoutId: string
    playerId: string
    reportId: string
  }) {
    const relation = await prisma.scoutPlayerReport.create({
      data: {
        scoutId: data.scoutId,
        playerId: data.playerId,
        reportId: data.reportId,
      },
    })

    // Obtener los datos relacionados por separado
    const scout = await prisma.scout.findUnique({
      where: { id_scout: data.scoutId },
      select: {
        id_scout: true,
        scout_name: true,
        name: true,
      },
    })

    const player = await prisma.jugador.findUnique({
      where: { id_player: data.playerId },
      select: {
        id_player: true,
        player_name: true,
        position_player: true,
      },
    })

    const report = await prisma.reporte.findUnique({
      where: { id_report: data.reportId },
      select: {
        id_report: true,
        report_date: true,
        report_type: true,
      },
    })

    return {
      ...relation,
      scout,
      player,
      report,
    }
  }

  /**
   * Obtiene el historial completo de relaciones scout-player
   */
  static async getScoutPlayerHistory(scoutId?: string, playerId?: string) {
    const where: any = {}

    if (scoutId) where.scoutId = scoutId
    if (playerId) where.playerId = playerId

    const relations = await prisma.scoutPlayerReport.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Obtener datos relacionados para cada relación
    const relationsWithDetails = []
    for (const relation of relations) {
      const scout = await prisma.scout.findUnique({
        where: { id_scout: relation.scoutId },
        select: {
          id_scout: true,
          scout_name: true,
          name: true,
          scout_level: true,
        },
      })

      const player = await prisma.jugador.findUnique({
        where: { id_player: relation.playerId },
        select: {
          id_player: true,
          player_name: true,
          position_player: true,
          nationality_1: true,
          team_name: true,
        },
      })

      const report = await prisma.reporte.findUnique({
        where: { id_report: relation.reportId },
        select: {
          id_report: true,
          report_date: true,
          report_type: true,
          roi: true,
          profit: true,
        },
      })

      relationsWithDetails.push({
        ...relation,
        scout,
        player,
        report,
      })
    }

    return relationsWithDetails
  }

  /**
   * Migra reportes existentes para crear las relaciones scout-player
   * Útil para migrar datos existentes
   */
  static async migrateExistingReports() {
    const reports = await prisma.reporte.findMany({
      where: {
        AND: [{ scout_id: { not: null } }, { id_player: { not: null } }],
      },
      select: {
        id_report: true,
        scout_id: true,
        id_player: true,
      },
    })

    const relations = []
    for (const report of reports) {
      if (report.scout_id && report.id_player) {
        try {
          // Verificar si la relación ya existe
          const existingRelation = await prisma.scoutPlayerReport.findFirst({
            where: {
              scoutId: report.scout_id,
              playerId: report.id_player,
              reportId: report.id_report,
            },
          })

          if (!existingRelation) {
            const relation = await prisma.scoutPlayerReport.create({
              data: {
                scoutId: report.scout_id,
                playerId: report.id_player,
                reportId: report.id_report,
              },
            })
            relations.push(relation)
          }
        } catch (error) {
          console.error(`Error creating relation for report ${report.id_report}:`, error)
        }
      }
    }

    return {
      migratedRelations: relations.length,
      totalReports: reports.length,
    }
  }
}
