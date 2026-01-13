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
    // Solo mostrar reportes aprobados en la página del jugador
    const directReports = await prisma.reporte.findMany({
      where: {
        id_player: playerId,
        approval_status: 'approved',
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
    const formattedReports = directReports.map((report) => {
      // Determinar el tipo de reporte basado en el contenido
      let reportType: 'video' | 'written' | 'social' | 'web' = 'written';

      // Si tiene video, es Video
      if (report.form_url_video) {
        reportType = 'video';
      }
      // Si tiene URL de reporte externo y contiene instagram/twitter/tiktok, es Redes sociales
      else if (report.form_url_report && (
        report.form_url_report.includes('instagram') ||
        report.form_url_report.includes('twitter') ||
        report.form_url_report.includes('tiktok') ||
        report.form_url_report.includes('x.com')
      )) {
        reportType = 'social';
      }
      // Si tiene URL de reporte externo sin texto, es Web
      else if (report.form_url_report && !report.form_text_report) {
        reportType = 'web';
      }
      // Si tiene texto escrito, es Scoutea (escrito)
      else if (report.form_text_report) {
        reportType = 'written';
      }

      // Calcular rating basado en el potencial
      const potentialValue = report.form_potential ? parseFloat(report.form_potential) : null;
      const rating = potentialValue
        ? Math.min(5, Math.max(1, Math.round(potentialValue)))
        : 0;

      return {
        id: report.id_report,
        reportId: report.id_report,
        scoutName: report.scout?.scout_name || report.report_author || "Scout desconocido",
        scoutEmail: report.scout?.scout_email,
        profileType: report.report_type || "Reporte general",
        status: report.report_status,
        validation: report.report_validation,
        date: report.report_date || report.createdAt,
        playerName: report.player?.player_name || "Jugador desconocido",
        // Tipo de reporte
        type: reportType,
        // Contenido del reporte
        content: report.form_text_report || null,
        // Rating
        rating,
        // URLs - ahora desde player
        urlReference: undefined, // Campo eliminado (form_url_reference era temporal)
        urlTrfm: report.player?.url_trfm,
        urlTrfmAdvisor: report.player?.url_trfm_advisor,
        urlSecondary: report.player?.url_secondary,
        urlInstagram: report.player?.url_instagram,
        urlVideo: report.form_url_video,
        urlReport: report.form_url_report,
        textReport: report.form_text_report,
        // Datos del reporte completo
        reportData: report,
      };
    });

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
