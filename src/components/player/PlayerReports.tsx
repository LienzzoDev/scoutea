"use client";

import { Play, Filter, Video, FileText, Share2 } from "lucide-react";
import { useState, useMemo } from "react";

import type { Player } from "@/types/player";

interface Report {
  id: string;
  scoutName: string;
  profileType: string;
  content: string;
  rating: number;
  date: string;
  type: 'video' | 'written' | 'social';
  hasVideo?: boolean;
  image?: string;
}

interface PlayerReportsProps {
  player: Player;
}

const REPORT_TYPES = [
  { key: 'all', label: 'Todos los reportes', icon: Filter },
  { key: 'video', label: 'Video Reporte', icon: Video },
  { key: 'written', label: 'Scouteo (escrito)', icon: FileText },
  { key: 'social', label: 'Redes sociales', icon: Share2 },
] as const;

export default function PlayerReports({ player }: PlayerReportsProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Datos de ejemplo de reportes
  const mockReports: Report[] = [
    {
      id: '1',
      scoutName: 'Gines Mesas',
      profileType: 'Extremo Derecho',
      content: 'Excelente técnica individual y gran capacidad de desborde. Su velocidad y precisión en el último pase lo convierten en una amenaza constante por la banda derecha.',
      rating: 5,
      date: '15/12/2023',
      type: 'video',
      hasVideo: true,
      image: '/player-detail-placeholder.svg'
    },
    {
      id: '2',
      scoutName: 'Carlos Rodríguez',
      profileType: 'Análisis Táctico',
      content: 'Jugador con gran visión de juego y capacidad para encontrar espacios. Su posicionamiento es excepcional y siempre busca la jugada que rompa las líneas defensivas.',
      rating: 4,
      date: '10/12/2023',
      type: 'written'
    },
    {
      id: '3',
      scoutName: 'María González',
      profileType: 'Redes Sociales',
      content: 'Gran actividad en redes sociales, muestra profesionalismo y compromiso con el equipo. Interacción positiva con aficionados y compañeros.',
      rating: 4,
      date: '08/12/2023',
      type: 'social'
    },
    {
      id: '4',
      scoutName: 'Antonio López',
      profileType: 'Video Análisis',
      content: 'Destacable su capacidad física y resistencia durante todo el partido. Mantiene un alto nivel de intensidad desde el primer hasta el último minuto.',
      rating: 5,
      date: '05/12/2023',
      type: 'video',
      hasVideo: true,
      image: '/player-detail-placeholder.svg'
    },
    {
      id: '5',
      scoutName: 'Laura Martín',
      profileType: 'Informe Técnico',
      content: 'Su técnica con ambas piernas es sobresaliente. Capaz de crear jugadas de peligro tanto por dentro como por fuera, adaptándose perfectamente a diferentes sistemas tácticos.',
      rating: 5,
      date: '01/12/2023',
      type: 'written'
    },
    {
      id: '6',
      scoutName: 'Social Media Team',
      profileType: 'Impacto Digital',
      content: 'Excelente presencia en redes sociales con contenido de calidad. Gran engagement con los seguidores y representación positiva de los valores del club.',
      rating: 4,
      date: '28/11/2023',
      type: 'social'
    }
  ];

  // Filtrar reportes según el tipo seleccionado
  const filteredReports = useMemo(() => {
    if (selectedFilter === 'all') {
      return mockReports;
    }
    return mockReports.filter(report => report.type === selectedFilter);
  }, [selectedFilter]);

  // Calcular rating promedio
  const averageRating = useMemo(() => {
    if (filteredReports.length === 0) return 0;
    const sum = filteredReports.reduce((acc, report) => acc + report.rating, 0);
    return (sum / filteredReports.length).toFixed(1);
  }, [filteredReports]);
  return (
    <div className="bg-white p-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
        {REPORT_TYPES.map((type) => {
          const Icon = type.icon;
          const isActive = selectedFilter === type.key;
          const count = type.key === 'all' ? mockReports.length : mockReports.filter(r => r.type === type.key).length;
          
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

      {/* Overall Rating */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <span className="text-2xl font-bold text-[#2e3138]">{averageRating}</span>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                i < Math.floor(parseFloat(averageRating)) ? 'bg-[#8c1a10]' : 'bg-gray-300'
              }`}
            >
              <span className="text-white text-xs">⚽</span>
            </div>
          ))}
        </div>
        <span className="text-sm text-[#6d6d6d] ml-2">
          ({filteredReports.length} reporte{filteredReports.length !== 1 ? 's' : ''})
        </span>
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
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg border border-[#e7e7e7] p-4 break-inside-avoid">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="font-semibold text-[#2e3138]">{report.scoutName}</h3>
                    <p className="text-sm text-[#6d6d6d]">{report.profileType}</p>
                  </div>
                  {/* Type Badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    report.type === 'video' ? 'bg-red-100 text-red-700' :
                    report.type === 'written' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {report.type === 'video' ? '📹' : report.type === 'written' ? '📝' : '📱'}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-[#2e3138]">{report.rating}.0</span>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        i < report.rating ? 'bg-[#8c1a10]' : 'bg-gray-300'
                      }`}
                    >
                      <span className="text-white text-xs">⚽</span>
                    </div>
                  ))}
                </div>
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
              <p className="text-sm text-[#6d6d6d] mb-3 leading-relaxed">
                {report.content}
              </p>

              {/* Date */}
              <p className="text-xs text-[#6d6d6d] font-medium">{report.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}