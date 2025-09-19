"use client";

import type { Player } from "@/types/player";

interface PlayerFeaturesProps {
  _player: Player;
  activeFeaturesTab: string;
  onFeaturesTabChange: (tab: string) => void;
}

export default function PlayerFeatures({
  player,
  activeFeaturesTab,
  onFeaturesTabChange,
}: PlayerFeaturesProps) {
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
        <button
          className={`pb-3 font-medium ${
            activeFeaturesTab === "performance"
              ? "border-b-2 border-[#8c1a10] text-[#2e3138]"
              : "text-[#6d6d6d]"
          }`}
          onClick={() =>onFeaturesTabChange("performance")}
        >
          Performance
        </button>
        <button
          className={`pb-3 font-medium ${
            activeFeaturesTab === "mode"
              ? "border-b-2 border-[#8c1a10] text-[#2e3138]"
              : "text-[#6d6d6d]"
          }`}
          onClick={() =>onFeaturesTabChange("mode")}
        >
          Mode
        </button>
      </div>{/* Features Content */}
      {activeFeaturesTab === "on-the-pitch" && (
        <div className="space-y-8">
          {/* On the Pitch */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-xl font-bold text-[#8c1a10]">ON THE PITCH</h3>
              <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
            </div>

            {/* Football Pitch with Positions */}
            <div className="relative bg-green-100 rounded-lg p-8">
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

                {/* Position blocks */}
                {/* Goalkeeper */}
                <rect
                  x="70"
                  y="190"
                  width="40"
                  height="20"
                  fill="#dc2626"
                  rx="4"
                />
                <text
                  x="90"
                  y="203"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  GK
                </text>

                {/* Defenders */}
                <rect
                  x="150"
                  y="120"
                  width="40"
                  height="20"
                  fill="#dc2626"
                  rx="4"
                />
                <text
                  x="170"
                  y="133"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  RB
                </text>
                <rect
                  x="200"
                  y="120"
                  width="40"
                  height="20"
                  fill="#dc2626"
                  rx="4"
                />
                <text
                  x="220"
                  y="133"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  CB
                </text>
                <rect
                  x="250"
                  y="120"
                  width="40"
                  height="20"
                  fill="#dc2626"
                  rx="4"
                />
                <text
                  x="270"
                  y="133"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  CB
                </text>
                <rect
                  x="300"
                  y="120"
                  width="40"
                  height="20"
                  fill="#dc2626"
                  rx="4"
                />
                <text
                  x="320"
                  y="133"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  LB
                </text>

                {/* Midfielders */}
                <rect
                  x="150"
                  y="180"
                  width="40"
                  height="20"
                  fill="#dc2626"
                  rx="4"
                />
                <text
                  x="170"
                  y="193"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  RWB
                </text>
                <rect
                  x="200"
                  y="180"
                  width="40"
                  height="20"
                  fill="#dc2626"
                  rx="4"
                />
                <text
                  x="220"
                  y="193"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  DM
                </text>
                <rect
                  x="300"
                  y="180"
                  width="40"
                  height="20"
                  fill="#dc2626"
                  rx="4"
                />
                <text
                  x="320"
                  y="193"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  LWB
                </text>
                <rect
                  x="350"
                  y="180"
                  width="40"
                  height="20"
                  fill="#dc2626"
                  rx="4"
                />
                <text
                  x="370"
                  y="193"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  LM
                </text>
                <rect
                  x="400"
                  y="180"
                  width="40"
                  height="20"
                  fill="#dc2626"
                  rx="4"
                />
                <text
                  x="420"
                  y="193"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  LW
                </text>

                {/* Right Midfielder - Brown */}
                <rect
                  x="150"
                  y="240"
                  width="40"
                  height="20"
                  fill="#a16207"
                  rx="4"
                />
                <text
                  x="170"
                  y="253"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  RM
                </text>

                {/* Attacking Midfielder - Yellow */}
                <rect
                  x="250"
                  y="240"
                  width="40"
                  height="20"
                  fill="#eab308"
                  rx="4"
                />
                <text
                  x="270"
                  y="253"
                  textAnchor="middle"
                  className="text-xs fill-black font-bold"
                >
                  AM
                </text>

                {/* Right Wing - Green */}
                <rect
                  x="350"
                  y="240"
                  width="40"
                  height="20"
                  fill="#22c55e"
                  rx="4"
                />
                <text
                  x="370"
                  y="253"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  RW
                </text>

                {/* Striker - Blue */}
                <rect
                  x="300"
                  y="280"
                  width="40"
                  height="20"
                  fill="#3b82f6"
                  rx="4"
                />
                <text
                  x="320"
                  y="293"
                  textAnchor="middle"
                  className="text-xs fill-white font-bold"
                >
                  ST
                </text>
              </svg>
            </div>
          </div>

          {/* Physical */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-xl font-bold text-[#8c1a10]">PHYSICAL</h3>
              <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              {/* Physical Attributes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#2e3138] font-medium">Sprinter</span>
                  <span className="text-lg font-bold text-green-600">A+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2e3138] font-medium">Marathonian</span>
                  <span className="text-lg font-bold text-yellow-600">C</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2e3138] font-medium">Bomberman</span>
                  <span className="text-lg font-bold text-blue-600">B</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2e3138] font-medium">360°</span>
                  <span className="text-lg font-bold text-blue-600">B</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2e3138] font-medium">The Rock</span>
                  <span className="text-lg font-bold text-red-600">D</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#2e3138] font-medium">Air Flyer</span>
                  <span className="text-lg font-bold text-green-600">A</span>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="flex items-center justify-center">
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

                  {/* Axes */}
                  {Array.from({ length: 10 }, (_, i) => {
                    const angle = i * 36 - 90;
                    const x1 =
                      100 + 80 * Math.cos((angle * Math.PI) / 180);
                    const y1 =
                      100 + 80 * Math.sin((angle * Math.PI) / 180);
                    const x2 =
                      100 + 90 * Math.cos((angle * Math.PI) / 180);
                    const y2 =
                      100 + 90 * Math.sin((angle * Math.PI) / 180);
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
                          Group {i + 1}
                        </text>
                      </g>);
                  })}

                  {/* Data segments */}
                  {[
                    { angle: 0, length: 60, color: "#dc2626" },
                    { angle: 36, length: 40, color: "#ea580c" },
                    { angle: 72, length: 80, color: "#22c55e" },
                    { angle: 108, length: 30, color: "#3b82f6" },
                    { angle: 144, length: 70, color: "#8b5cf6" },
                    { angle: 180, length: 50, color: "#dc2626" },
                    { angle: 216, length: 45, color: "#ea580c" },
                    { angle: 252, length: 65, color: "#22c55e"},
                    { angle: 288, length: 35, color: "#3b82f6"},
                    { angle: 324, length: 55, color: "#8b5cf6"},
                  ].map((segment, i) => {
                    const x =
                      100 +
                      segment.length *
                        Math.cos(((segment.angle - 90) * Math.PI) / 180);
                    const y =
                      100 +
                      segment.length *
                        Math.sin(((segment.angle - 90) * Math.PI) / 180);
                    return (
                      <polygon
                        key={i}
                        points={`100,100 ${x},${y} ${
                          x +
                          5 * Math.cos(((segment.angle - 90) * Math.PI) / 180)
                        },${
                          y +
                          5 * Math.sin(((segment.angle - 90) * Math.PI) / 180)
                        }`}
                        fill={segment.color}
                        opacity="0.7"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-6 flex gap-4">
              <select className="p-2 border border-gray-300 rounded-md bg-white">
                <option>Position</option>
              </select>
              <select className="p-2 border border-gray-300 rounded-md bg-white">
                <option>Age</option>
              </select>
              <select className="p-2 border border-gray-300 rounded-md bg-white">
                <option>Nationality</option>
              </select>
              <select className="p-2 border border-gray-300 rounded-md bg-white">
                <option>Competition</option>
              </select>
              <select className="p-2 border border-gray-300 rounded-md bg-white">
                <option>TRFM Value</option>
              </select>
            </div>
          </div>

          {/* Foot */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-xl font-bold text-[#8c1a10]">FOOT</h3>
              <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              {/* Left Foot */}
              <div className="text-center">
                <h4 className="text-lg font-semibold text-[#2e3138] mb-4">
                  LEFT
                </h4>
                <div className="relative">
                  <svg className="w-48 h-32" viewBox="0 0 200 120">
                    {/* Triangular bar chart for left foot */}
                    <polygon
                      points="20,100 20,40 120,40 120,100"
                      fill="#22c55e"
                      opacity="0.8"
                    />
                    <text
                      x="70"
                      y="75"
                      textAnchor="middle"
                      className="text-2xl font-bold fill-white"
                    >
                      A
                    </text>
                    <text
                      x="70"
                      y="110"
                      textAnchor="middle"
                      className="text-sm fill-[#2e3138]"
                    >
                      73%
                    </text>
                  </svg>
                  <div className="mt-2">
                    <p className="text-sm text-[#6d6d6d]">Dominance</p>
                    <p className="text-sm text-[#6d6d6d]">Tendency</p>
                  </div>
                </div>
              </div>

              {/* Right Foot */}
              <div className="text-center">
                <h4 className="text-lg font-semibold text-[#2e3138] mb-4">
                  RIGHT
                </h4>
                <div className="relative">
                  <svg className="w-48 h-32" viewBox="0 0 200 120">
                    {/* Triangular bar chart for right foot */}
                    <polygon
                      points="20,100 20,80 60,80 60,100"
                      fill="#eab308"
                      opacity="0.8"
                    />
                    <text
                      x="40"
                      y="95"
                      textAnchor="middle"
                      className="text-lg font-bold fill-white"
                    >
                      B
                    </text>
                    <text
                      x="40"
                      y="110"
                      textAnchor="middle"
                      className="text-sm fill-[#2e3138]"
                    >
                      27%
                    </text>
                  </svg>
                  <div className="mt-2">
                    <p className="text-sm text-[#6d6d6d]">Dominance</p>
                    <p className="text-sm text-[#6d6d6d]">Tendency</p>
                  </div>
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
              <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
            </div>
            <p className="text-[#6d6d6d]">Player role content coming soon...</p>
          </div>
        </div>)}

      {activeFeaturesTab === "performance" && (
        <div className="space-y-8">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-xl font-bold text-[#8c1a10]">PERFORMANCE</h3>
              <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
            </div>
            <p className="text-[#6d6d6d]">Performance content coming soon...</p>
          </div>
        </div>)}

      {activeFeaturesTab === "mode" && (
        <div className="space-y-8">
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-xl font-bold text-[#8c1a10]">MODE</h3>
              <div className="w-5 h-5 text-[#8c1a10] text-xl">▼</div>
            </div>
            <p className="text-[#6d6d6d]">Mode content coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
}