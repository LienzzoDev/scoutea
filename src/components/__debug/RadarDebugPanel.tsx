"use client";

import { useState } from 'react';

interface RadarDebugPanelProps {
  playerId: string;
  basePlayerData: unknown[];
  radarData: unknown[];
  selectedPosition: string;
}

export default function RadarDebugPanel({ 
  playerId, 
  basePlayerData, 
  radarData, 
  selectedPosition 
}: RadarDebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() =>setIsVisible(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg hover:bg-blue-700">
          🐛 Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">🐛 Radar Debug</h3>
        <button
          onClick={() =>setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <p><strong>Player ID:</strong> {playerId}</p>
          <p><strong>Selected Position:</strong> {selectedPosition || 'None'}</p>
        </div>

        <div>
          <p><strong>Base Data Count:</strong> {basePlayerData.length}</p>
          <p><strong>Radar Data Count:</strong> {radarData.length}</p>
        </div>

        {basePlayerData.length > 0 && (
          <div>
            <p><strong>Sample Base Category:</strong></p>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify({
                category: basePlayerData[0]?.category,
                playerValue: basePlayerData[0]?.playerValue,
                percentile: basePlayerData[0]?.percentile
              }, null, 2)}
            </pre>
          </div>
        )}

        {radarData.length > 0 && (
          <div>
            <p><strong>Sample Radar Category:</strong></p>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify({
                category: radarData[0]?.category,
                playerValue: radarData[0]?.playerValue,
                percentile: radarData[0]?.percentile,
                comparisonAverage: radarData[0]?.comparisonAverage,
                totalPlayers: radarData[0]?.totalPlayers
              }, null, 2)}
            </pre>
          </div>
        )}

        <div>
          <p><strong>Data Integrity Check:</strong></p>
          {basePlayerData.length > 0 && radarData.length > 0 && (
            <div className="space-y-1">
              {basePlayerData.slice(0, 3).map((baseItem, index) => {
                const radarItem = radarData.find(r => r.category === baseItem.category);
                const playerValueChanged = baseItem.playerValue !== radarItem?.playerValue;
                
                return (
                  <div key={index} className={`p-1 rounded ${playerValueChanged ? 'bg-red-100' : 'bg-green-100'}`}>
                    <p><strong>{baseItem.category}:</strong></p>
                    <p>Base: {baseItem.playerValue} | Radar: {radarItem?.playerValue}</p>
                    {playerValueChanged && <p className="text-red-600">⚠️ Player value changed!</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}