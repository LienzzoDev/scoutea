'use client'

import { X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Player } from "@/types/player"

interface PlayerProfileModalProps {
  _player: Player | null
  isOpen: boolean
  onClose: () => void
}

export default function PlayerProfileModal({ player, isOpen, onClose }: PlayerProfileModalProps) {
  if (!isOpen || !player) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay de fondo */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Menú lateral derecho */}
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-[#080F17] border-l border-slate-700 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header con botón de cerrar */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-[#D6DDE6]">Perfil del Jugador</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del perfil */}
        <div className="px-6 py-4 overflow-y-auto h-full">
          {/* Foto de perfil y nombre */}
          <div className="text-center mb-6">
            <Avatar className="w-20 h-20 mx-auto mb-4">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="text-xl">{player.player_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "J"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-[#D6DDE6] mb-2">{player.player_name}</h2>
            <p className="text-gray-400 mb-4">{player.position_player || 'Sin posición'}</p>
            <Button className="bg-[#FF5733] hover:bg-[#E64A2B] text-white text-sm px-4 py-2">
              Editar perfil
            </Button>
          </div>

          {/* Valor de mercado */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-[#D6DDE6] mb-2">Valor de Mercado</h3>
            <p className="text-[#D6DDE6] text-base">
              {player.player_trfm_value ? 
                `€${(player.player_trfm_value / 1000000).toFixed(1)}M` : 
                (player.player_rating ? `${player.player_rating}/100` : 'No especificado')}
            </p>
          </div>

          {/* Información básica */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-[#D6DDE6] mb-3">Información básica</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-gray-400">Edad</span>
                <span className="text-[#D6DDE6]">
                  {player.age || (player.date_of_birth ? 
                    new Date().getFullYear() - new Date(player.date_of_birth).getFullYear() : 'N/A')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-gray-400">Fecha de nacimiento</span>
                <span className="text-[#D6DDE6]">
                  {player.date_of_birth ? 
                    new Date(player.date_of_birth).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-gray-400">Equipo actual</span>
                <span className="text-[#D6DDE6]">{player.team_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-gray-400">Nacionalidad</span>
                <span className="text-[#D6DDE6]">{player.nationality_1 || 'N/A'}</span>
              </div>
              {player.height && (
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-400">Altura</span>
                  <span className="text-[#D6DDE6]">{player.height}cm</span>
                </div>
              )}
              {player.foot && (
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-400">Pie preferido</span>
                  <span className="text-[#D6DDE6]">{player.foot}</span>
                </div>
              )}
              {player.agency && (
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-400">Agencia</span>
                  <span className="text-[#D6DDE6]">{player.agency}</span>
                </div>
              )}
              {player.contract_end && (
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-400">Fin de contrato</span>
                  <span className="text-[#D6DDE6]">
                    {new Date(player.contract_end).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Información del Scraping */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-[#D6DDE6] mb-3">Información del Scraping</h3>
            <div className="space-y-3">
              {player.url_trfm_advisor && (
                <div className="py-2 border-b border-slate-700">
                  <div className="text-gray-400 text-sm mb-1">URL Transfermarkt</div>
                  <div className="text-[#D6DDE6] text-sm break-all">
                    <a 
                      href={player.url_trfm_advisor} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {player.url_trfm_advisor}
                    </a>
                  </div>
                </div>
              )}
              {player.url_trfm && (
                <div className="py-2 border-b border-slate-700">
                  <div className="text-gray-400 text-sm mb-1">URL Transfermarkt (Principal)</div>
                  <div className="text-[#D6DDE6] text-sm break-all">
                    <a 
                      href={player.url_trfm} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {player.url_trfm}
                    </a>
                  </div>
                </div>
              )}
              {player.url_instagram && (
                <div className="py-2 border-b border-slate-700">
                  <div className="text-gray-400 text-sm mb-1">Instagram</div>
                  <div className="text-[#D6DDE6] text-sm break-all">
                    <a 
                      href={player.url_instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {player.url_instagram}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-[#D6DDE6] mb-3">Información Adicional</h3>
            <div className="space-y-3">
              {player.nationality_2 && (
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-400">Segunda nacionalidad</span>
                  <span className="text-[#D6DDE6]">{player.nationality_2}</span>
                </div>
              )}
              {player.national_tier && (
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-400">Nivel nacional</span>
                  <span className="text-[#D6DDE6]">{player.national_tier}</span>
                </div>
              )}
              {player.team_loan_from && (
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-400">Equipo de préstamo</span>
                  <span className="text-[#D6DDE6]">{player.team_loan_from}</span>
                </div>
              )}
              {player.on_loan !== undefined && (
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-400">En préstamo</span>
                  <span className="text-[#D6DDE6]">{player.on_loan ? 'Sí' : 'No'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
