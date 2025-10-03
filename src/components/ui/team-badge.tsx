"use client";

import { useState } from "react";
import { getTeamApiId } from "@/lib/utils/team-logos";

interface TeamBadgeProps {
  teamName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export default function TeamBadge({ 
  teamName, 
  size = "md", 
  className = "" 
}: TeamBadgeProps) {
  const [currentSource, setCurrentSource] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!teamName) {
    return <div className={`${sizeClasses[size]} ${className}`} />;
  }

  // Obtener el API ID del equipo
  const apiId = getTeamApiId(teamName);
  
  // Múltiples fuentes de logos en orden de preferencia (igual que en jobs)
  const logoSources = [
    // Football-data.org API (más confiable)
    `https://crests.football-data.org/${apiId}.png`,
    // API-Sports (alternativa)
    `https://media.api-sports.io/football/teams/${apiId}.png`,
    // Logo.dev (genérico pero funcional)
    `https://img.logo.dev/${teamName.toLowerCase().replace(/\s+/g, '')}.com?token=pk_X-1ZO13ESWmr-CV9l7hqQ`,
    // Placeholder genérico de fútbol
    `https://via.placeholder.com/96x96/8B0000/FFFFFF?text=${teamName.split(' ').map(w => w[0]).join('').substring(0, 3)}`
  ];

  if (hasError || currentSource >= logoSources.length) {
    // Fallback final: mostrar iniciales del equipo en un círculo
    const initials = teamName
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 3)
      .toUpperCase();
    
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-gradient-to-br from-[#8B0000] to-[#660000] text-white font-bold text-xs rounded-sm`}>
        {initials}
      </div>
    );
  }
  
  const handleError = () => {
    if (currentSource < logoSources.length - 1) {
      setCurrentSource(prev => prev + 1);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-sm animate-pulse">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        </div>
      )}
      <img
        key={currentSource} // Force re-render when source changes
        src={logoSources[currentSource]}
        alt={`${teamName} logo`}
        className={`${sizeClasses[size]} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 rounded-sm object-contain`}
        onLoad={() => setIsLoading(false)}
        onError={handleError}
      />
    </div>
  );
}