'use client'

import { Settings } from 'lucide-react'

export default function ScoutDashboard() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-[#e7e7e7] p-12">
          <div className="w-16 h-16 bg-[#16a34a] rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          
          <h1 className="text-2xl font-bold text-[#000000] mb-4">
            Área de Scouts
          </h1>
          
          <p className="text-[#6d6d6d] mb-6">
            Estamos trabajando en algo increíble para ti. 
            <br />
            Esta sección estará disponible muy pronto.
          </p>
          
          <div className="text-sm text-[#16a34a] font-medium">
            🚧 En mantenimiento
          </div>
        </div>
      </div>
    </div>
  )
}