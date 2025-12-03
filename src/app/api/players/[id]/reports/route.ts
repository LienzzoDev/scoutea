import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playerIdStr } = await params;
    const playerId = parseInt(playerIdStr, 10);

    if (isNaN(playerId)) {
      return NextResponse.json(
        { error: "Invalid player ID" },
        { status: 400 }
      );
    }

    // Buscar directamente en la tabla Reporte por id_player
    const directReports = await prisma.reporte.findMany({
      where: {
        id_player: playerId,
      },
      include: {
        scout: {
          select: {
            scout_name: true,
            scout_email: true,
          },
        },
        player: {
          select: {
            player_name: true,
            url_trfm: true,
            url_trfm_advisor: true,
            url_secondary: true,
            url_instagram: true,
          },
        },
      },
      orderBy: {
        report_date: 'desc',
      },
    });

    // Formatear reportes
    const formattedReports = directReports.map((report) => ({
      id: report.id_report,
      reportId: report.id_report,
      scoutName: report.scout?.scout_name || report.report_author || "Scout desconocido",
      scoutEmail: report.scout?.scout_email,
      profileType: report.report_type || "Reporte general",
      status: report.report_status,
      validation: report.report_validation,
      date: report.report_date || report.createdAt,
      playerName: report.player?.player_name || "Jugador desconocido",
      // URLs - ahora desde player
      urlReference: undefined, // Campo eliminado (form_url_reference era temporal)
      urlTrfm: report.player?.url_trfm,
      urlTrfmAdvisor: report.player?.url_trfm_advisor,
      urlSecondary: report.player?.url_secondary,
      urlInstagram: report.player?.url_instagram,
      urlVideo: report.form_url_video,
      textReport: report.form_text_report,
      // Datos del reporte completo
      reportData: report,
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
