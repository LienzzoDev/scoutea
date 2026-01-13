"use client";

import { Play, Filter, Video, FileText, Share2 } from "lucide-react";
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
  reportData?: Record<string, unknown>;
}

interface PlayerReportsProps {
  player: Player;
}

const REPORT_TYPES = [
  { key: 'written', label: 'Scoutea', icon: FileText },
  { key: 'social', label: 'Redes sociales', icon: Share2 },
  { key: 'video', label: 'Video', icon: Video },
  { key: 'web', label: 'Web', icon: Filter },
] as const;

export default function PlayerReports({ player }: PlayerReportsProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('written');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar reportes del jugador desde la API
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

  // Filtrar reportes según el tipo seleccionado
  const filteredReports = useMemo(() => {
    if (selectedFilter === 'all') {
      return reports;
    }
    return reports.filter((report: Report) => report.type === selectedFilter);
  }, [selectedFilter, reports]);



  if (loading) {
    return (
      <div className="bg-white p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#8c1a10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6d6d6d]">Cargando reportes...</p>
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#8c1a10] text-white'
                  : 'bg-white text-[#6d6d6d] hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{type.label}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>



      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <p className="text-[#6d6d6d] text-lg mb-2">No hay reportes disponibles</p>
          <p className="text-sm text-gray-500">
            {selectedFilter === 'all' 
              ? 'No se han encontrado reportes para este jugador'
              : `No hay reportes de tipo "${REPORT_TYPES.find(t => t.key === selectedFilter)?.label}"`
            }
          </p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 gap-6 space-y-6">
          {filteredReports.map((report: Report) => {
            const reportDate = report.date ? new Date(report.date).toLocaleDateString('es-ES') : 'Sin fecha';
            const reportRating = report.rating || 0;

            return (
              <div key={report.id} className="bg-white rounded-lg border border-[#e7e7e7] p-4 break-inside-avoid">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="font-semibold text-[#2e3138]">{report.scoutName}</h3>
                      <p className="text-sm text-[#6d6d6d]">{report.profileType}</p>
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
                    {/* Type Badge */}
                    {report.type && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.type === 'video' ? 'bg-red-100 text-red-700' :
                        report.type === 'written' ? 'bg-blue-100 text-blue-700' :
                        report.type === 'social' ? 'bg-green-100 text-green-700' :
                        report.type === 'web' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {report.type === 'video' ? '📹' :
                         report.type === 'written' ? '📝' :
                         report.type === 'social' ? '📱' :
                         report.type === 'web' ? '🌐' : '📋'}
                      </div>
                    )}
                  </div>
                  {reportRating > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-[#2e3138]">{reportRating}.0</span>
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            i < reportRating ? 'bg-[#8c1a10]' : 'bg-gray-300'
                          }`}
                        >
                          <span className="text-white text-xs">⚽</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image/Video */}
                {report.image && (
                  <div className="relative mb-3">
                    <img
                      src={report.image}
                      alt="Report visual"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {report.hasVideo && (
                      <button className="absolute bottom-2 right-2 bg-[#8c1a10] text-white px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-[#a01e12] transition-colors">
                        <Play className="w-3 h-3" />
                        <span className="text-xs">Play</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                {report.content && (
                  <p className="text-sm text-[#6d6d6d] mb-3 leading-relaxed">
                    {report.content}
                  </p>
                )}

                {/* URLs si existen */}
                {(report.urlTrfm || report.urlInstagram || report.urlReference) && (
                  <div className="flex gap-2 mb-3">
                    {report.urlTrfm && (
                      <a href={report.urlTrfm} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8c1a10] hover:underline">
                        Transfermarkt
                      </a>
                    )}
                    {report.urlInstagram && (
                      <a href={report.urlInstagram} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8c1a10] hover:underline">
                        Instagram
                      </a>
                    )}
                    {report.urlReference && (
                      <a href={report.urlReference} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8c1a10] hover:underline">
                        Referencia
                      </a>
                    )}
                  </div>
                )}

                {/* Date */}
                <p className="text-xs text-[#6d6d6d] font-medium">{reportDate}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}