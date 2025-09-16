"use client";

import PlayerRadar from "@/components/player/PlayerRadar";

export default function TestRadarPage() {
  // Usar un ID válido de Lionel Messi
  const validPlayerId = "cmfmeeqfb0001zweuke6bhyhp";

  return (
    <div className="min-h-screen bg-[#f8f7f4] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#8c1a10] mb-4">
            🧪 Radar Chart Test Page
          </h1>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Test Information:</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Player ID:</strong> {validPlayerId}</li>
              <li><strong>Player:</strong> Lionel Messi (RW)</li>
              <li><strong>Purpose:</strong> Test radar chart functionality</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <PlayerRadar playerId={validPlayerId} />
        </div>

        <div className="mt-8 bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Available Test Players:</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Lionel Messi (RW):</strong> cmfmeeqfb0001zweuke6bhyhp</p>
              <p><strong>Erling Haaland (ST):</strong> cmfmeeqgg0005zweuz9xrsvg0</p>
              <p><strong>Luka Modric (CM):</strong> cmfmeeqgb0002zweuhotgu0so</p>
              <p><strong>Kevin De Bruyne (AM):</strong> cmfmeeqgg0006zweuwi52syzd</p>
            </div>
            <div>
              <p><strong>Virgil van Dijk (CB):</strong> cmfmeeqgf0004zweu8ncmex9l</p>
              <p><strong>Thibaut Courtois (GK):</strong> cmfmeeqgh0007zweu3607ildx</p>
              <p><strong>Kylian Mbappé (LW):</strong> cmfmeeqge0003zweuhorp7o1t</p>
              <p><strong>Pedri González (CM):</strong> cmfmeeq840000zweu3mconhte</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}