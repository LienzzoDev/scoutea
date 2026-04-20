"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface RadarFilters {
  position: string;
  nationality: string;
  competition: string;
  ageMin: string;
  ageMax: string;
  ratingMin: string;
  ratingMax: string;
}

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterOptions {
  positions: FilterOption[];
  nationalities: FilterOption[];
  competitions: FilterOption[];
}

interface VerticalFiltersProps {
  filterOptions: FilterOptions | null;
  filters: RadarFilters;
  onFilterChange: (key: keyof RadarFilters, value: string) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

export default function VerticalFilters({
  filterOptions,
  filters,
  onFilterChange,
  onClearFilters,
  isLoading = false,
}: VerticalFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Position Filter */}
      <div>
        <span className="text-xs text-[#6d6d6d] mb-1 block">Position</span>
        <Select
          value={filters.position || "all"}
          onValueChange={(value) => onFilterChange('position', value === 'all' ? '' : value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full h-8 text-sm">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {filterOptions?.positions.map((pos) => (
              <SelectItem key={pos.value} value={pos.value}>
                {pos.label} ({pos.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nationality Filter */}
      <div>
        <span className="text-xs text-[#6d6d6d] mb-1 block">Nationality</span>
        <Select
          value={filters.nationality || "all"}
          onValueChange={(value) => onFilterChange('nationality', value === 'all' ? '' : value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full h-8 text-sm">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Nationalities</SelectItem>
            {filterOptions?.nationalities.map((nat) => (
              <SelectItem key={nat.value} value={nat.value}>
                {nat.label} ({nat.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Competition Filter */}
      <div>
        <span className="text-xs text-[#6d6d6d] mb-1 block">Competition</span>
        <Select
          value={filters.competition || "all"}
          onValueChange={(value) => onFilterChange('competition', value === 'all' ? '' : value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full h-8 text-sm">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Competitions</SelectItem>
            {filterOptions?.competitions.map((comp) => (
              <SelectItem key={comp.value} value={comp.value}>
                {comp.label} ({comp.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Age Range Filter */}
      <div>
        <span className="text-xs text-[#6d6d6d] mb-1 block">Age Range</span>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.ageMin}
            onChange={(e) => onFilterChange('ageMin', e.target.value)}
            className="h-8 text-sm"
            min={15}
            max={50}
            disabled={isLoading}
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.ageMax}
            onChange={(e) => onFilterChange('ageMax', e.target.value)}
            className="h-8 text-sm"
            min={15}
            max={50}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* TRFM Value Range Filter */}
      <div>
        <span className="text-xs text-[#6d6d6d] mb-1 block">TRFM Value</span>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.ratingMin}
            onChange={(e) => onFilterChange('ratingMin', e.target.value)}
            className="h-8 text-sm"
            min={0}
            step={0.1}
            disabled={isLoading}
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.ratingMax}
            onChange={(e) => onFilterChange('ratingMax', e.target.value)}
            className="h-8 text-sm"
            min={0}
            step={0.1}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="w-full mt-2 h-8 text-sm"
          disabled={isLoading}
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}
