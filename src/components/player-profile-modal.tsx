'use client'

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Jugador } from "@/types/player"

interface PlayerProfileModalProps {
  player: Jugador | null
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
              <AvatarImage src={player.urlAvatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xl">
                {player.nombre
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-[#D6DDE6] mb-2">{player.nombre}</h2>
            <p className="text-gray-400 mb-4">{player.posicion}</p>
            <Button className="bg-[#FF5733] hover:bg-[#E64A2B] text-white text-sm px-4 py-2">
              Editar perfil
            </Button>
          </div>

          {/* Valor de mercado */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-[#D6DDE6] mb-2">Valor de Mercado</h3>
            <p className="text-[#D6DDE6] text-base">{player.valoracion || 'No especificado'}</p>
          </div>

          {/* Información básica */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-[#D6DDE6] mb-3">Información básica</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-gray-400">Edad</span>
                <span className="text-[#D6DDE6]">{player.edad}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-gray-400">Nombre de usuario</span>
                <span className="text-[#D6DDE6]">@{player.nombreUsuario}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <span className="text-gray-400">Equipo actual</span>
                <span className="text-[#D6DDE6]">{player.equipo}</span>
              </div>
              {player.numeroCamiseta && (
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-400">Número de camiseta</span>
                  <span className="text-[#D6DDE6]">{player.numeroCamiseta}</span>
                </div>
              )}
            </div>
          </div>

          {/* Biografía */}
          {player.biografia && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-[#D6DDE6] mb-3">Biografía</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{player.biografia}</p>
            </div>
          )}

          {/* Atributos */}
          {player.atributos && player.atributos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-[#D6DDE6] mb-3">Atributos</h3>
              <div className="space-y-2">
                {player.atributos.map((attr, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-gray-400">{attr.nombre}</span>
                    <span className="text-[#D6DDE6]">{attr.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipos históricos */}
          {player.equipos && player.equipos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-[#D6DDE6] mb-3">Historial de Equipos</h3>
              <div className="space-y-2">
                {player.equipos.map((equipo, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-[#D6DDE6]">{equipo.nombreEquipo}</span>
                    <span className="text-gray-400 text-sm">
                      {equipo.esActual ? 'Actual' : `${equipo.fechaInicio.getFullYear()}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* URLs de Scraping */}
          {player.urlsScraping && player.urlsScraping.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-[#D6DDE6] mb-3">URLs de Scraping</h3>
              <div className="space-y-2">
                {player.urlsScraping.map((url, index) => (
                  <div key={index} className="py-2 border-b border-slate-700">
                    <div className="text-[#D6DDE6] text-sm mb-1">{url.url}</div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>Estado: {url.estado}</span>
                      {url.ultimoScraping && (
                        <span>Último: {url.ultimoScraping.toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
