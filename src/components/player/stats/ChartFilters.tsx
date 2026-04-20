'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface ChartFilterValues {
  position: string
  nationality: string
  competition: string
  ageMin: string
  ageMax: string
  trfmMin: string
  trfmMax: string
}

export interface FilterOption {
  value: string
  label: string
  count: number
}

export interface ChartFilterOptions {
  positions: FilterOption[]
  nationalities: FilterOption[]
  competitions: FilterOption[]
}

interface ChartFiltersProps {
  filters: ChartFilterValues
  onFilterChange: (filters: ChartFilterValues) => void
  filterOptions?: ChartFilterOptions | null
  onClear: () => void
}

export const EMPTY_FILTERS: ChartFilterValues = {
  position: '',
  nationality: '',
  competition: '',
  ageMin: '',
  ageMax: '',
  trfmMin: '',
  trfmMax: '',
}

export default function ChartFilters({ filters, onFilterChange, filterOptions, onClear }: ChartFiltersProps) {
  const update = (key: keyof ChartFilterValues, value: string) => {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Position */}
      <div>
        <label className="block text-sm font-medium text-[#2e3138] mb-2">Position</label>
        <Select value={filters.position} onValueChange={(val) => update('position', val)}>
          <SelectTrigger className="w-full" aria-label="Select position">
            <SelectValue placeholder="All Positions" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions?.positions.map((pos) => (
              <SelectItem key={pos.value} value={pos.value}>
                {pos.label} ({pos.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nationality */}
      <div>
        <label className="block text-sm font-medium text-[#2e3138] mb-2">Nationality</label>
        <Select value={filters.nationality} onValueChange={(val) => update('nationality', val)}>
          <SelectTrigger className="w-full" aria-label="Select nationality">
            <SelectValue placeholder="All Nationalities" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions?.nationalities.map((nat) => (
              <SelectItem key={nat.value} value={nat.value}>
                {nat.label} ({nat.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Competition */}
      <div>
        <label className="block text-sm font-medium text-[#2e3138] mb-2">Competition</label>
        <Select value={filters.competition} onValueChange={(val) => update('competition', val)}>
          <SelectTrigger className="w-full" aria-label="Select competition">
            <SelectValue placeholder="All Competitions" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions?.competitions.map((comp) => (
              <SelectItem key={comp.value} value={comp.value}>
                {comp.label} ({comp.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Age Range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="chart-age-min" className="block text-sm font-medium text-[#2e3138] mb-2">Min Age</label>
          <input
            type="number"
            id="chart-age-min"
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
            placeholder="16"
            min="16"
            max="45"
            value={filters.ageMin}
            onChange={(e) => update('ageMin', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="chart-age-max" className="block text-sm font-medium text-[#2e3138] mb-2">Max Age</label>
          <input
            type="number"
            id="chart-age-max"
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
            placeholder="45"
            min="16"
            max="45"
            value={filters.ageMax}
            onChange={(e) => update('ageMax', e.target.value)}
          />
        </div>
      </div>

      {/* TRFM Value Range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="chart-trfm-min" className="block text-sm font-medium text-[#2e3138] mb-2">Min TRFM Value</label>
          <input
            type="number"
            id="chart-trfm-min"
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
            placeholder="0"
            min="0"
            step="100000"
            value={filters.trfmMin}
            onChange={(e) => update('trfmMin', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="chart-trfm-max" className="block text-sm font-medium text-[#2e3138] mb-2">Max TRFM Value</label>
          <input
            type="number"
            id="chart-trfm-max"
            className="w-full p-2 border border-gray-300 rounded-md bg-white"
            placeholder="100000000"
            min="0"
            step="100000"
            value={filters.trfmMax}
            onChange={(e) => update('trfmMax', e.target.value)}
          />
        </div>
      </div>

      {/* Clear button */}
      <button
        onClick={onClear}
        className="text-sm text-[#6d6d6d] hover:text-[#8c1a10] transition-colors cursor-pointer"
      >
        Clear Filters
      </button>
    </div>
  )
}
