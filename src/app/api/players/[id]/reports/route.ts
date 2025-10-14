import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = params.id;

    // Obtener todos los reportes del jugador a través de la tabla de relación
    const playerReports = await prisma.scoutPlayerReport.findMany({
      where: {
        playerId: playerId,
      },
      include: {
        report: true,
        scout: {
          select: {
            scout_name: true,
            scout_email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formatear los reportes para el frontend
    const formattedReports = playerReports.map((pr) => ({
      id: pr.id,
      reportId: pr.reportId,
      scoutName: pr.scout.scout_name || "Scout desconocido",
      scoutEmail: pr.scout.scout_email,
      profileType: pr.report.report_type || "Reporte general",
      status: pr.report.report_status,
      validation: pr.report.report_validation,
      date: pr.report.report_date || pr.createdAt,
      playerName: pr.report.player_name,
      // URLs
      urlReference: pr.report.form_url_reference,
      urlTrfm: pr.report.url_trfm,
      urlTrfmAdvisor: pr.report.url_trfm_advisor,
      urlSecondary: pr.report.url_secondary,
      urlInstagram: pr.report.url_instagram,
      // Datos del reporte completo por si se necesitan
      reportData: pr.report,
    }));

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      count: formattedReports.length,
    });
  } catch (error) {
    console.error("Error fetching player reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
