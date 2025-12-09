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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface ScoutFiltersProps {
  onFilterChange: (filters: ScoutFiltersState) => void
  initialFilters?: ScoutFiltersState
  className?: string
}

export interface ScoutFiltersState {
  search: string
  nationality: string
  country: string
  openToWork: boolean | null
}

const NATIONALITIES = [
  'Spain', 'Argentina', 'Brazil', 'France', 'Germany', 
  'Italy', 'Portugal', 'England', 'Netherlands', 'Belgium'
]

const COUNTRIES = [
  'Spain', 'United Kingdom', 'France', 'Germany', 'Italy',
  'Portugal', 'Brazil', 'Argentina', 'USA', 'Netherlands'
]

export default function ScoutFilters({ 
  onFilterChange, 
  initialFilters,
  className = ''
}: ScoutFiltersProps) {
  const [filters, setFilters] = useState<ScoutFiltersState>({
    search: initialFilters?.search || '',
    nationality: initialFilters?.nationality || 'all',
    country: initialFilters?.country || 'all',
    openToWork: initialFilters?.openToWork || null
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

  const handleNationalityChange = (value: string) => {
    setFilters(prev => ({ ...prev, nationality: value }))
  }

  const handleCountryChange = (value: string) => {
    setFilters(prev => ({ ...prev, country: value }))
  }

  const handleOpenToWorkChange = (checked: boolean) => {
    setFilters(prev => ({ ...prev, openToWork: checked ? true : null }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      nationality: 'all',
      country: 'all',
      openToWork: null
    })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, email..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-[#131921] border-slate-700 text-white placeholder:text-slate-400 w-full"
          />
        </div>

        {/* Nationality Filter */}
        <div className="w-full md:w-48">
          <Select 
            value={filters.nationality} 
            onValueChange={handleNationalityChange}
          >
            <SelectTrigger className="bg-[#131921] border-slate-700 text-white">
              <SelectValue placeholder="Nacionalidad" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2332] border-slate-700 text-white">
              <SelectItem value="all">Todas</SelectItem>
              {NATIONALITIES.map(nat => (
                <SelectItem key={nat} value={nat}>{nat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country Filter */}
        <div className="w-full md:w-48">
          <Select 
            value={filters.country} 
            onValueChange={handleCountryChange}
          >
            <SelectTrigger className="bg-[#131921] border-slate-700 text-white">
              <SelectValue placeholder="País Residencia" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2332] border-slate-700 text-white">
              <SelectItem value="all">Todos</SelectItem>
              {COUNTRIES.map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Open to Work Checkbox */}
        <div className="flex items-center gap-2 bg-[#131921] border border-slate-700 px-3 rounded-md min-w-fit h-10">
          <Checkbox
            id="open-to-work"
            checked={filters.openToWork === true}
            onCheckedChange={handleOpenToWorkChange}
            className="data-[state=checked]:bg-green-600 border-slate-500"
          />
          <Label htmlFor="open-to-work" className="text-sm text-slate-300 cursor-pointer">
            Open to Work
          </Label>
        </div>

        {/* Clear Filters */}
        {(filters.search || filters.nationality !== 'all' || filters.country !== 'all' || filters.openToWork !== null) && (
          <Button 
            variant="ghost" 
            onClick={clearFilters}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  )
}
