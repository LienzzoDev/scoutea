import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ReportFiltersProps {
  onFilterChange: (filters: ReportFiltersState) => void
  initialFilters?: ReportFiltersState
  className?: string
}

export interface ReportFiltersState {
  search: string // player name
  status: string
  validation: string
  type: string
}

export default function ReportFilters({ 
  onFilterChange, 
  initialFilters,
  className = ''
}: ReportFiltersProps) {
  const [filters, setFilters] = useState<ReportFiltersState>({
    search: initialFilters?.search || '',
    status: initialFilters?.status || 'all',
    validation: initialFilters?.validation || 'all',
    type: initialFilters?.type || 'all'
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters, onFilterChange])

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }

  const handleStatusChange = (value: string) => {
    setFilters(prev => ({ ...prev, status: value }))
  }

  const handleValidationChange = (value: string) => {
    setFilters(prev => ({ ...prev, validation: value }))
  }

  const handleTypeChange = (value: string) => {
    setFilters(prev => ({ ...prev, type: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      validation: 'all',
      type: 'all'
    })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por jugador..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-[#131921] border-slate-700 text-white placeholder:text-slate-400 w-full"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-2 xl:pb-0">
          {/* Status Filter */}
          <div className="min-w-[180px]">
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="bg-[#131921] border-slate-700 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-slate-700 text-white">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Validation Filter */}
          <div className="min-w-[180px]">
            <Select value={filters.validation} onValueChange={handleValidationChange}>
              <SelectTrigger className="bg-[#131921] border-slate-700 text-white">
                <SelectValue placeholder="Validación" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-slate-700 text-white">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="min-w-[180px]">
            <Select value={filters.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="bg-[#131921] border-slate-700 text-white">
                <SelectValue placeholder="Tipo de Reporte" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2332] border-slate-700 text-white">
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="match">Partido</SelectItem>
                <SelectItem value="training">Entrenamiento</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="live">En vivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {(filters.search || filters.status !== 'all' || filters.validation !== 'all' || filters.type !== 'all') && (
            <Button 
              variant="ghost" 
              onClick={clearFilters}
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-3"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
