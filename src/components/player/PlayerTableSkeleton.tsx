export default function PlayerTableSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-[#e7e7e7] overflow-hidden">
      {/* HEADER */}
      <div className="bg-[#f8f9fa] border-b border-[#e7e7e7] flex">
        {/* Columna fija - Player Info */}
        <div className="w-80 p-4 border-r border-[#e7e7e7] flex-shrink-0">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Headers scrolleables */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex" style={{ minWidth: "560px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 text-center border-r border-[#e7e7e7] last:border-r-0 flex-shrink-0"
                style={{ minWidth: "140px", width: "25%" }}
              >
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna fija - Actions */}
        <div className="w-20 p-4 text-center border-l border-[#e7e7e7] flex-shrink-0">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>
      </div>

      {/* FILAS DE JUGADORES SKELETON */}
      <div className="divide-y divide-[#e7e7e7]">
        {[1, 2, 3, 4, 5].map((playerIndex) => (
          <div key={playerIndex} className="flex">
            {/* Columna fija - Player Info */}
            <div className="w-80 p-4 border-r border-[#e7e7e7] flex-shrink-0">
              <div className="flex items-center gap-4">
                {/* Avatar skeleton */}
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Valores scrolleables */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex" style={{ minWidth: "560px" }}>
                {[1, 2, 3, 4].map((catIndex) => (
                  <div
                    key={catIndex}
                    className="p-4 text-center border-r border-[#e7e7e7] last:border-r-0 flex-shrink-0"
                    style={{ minWidth: "140px", width: "25%" }}
                  >
                    <div className="h-5 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna fija - Actions */}
            <div className="w-20 p-4 text-center border-l border-[#e7e7e7] flex-shrink-0">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}