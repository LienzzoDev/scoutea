"use client";

export default function PlayerLollipop() {
  return (
    <div className="bg-white p-6">
      {/* Lollipop Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-[#8c1a10]">PALETA</h3>
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
                id="max-lollipop"
                className="rounded"
              />
              <label
                htmlFor="max-lollipop"
                className="text-sm text-[#2e3138]"
              >
                Max
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="min-lollipop"
                className="rounded"
              />
              <label
                htmlFor="min-lollipop"
                className="text-sm text-[#2e3138]"
              >
                Min
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="avg-lollipop"
                className="rounded"
              />
              <label
                htmlFor="avg-lollipop"
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
                id="norm-lollipop"
                className="rounded"
              />
              <label
                htmlFor="norm-lollipop"
                className="text-sm text-[#2e3138]"
              >
                Norm
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="raw-lollipop"
                className="rounded"
              />
              <label
                htmlFor="raw-lollipop"
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

      {/* Lollipop Chart */}
      <div className="border-2 border-[#8c1a10] rounded-lg p-6">
        <div className="relative w-full h-96 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 800 400">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
              const x = 100 + value * 60;
              return (
                <g key={value}>
                  <line
                    x1={x}
                    y1="50"
                    x2={x}
                    y2="350"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                </g>
              );
            })}

            {/* Lollipop data */}
            {[
              { value: 1, y: 80 },
              { value: 1, y: 100 },
              { value: 1, y: 120 },
              { value: 1, y: 140 },
              { value: 2, y: 160 },
              { value: 2, y: 180 },
              { value: 3, y: 200 },
              { value: 3, y: 220 },
              { value: 3, y: 240 },
              { value: 4, y: 260 },
              { value: 4, y: 280 },
              { value: 4, y: 300 },
              { value: 4, y: 320 },
              { value: 6, y: 340 },
              { value: 6, y: 360 },
              { value: 7, y: 380 },
              { value: 9, y: 400 },
            ].map((item, i) => {
              const lineLength = item.value * 60;
              const startX = 100;
              const endX = startX + lineLength;
              return (
                <g key={i}>
                  {/* Line */}
                  <line
                    x1={startX}
                    y1={item.y}
                    x2={endX}
                    y2={item.y}
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  {/* Circle with value */}
                  <circle cx={endX} cy={item.y} r="12" fill="#3b82f6" />
                  <text
                    x={endX}
                    y={item.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs fill-white font-semibold"
                  >
                    {item.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}