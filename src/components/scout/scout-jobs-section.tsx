'use client'

import { Briefcase, MapPin, Clock, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Job {
  id: string
  title: string
  club: string
  location: string
  type: string
  postedDate: string
  description: string
  requirements: string[]
}

// Datos de ejemplo de trabajos para scouts
const SAMPLE_JOBS: Job[] = [
  {
    id: '1',
    title: 'Scout Senior - Sudamérica',
    club: 'FC Barcelona',
    location: 'Barcelona, España',
    type: 'Tiempo completo',
    postedDate: '2024-02-01',
    description: 'Buscamos un scout experimentado para identificar y evaluar jóvenes talentos en Sudamérica.',
    requirements: ['5+ años de experiencia en scouting', 'Conocimiento del fútbol sudamericano', 'Dominio de español/portugués']
  },
  {
    id: '2',
    title: 'Scout Juvenil - Academia',
    club: 'Real Madrid',
    location: 'Madrid, España',
    type: 'Medio tiempo',
    postedDate: '2024-01-28',
    description: 'Únete a nuestra red de scouting de academia para identificar jugadores prometedores de 14-18 años.',
    requirements: ['Experiencia con fútbol juvenil', 'Licencias UEFA preferibles', 'Habilidades analíticas sólidas']
  },
  {
    id: '3',
    title: 'Analista de Datos Scout',
    club: 'Manchester City',
    location: 'Manchester, Reino Unido',
    type: 'Tiempo completo',
    postedDate: '2024-01-25',
    description: 'Combina scouting tradicional con análisis de datos para identificar objetivos de transferencia.',
    requirements: ['Experiencia en análisis de datos', 'Conocimiento de fútbol', 'Dominio de Excel/SQL']
  },
  {
    id: '4',
    title: 'Scout Regional - África',
    club: 'Chelsea FC',
    location: 'Londres, Reino Unido (Viajes requeridos)',
    type: 'Contrato',
    postedDate: '2024-01-20',
    description: 'Scouting y evaluación de jugadores en ligas y academias africanas.',
    requirements: ['Red de contactos en fútbol africano', 'Disponibilidad para viajar', '3+ años de experiencia']
  }
]

export default function ScoutJobsSection() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'hace 1 día'
    if (diffDays < 7) return `hace ${diffDays} días`
    if (diffDays < 30) return `hace ${Math.ceil(diffDays / 7)} semanas`
    return `hace ${Math.ceil(diffDays / 30)} meses`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#000000]">Trabajos Disponibles</h2>
          <p className="text-[#6d6d6d] mt-1">Descubre nuevas oportunidades en el scouting de fútbol</p>
        </div>
        <Button variant="outline" className="border-[#e7e7e7] text-[#6d6d6d]">
          <ExternalLink className="w-4 h-4 mr-2" />
          Ver Todos
        </Button>
      </div>

      {/* Jobs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SAMPLE_JOBS.map((job) => (
          <Card key={job.id} className="p-6 bg-white border-[#e7e7e7] hover:shadow-md transition-shadow">
            <div className="space-y-4">
              {/* Job Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#8B0000]/10 rounded-lg">
                    <Briefcase className="w-5 h-5 text-[#8B0000]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#000000] text-lg">{job.title}</h3>
                    <p className="text-[#8B0000] font-medium">{job.club}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {job.type}
                </span>
              </div>

              {/* Job Details */}
              <div className="flex items-center gap-4 text-sm text-[#6d6d6d]">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(job.postedDate)}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[#6d6d6d] text-sm leading-relaxed">
                {job.description}
              </p>

              {/* Requirements */}
              <div>
                <p className="text-sm font-medium text-[#000000] mb-2">Requisitos Principales:</p>
                <ul className="space-y-1">
                  {job.requirements.slice(0, 2).map((req, index) => (
                    <li key={index} className="text-sm text-[#6d6d6d] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#8B0000] rounded-full"></div>
                      {req}
                    </li>
                  ))}
                  {job.requirements.length > 2 && (
                    <li className="text-sm text-[#6d6d6d] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[#8B0000] rounded-full"></div>
                      +{job.requirements.length - 2} requisitos más
                    </li>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button className="bg-[#8B0000] hover:bg-[#660000] text-white flex-1">
                  Aplicar Ahora
                </Button>
                <Button variant="outline" className="border-[#e7e7e7] text-[#6d6d6d]">
                  Guardar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State for when no jobs */}
      {SAMPLE_JOBS.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-[#6d6d6d]" />
          </div>
          <p className="text-[#6d6d6d] text-lg mb-2">No jobs available at the moment</p>
          <p className="text-[#6d6d6d] text-sm">Check back later for new scouting opportunities</p>
        </div>
      )}
    </div>
  )
}