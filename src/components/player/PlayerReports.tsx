"use client";

import { ExternalLink, FileText, Video, Bot, Globe } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

import type { Player } from "@/types/player";

interface Report {
  id: string;
  reportId: string;
  scoutName: string;
  scoutEmail?: string;
  profileType: string;
  status?: string | null;
  validation?: string | null;
  date: Date | string;
  playerName?: string | null;
  urlReference?: string | null;
  urlTrfm?: string | null;
  urlInstagram?: string | null;
  urlReport?: string | null;
  type?: 'video' | 'written' | 'social' | 'web';
  hasVideo?: boolean;
  image?: string;
  content?: string | null;
  rating?: number;
  videoUrls?: string[];
  reportData?: Record<string, unknown>;
}

interface PlayerReportsProps {
  player: Player;
}

const REPORT_TYPES = [
  { key: 'written', label: 'Texto', icon: FileText },
  { key: 'video', label: 'Video', icon: Video },
] as const;

function TextReportCard({ report }: { report: Report }) {
  const reportDate = report.date ? new Date(report.date).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) : 'No date';

  return (
    <div className="bg-white rounded-lg border border-[#e7e7e7] p-5 break-inside-avoid">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#2e3138]">{report.scoutName}</h3>
            <p className="text-xs text-[#6d6d6d]">{reportDate}</p>
          </div>
        </div>
        {report.status && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            report.status === 'approved' ? 'bg-green-100 text-green-700' :
            report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {report.status}
          </span>
        )}
      </div>

      {/* Content */}
      {report.content ? (
        <p className="text-sm text-[#2e3138] leading-relaxed whitespace-pre-line">
          {report.content}
        </p>
      ) : (
        <p className="text-sm text-[#6d6d6d] italic">No text content.</p>
      )}

      {/* Report URL */}
      {report.urlReport && (
        <a
          href={report.urlReport}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-[#8c1a10] hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          View full report
        </a>
      )}
    </div>
  );
}

function VideoReportCard({ report }: { report: Report }) {
  const reportDate = report.date ? new Date(report.date).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) : 'No date';

  // Collect all video URLs (main + additional)
  const videoUrls: string[] = [];
  if (report.urlReport) videoUrls.push(report.urlReport);
  if (report.videoUrls) videoUrls.push(...report.videoUrls);
  // Deduplicate
  const uniqueUrls = [...new Set(videoUrls)];

  return (
    <div className="bg-white rounded-lg border border-[#e7e7e7] p-5 break-inside-avoid">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
            <Video className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#2e3138]">{report.scoutName}</h3>
            <p className="text-xs text-[#6d6d6d]">{reportDate}</p>
          </div>
        </div>
      </div>

      {/* Video Links */}
      {uniqueUrls.length > 0 ? (
        <div className="space-y-2">
          {uniqueUrls.map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition-colors">
                <Video className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2e3138]">Video {uniqueUrls.length > 1 ? idx + 1 : ''}</p>
                <p className="text-xs text-[#6d6d6d] truncate">{url}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-[#6d6d6d] flex-shrink-0" />
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#6d6d6d] italic">No video URL available.</p>
      )}

      {/* Description if any */}
      {report.content && (
        <p className="text-sm text-[#6d6d6d] mt-3">{report.content}</p>
      )}
    </div>
  );
}

export default function PlayerReports({ player }: PlayerReportsProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('written');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!player.id_player) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/players/${player.id_player}/reports`);
        const data = await response.json();

        if (data.success) {
          setReports(data.reports);
        }
      } catch (error) {
        console.error('Error cargando reportes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [player.id_player]);

  const filteredReports = useMemo(() => {
    return reports.filter((report: Report) => report.type === selectedFilter);
  }, [selectedFilter, reports]);

  if (loading) {
    return (
      <div className="bg-white p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#8c1a10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6d6d6d]">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
        {REPORT_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = selectedFilter === type.key;
          const count = reports.filter((r: Report) => r.type === type.key).length;

          return (
            <button
              key={type.key}
              onClick={() => setSelectedFilter(type.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#8c1a10] text-white'
                  : 'bg-white text-[#6d6d6d] hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{type.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* AI Notice for Text Reports */}
      {selectedFilter === 'written' && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-blue-50 border border-blue-100 rounded-lg">
          <Bot className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">AI-generated reports</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Text reports are generated automatically by collecting information from social media and open sources. Multilingual.
              <span className="text-blue-400 ml-1">(Disponible proximamente)</span>
            </p>
          </div>
        </div>
      )}

      {/* Video Notice */}
      {selectedFilter === 'video' && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-100 rounded-lg">
          <Globe className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Enlaces a videos externos</p>
            <p className="text-xs text-red-600 mt-0.5">
              Los reportes de video contienen enlaces a visualizaciones externas en la URL de origen. Se pueden incluir hasta 5 URLs por reporte.
            </p>
          </div>
        </div>
      )}

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            {selectedFilter === 'written' ? (
              <FileText className="w-6 h-6 text-gray-400" />
            ) : (
              <Video className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <p className="text-[#6d6d6d] text-lg mb-2">
            No hay reportes de {selectedFilter === 'written' ? 'texto' : 'video'} disponibles
          </p>
          <p className="text-sm text-gray-500">
            {selectedFilter === 'written'
              ? 'Text reports will be generated automatically via AI.'
              : 'No video links have been added for this player.'}
          </p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 gap-6 space-y-6">
          {filteredReports.map((report: Report) => (
            selectedFilter === 'written'
              ? <TextReportCard key={report.id} report={report} />
              : <VideoReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
