"use client"

import { Search, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Team {
  id: string
  name: string
  short_name: string | null
  country: {
    name: string
    code: string
  } | null
  competition: {
    name: string
    short_name: string | null
  } | null
}

interface TeamSearchProps {
  value: string
  onChange: (teamName: string, teamCountry?: string) => void
  placeholder?: string
  className?: string
}

export function TeamSearch({ value, onChange, placeholder = "Search team...", className }: TeamSearchProps) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Buscar equipos cuando cambia el término de búsqueda
  useEffect(() => {
    const searchTeams = async () => {
      if (searchTerm.length < 1) {
        setTeams([])
        setIsOpen(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/teams/search?q=${encodeURIComponent(searchTerm)}&limit=20`)
        if (response.ok) {
          const data = await response.json()
          setTeams(data.teams || [])
          setIsOpen(true)
        }
      } catch (error) {
        console.error('Error searching teams:', error)
        setTeams([])
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchTeams, 150)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleSelect = (team: Team) => {
    setSearchTerm(team.name)
    onChange(team.name, team.country?.name)
    setIsOpen(false)
  }

  const handleClear = () => {
    setSearchTerm('')
    onChange('', '')
    setTeams([])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 1 && teams.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={className}
          style={{ paddingLeft: '2.75rem', paddingRight: searchTerm ? '2.75rem' : '1rem' }}
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 z-10"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && teams.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          ) : (
            <div className="py-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => handleSelect(team)}
                  className="w-full px-4 py-2.5 text-left hover:bg-accent transition-colors flex flex-col"
                >
                  <div className="font-medium text-foreground">{team.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    {team.country && (
                      <span>{team.country.name}</span>
                    )}
                    {team.competition && (
                      <>
                        <span>•</span>
                        <span>{team.competition.short_name || team.competition.name}</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && teams.length === 0 && searchTerm.length >= 1 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg p-4">
          <p className="text-sm text-muted-foreground text-center">
            No teams found for "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  )
}
