"use client";

import { useState, useEffect, useCallback } from 'react';

import { usePlayerPositioning } from '@/hooks/player/usePlayerPositioning';
import { usePlayerRadar } from '@/hooks/player/usePlayerRadar';
import type { Player } from '@/types/player';

import { StackedRadar, type RadarFilters, type RadarDataItem } from './components';

interface RadarsTabProps {
  player: Player;
}

// Convert physical attributes to radar data format
function convertPhysicalToRadarData(physicalAttributes: Array<{
  name: string;
  value: string;
  grade: string;
  color: string;
}>): RadarDataItem[] {
  return physicalAttributes.map(attr => ({
    category: attr.name,
    playerValue: parseFloat(attr.value),
    percentile: parseFloat(attr.value), // Use value as percentile for physical
    basePercentile: parseFloat(attr.value),
  }));
}

// Filter radar data for PERFORMANCE metrics
const PERFORMANCE_CATEGORIES = ['Goals', 'Assists', 'Shots', 'Crosses', 'Effectiveness %', 'Forward Passes', 'Accurate Passes %'];

// Filter radar data for IN PLAY metrics (duels focused)
const IN_PLAY_CATEGORIES = ['Off Duels', 'Off Duels Won %', 'Def Duels', 'Def Duels Won %', 'Aer Duels', 'Aer Duels Won %'];

export default function RadarsTab({ player }: RadarsTabProps) {
  // Get physical attributes from positioning hook
  const { physicalAttributes, isLoading: physicalLoading } = usePlayerPositioning(player);

  // Get performance and in-play data from radar hook (using attacking type which has both)
  const {
    radarData: attackingData,
    filterOptions,
    loading: attackingLoading,
    applyFilters,
  } = usePlayerRadar(player.id_player?.toString() || '');

  // Get defending data for complete in-play metrics
  const {
    radarData: defendingData,
    loading: defendingLoading,
  } = usePlayerRadar(player.id_player?.toString() || '');

  // Shared filter state
  const [filters, setFilters] = useState<RadarFilters>({
    position: '',
    nationality: '',
    competition: '',
    ageMin: '',
    ageMax: '',
    ratingMin: '',
    ratingMax: '',
  });

  // Apply filters when they change
  useEffect(() => {
    applyFilters(filters);
  }, [filters, applyFilters]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof RadarFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      position: '',
      nationality: '',
      competition: '',
      ageMin: '',
      ageMax: '',
      ratingMin: '',
      ratingMax: '',
    });
  }, []);

  // Prepare PHYSICAL radar data
  const physicalRadarData = convertPhysicalToRadarData(physicalAttributes);

  // Prepare PERFORMANCE radar data (filter from attacking data)
  const performanceRadarData = attackingData
    .filter(item => PERFORMANCE_CATEGORIES.includes(item.category))
    .map(item => ({
      category: item.category,
      playerValue: item.playerValue,
      percentile: item.percentile,
      basePercentile: item.basePercentile,
      comparisonAverage: item.comparisonAverage,
      rank: item.rank,
      totalPlayers: item.totalPlayers,
    }));

  // Prepare IN PLAY radar data (combine from attacking and defending data)
  const combinedData = [...attackingData, ...defendingData];
  const inPlayRadarData = IN_PLAY_CATEGORIES
    .map(category => {
      const item = combinedData.find(d => d.category === category);
      if (item) {
        return {
          category: item.category,
          playerValue: item.playerValue,
          percentile: item.percentile,
          basePercentile: item.basePercentile,
          comparisonAverage: item.comparisonAverage,
          rank: item.rank,
          totalPlayers: item.totalPlayers,
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null) as RadarDataItem[];

  const isLoading = physicalLoading || attackingLoading || defendingLoading;

  return (
    <div className="space-y-8">
      {/* PHYSICAL Radar */}
      <StackedRadar
        title="PHYSICAL"
        radarData={physicalRadarData}
        filterOptions={filterOptions}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        isLoading={physicalLoading}
        showFilters={true}
      />

      {/* PERFORMANCE Radar */}
      <StackedRadar
        title="PERFORMANCE"
        radarData={performanceRadarData}
        filterOptions={filterOptions}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        isLoading={attackingLoading}
        showFilters={true}
      />

      {/* IN PLAY Radar */}
      <StackedRadar
        title="IN PLAY"
        radarData={inPlayRadarData}
        filterOptions={filterOptions}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        isLoading={isLoading}
        showFilters={true}
      />
    </div>
  );
}
