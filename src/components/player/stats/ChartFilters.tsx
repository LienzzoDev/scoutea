'use client'

import MultiSelectFilter from '@/components/filters/multi-select-filter'

export interface ChartFilterValues {
  positions: string[]
  nationalities: string[]
  competitions: string[]
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
  positions: [],
  nationalities: [],
  competitions: [],
  ageMin: '',
  ageMax: '',
  trfmMin: '',
  trfmMax: '',
}

export default function ChartFilters({ filters, onFilterChange, filterOptions, onClear }: ChartFiltersProps) {
  const update = <K extends keyof ChartFilterValues>(key: K, value: ChartFilterValues[K]) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const positionsOptions = (filterOptions?.positions || []).map(o => o.value)
  const nationalitiesOptions = (filterOptions?.nationalities || []).map(o => o.value)
  const competitionsOptions = (filterOptions?.competitions || []).map(o => o.value)

  return (
    <div className="space-y-4">
      {/* Position (multi) */}
      <div>
        <span className="block text-sm font-medium text-[#2e3138] mb-2">Position</span>
        <MultiSelectFilter
          label="Position"
          options={positionsOptions}
          selectedValues={filters.positions}
          onSelectionChange={(values) => update('positions', values)}
          placeholder="All Positions"
          searchPlaceholder="Search positions..."
        />
      </div>

      {/* Nationality (multi) */}
      <div>
        <span className="block text-sm font-medium text-[#2e3138] mb-2">Nationality</span>
        <MultiSelectFilter
          label="Nationality"
          options={nationalitiesOptions}
          selectedValues={filters.nationalities}
          onSelectionChange={(values) => update('nationalities', values)}
          placeholder="All Nationalities"
          searchPlaceholder="Search nationalities..."
        />
      </div>

      {/* Competition (multi) */}
      <div>
        <span className="block text-sm font-medium text-[#2e3138] mb-2">Competition</span>
        <MultiSelectFilter
          label="Competition"
          options={competitionsOptions}
          selectedValues={filters.competitions}
          onSelectionChange={(values) => update('competitions', values)}
          placeholder="All Competitions"
          searchPlaceholder="Search competitions..."
        />
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
