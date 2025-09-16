"use client";

export default function PlayerBeeswarm() {
  return (
    <div className="bg-white p-6">
      {/* Beeswarm Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-[#8c1a10]">ENJAMBRE</h3>
          <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
        </div>
      </div>

      {/* Filters and Options */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Período
            </label>
            <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
              <option>Period</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Estadísticas
            </label>
            <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
              <option>Stats</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="max-beeswarm"
                className="rounded"
              />
              <label
                htmlFor="max-beeswarm"
                className="text-sm text-[#2e3138]"
              >
                Max
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="min-beeswarm"
                className="rounded"
              />
              <label
                htmlFor="min-beeswarm"
                className="text-sm text-[#2e3138]"
              >
                Min
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="avg-beeswarm"
                className="rounded"
              />
              <label
                htmlFor="avg-beeswarm"
                className="text-sm text-[#2e3138]"
              >
                AVG
              </label>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="norm-beeswarm"
                className="rounded"
              />
              <label
                htmlFor="norm-beeswarm"
                className="text-sm text-[#2e3138]"
              >
                Norm
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="raw-beeswarm"
                className="rounded"
              />
              <label
                htmlFor="raw-beeswarm"
                className="text-sm text-[#2e3138]"
              >
                Raw
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Posición
            </label>
            <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
              <option>Position</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Edad
            </label>
            <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
              <option>Age</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Nacionalidad
            </label>
            <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
              <option>Nationality</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              Competición
            </label>
            <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
              <option>Competition</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2e3138] mb-2">
              TRFM Value
            </label>
            <select className="w-full p-2 border border-[#8c1a10] rounded-md bg-white">
              <option>TRFM Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Beeswarm Chart */}
      <div className="border-2 border-[#8c1a10] rounded-lg p-6">
        <div className="relative w-full h-96 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 800 300">
            {/* Grid lines */}
            {[
              -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0, 5, 10, 15,
              20, 25, 30, 35, 40, 45, 50,
            ].map((value, i) => {
              const x = 50 + (value + 50) * 7;
              return (
                <g key={value}>
                  <line
                    x1={x}
                    y1="20"
                    x2={x}
                    y2="280"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y="295"
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {/* Beeswarm data points */}
            {Array.from({ length: 200 }, (_, i) => {
              // Generate random data points with more density in the center
              const centerBias = Math.random() * 0.7 + 0.15; // Bias towards center
              const x =
                50 + (Math.random() - 0.5) * 600 * centerBias + 100;
              const y = 50 + Math.random() * 200;
              const size = Math.random() * 8 + 3;
              const opacity = Math.random() * 0.6 + 0.4;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={size}
                  fill="#60a5fa"
                  opacity={opacity}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}