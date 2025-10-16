import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Obtener todos los reportes con sus relaciones
    const allReports = await prisma.scoutPlayerReport.findMany({
      include: {
        report: {
          select: {
            id_report: true,
            player_name: true,
            report_type: true,
            report_date: true,
          },
        },
        scout: {
          select: {
            id_scout: true,
            scout_name: true,
          },
        },
        player: {
          select: {
            id_player: true,
            player_name: true,
          },
        },
      },
      take: 10,
    });

    // Contar reportes por jugador
    const reportsByPlayer = await prisma.scoutPlayerReport.groupBy({
      by: ['playerId'],
      _count: {
        playerId: true,
      },
    });

    return NextResponse.json({
      success: true,
      totalReports: allReports.length,
      reports: allReports,
      reportsByPlayer,
    });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
