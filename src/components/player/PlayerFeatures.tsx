"use client";

import { useState, useEffect } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlayerPositioning } from "@/hooks/player/usePlayerPositioning";
import type { Player } from "@/types/player";

interface PlayerFeaturesProps {
  player: Player;
  activeFeaturesTab: string;
  onFeaturesTabChange: (tab: string) => void;
}

interface PlayerRole {
  role_name: string;
  percentage: number;
}

export default function PlayerFeatures({
  player,
  activeFeaturesTab,
  onFeaturesTabChange,
}: PlayerFeaturesProps) {
  const {
    positions,
    physicalAttributes,
    leftFoot,
    rightFoot,
    isLoading
  } = usePlayerPositioning(player);

  const [playerRoles, setPlayerRoles] = useState<PlayerRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Fetch player roles when tab changes to player-role
  useEffect(() => {
    if (activeFeaturesTab === 'player-role') {
      fetchPlayerRoles();
    }
  }, [activeFeaturesTab, player.id_player]);

  const fetchPlayerRoles = async () => {
    setRolesLoading(true);
    try {
      const response = await fetch(`/api/player/${player.id_player}/roles`);
      if (response.ok) {
        const data = await response.json();
        setPlayerRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching player roles:', error);
    } finally {
      setRolesLoading(false);
    }
  };
  return (
    <div className="bg-white p-6">
      {/* Features Sub-tabs */}
      <div className="flex gap-8 border-b border-[#e7e7e7] mb-6">
        <button
          className={`pb-3 font-medium ${
            activeFeaturesTab === "on-the-pitch"
              ? "border-b-2 border-[#8c1a10] text-[#2e3138]"
              : "text-[#6d6d6d]"
          }`}
          onClick={() =>onFeaturesTabChange("on-the-pitch")}
        >
          On the Pitch
        </button>
        <button
          className={`pb-3 font-medium ${
            activeFeaturesTab === "player-role"
              ? "border-b-2 border-[#8c1a10] text-[#2e3138]"
              : "text-[#6d6d6d]"
          }`}
          onClick={() =>onFeaturesTabChange("player-role")}
        >
          Player Role
        </button>
      </div>{/* Features Content */}
      {activeFeaturesTab === "on-the-pitch" && (
        <div className="space-y-8">
          {/* On the Pitch */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#8c1a10]">ON THE PITCH</h3>
              </div>
              <div className="text-sm text-[#6d6d6d]">
                <span className="font-medium">Posición:</span> {player.position_player || player.correct_position_player || 'N/A'} | 
                <span className="font-medium ml-2">Pie:</span> {player.foot || player.correct_foot || 'N/A'} |
                <span className="font-medium ml-2">Altura:</span> {player.height || player.correct_height || 'N/A'}cm
              </div>
            </div>

            {/* Football Pitch with Positions */}
            <div className="relative bg-green-100 rounded-lg p-8">
              {isLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="text-[#6d6d6d]">Cargando posiciones...</div>
                </div>
              ) : (
                <svg className="w-full h-80" viewBox="0 0 600 400">
                  {/* Pitch outline */}
                  <rect
                    x="50"
                    y="50"
                    width="500"
                    height="300"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    rx="10"
                  />
                  {/* Center line */}
                  <line
                    x1="300"
                    y1="50"
                    x2="300"
                    y2="350"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                  {/* Center circle */}
                  <circle
                    cx="300"
                    cy="200"
                    r="50"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                  {/* Goal areas */}
                  <rect
                    x="50"
                    y="150"
                    width="30"
                    height="100"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                  <rect
                    x="520"
                    y="150"
                    width="30"
                    height="100"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />

                  {/* Dynamic Position blocks based on real data */}
                  {positions.map((position, index) => (
                    <g key={index}>
                      <rect
                        x={position.x - 20}
                        y={position.y - 10}
                        width="40"
                        height="20"
                        fill={position.color}
                        fillOpacity={position.isMainPosition ? 1 : 0.7}
                        rx="4"
                        stroke={position.isMainPosition ? "#000" : "none"}
                        strokeWidth={position.isMainPosition ? "2" : "0"}
                      />
                      <text
                        x={position.x}
                        y={position.y + 3}
                        textAnchor="middle"
                        className={`text-xs font-bold ${
                          position.color === '#eab308' ? 'fill-black' : 'fill-white'
                        }`}
                      >
                        {position.position.length > 4 
                          ? position.position.substring(0, 3) 
                          : position.position}
                      </text>
                    </g>
                  ))}

                  {/* Player info */}
                  <text
                    x="300"
                    y="30"
                    textAnchor="middle"
                    className="text-sm font-bold fill-[#2e3138]"
                  >
                    {player.player_name} - Posiciones en el Campo
                  </text>
                </svg>
              )}
            </div>
          </div>

          {/* Physical */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-xl font-bold text-[#8c1a10]">PHYSICAL</h3>
            </div>
            <div className="grid grid-cols-2 gap-8">
              {/* Physical Attributes */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-[#6d6d6d]">Cargando atributos...</div>
                ) : (
                  physicalAttributes.map((attribute, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-[#2e3138] font-medium">{attribute.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#6d6d6d]">{attribute.value}</span>
                        <span 
                          className="text-lg font-bold"
                          style={{ color: attribute.color }}
                        >
                          {attribute.grade}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Radar Chart */}
              <div className="flex items-center justify-center">
                {isLoading ? (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <span className="text-[#6d6d6d]">Cargando radar...</span>
                  </div>
                ) : (
                  <svg className="w-64 h-64" viewBox="0 0 200 200">
                    {/* Concentric circles */}
                    {[1, 2, 3, 4, 5].map((circle, i) => (
                      <circle
                        key={circle}
                        cx="100"
                        cy="100"
                        r={20 + i * 15}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Axes and labels */}
                    {physicalAttributes.map((attribute, i) => {
                      const angle = (i * 60) - 90; // 6 attributes, 60 degrees apart
                      const x1 = 100 + 80 * Math.cos((angle * Math.PI) / 180);
                      const y1 = 100 + 80 * Math.sin((angle * Math.PI) / 180);
                      const x2 = 100 + 90 * Math.cos((angle * Math.PI) / 180);
                      const y2 = 100 + 90 * Math.sin((angle * Math.PI) / 180);
                      
                      return (
                        <g key={i}>
                          <line
                            x1="100"
                            y1="100"
                            x2={x1}
                            y2={y1}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                          />
                          <text
                            x={x2}
                            y={y2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-xs fill-gray-600"
                          >
                            {attribute.name.substring(0, 8)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Data polygon */}
                    {physicalAttributes.length > 0 && (
                      <polygon
                        points={physicalAttributes.map((attribute, i) => {
                          const angle = (i * 60) - 90;
                          const value = parseFloat(attribute.value);
                          const length = (value / 100) * 70; // Scale to radar size
                          const x = 100 + length * Math.cos((angle * Math.PI) / 180);
                          const y = 100 + length * Math.sin((angle * Math.PI) / 180);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="#3b82f6"
                        fillOpacity="0.3"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                    )}

                    {/* Data points */}
                    {physicalAttributes.map((attribute, i) => {
                      const angle = (i * 60) - 90;
                      const value = parseFloat(attribute.value);
                      const length = (value / 100) * 70;
                      const x = 100 + length * Math.cos((angle * Math.PI) / 180);
                      const y = 100 + length * Math.sin((angle * Math.PI) / 180);
                      
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="3"
                          fill={attribute.color}
                          stroke="#fff"
                          strokeWidth="1"
                        />
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="mt-6 flex gap-4">
              <Select defaultValue="position">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="position">Position</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="age">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="age">Age</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="nationality">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nationality">Nationality</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="competition">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="competition">Competition</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="trfm">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trfm">TRFM Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Foot */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-xl font-bold text-[#8c1a10]">FOOT</h3>
            </div>
            <div className="grid grid-cols-2 gap-12">
              {/* Left Foot */}
              <div className="text-center">
                <h4 className="text-lg font-semibold text-[#2e3138] mb-6">
                  PIE IZQUIERDO
                </h4>
                <div className="relative flex flex-col items-center">
                  {isLoading ? (
                    <div className="w-48 h-40 flex items-center justify-center">
                      <span className="text-[#6d6d6d]">Cargando...</span>
                    </div>
                  ) : (
                    <>
                      {/* Circular Progress */}
                      <div className="relative w-32 h-32 mb-4">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                          {/* Background circle */}
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                          />
                          {/* Progress circle */}
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke={leftFoot.color}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${leftFoot.dominance * 3.14} 314`}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        {/* Center content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-[#2e3138]">
                            {leftFoot.dominance}%
                          </span>
                          <span 
                            className="text-lg font-semibold"
                            style={{ color: leftFoot.color }}
                          >
                            {leftFoot.grade}
                          </span>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="space-y-2 w-full">
                        <div className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg">
                          <span className="text-sm font-medium text-[#6d6d6d]">Dominancia:</span>
                          <span className="text-sm font-bold text-[#2e3138]">{leftFoot.dominance}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg">
                          <span className="text-sm font-medium text-[#6d6d6d]">Tendencia:</span>
                          <span className="text-sm font-bold text-[#2e3138]">{leftFoot.tendency}%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Foot */}
              <div className="text-center">
                <h4 className="text-lg font-semibold text-[#2e3138] mb-6">
                  PIE DERECHO
                </h4>
                <div className="relative flex flex-col items-center">
                  {isLoading ? (
                    <div className="w-48 h-40 flex items-center justify-center">
                      <span className="text-[#6d6d6d]">Cargando...</span>
                    </div>
                  ) : (
                    <>
                      {/* Circular Progress */}
                      <div className="relative w-32 h-32 mb-4">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                          {/* Background circle */}
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                          />
                          {/* Progress circle */}
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke={rightFoot.color}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${rightFoot.dominance * 3.14} 314`}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        {/* Center content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-[#2e3138]">
                            {rightFoot.dominance}%
                          </span>
                          <span 
                            className="text-lg font-semibold"
                            style={{ color: rightFoot.color }}
                          >
                            {rightFoot.grade}
                          </span>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="space-y-2 w-full">
                        <div className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg">
                          <span className="text-sm font-medium text-[#6d6d6d]">Dominancia:</span>
                          <span className="text-sm font-bold text-[#2e3138]">{rightFoot.dominance}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg">
                          <span className="text-sm font-medium text-[#6d6d6d]">Tendencia:</span>
                          <span className="text-sm font-bold text-[#2e3138]">{rightFoot.tendency}%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-[#6d6d6d]">
                  <span className="font-medium">Pie preferido:</span> {player.foot || player.correct_foot || 'N/A'}
                </div>
                <div className="text-sm text-[#6d6d6d]">
                  <span className="font-medium">Versatilidad:</span> 
                  {Math.abs(leftFoot.dominance - rightFoot.dominance) < 20 ? ' Alta' : 
                   Math.abs(leftFoot.dominance - rightFoot.dominance) < 40 ? ' Media' : ' Baja'}
                </div>
              </div>
            </div>
          </div>
        </div>)}

      {activeFeaturesTab === "player-role" && (
        <div className="space-y-8">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-xl font-bold text-[#8c1a10]">PLAYER ROLE</h3>
            </div>

            {/* Player Roles with horizontal bars */}
            {rolesLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-[#6d6d6d]">Cargando roles del jugador...</span>
              </div>
            ) : playerRoles.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-[#6d6d6d]">No hay datos de roles disponibles para este jugador</span>
              </div>
            ) : (
              <div className="space-y-3">
                {playerRoles.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  {/* Role name */}
                  <div className="w-48 text-sm text-[#2e3138] font-medium">
                    {item.role_name}
                  </div>

                  {/* Bar container */}
                  <div className="flex-1 relative h-5 bg-gray-100 rounded">
                    {/* Filled bar */}
                    <div
                      className="absolute left-0 top-0 h-full rounded transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.percentage > 0 ? '#a85a52' : '#d1d5db'
                      }}
                    />
                  </div>

                  {/* Percentage label */}
                  <div className="w-12 text-sm text-[#2e3138] font-medium text-right">
                    {Math.round(item.percentage)}%
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>)}
    </div>
  );
}