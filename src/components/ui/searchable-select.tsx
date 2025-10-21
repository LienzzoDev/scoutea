"use client"

import { Search, X } from "lucide-react"
import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchableOption {
  value: string
  label: string
  description?: string
  [key: string]: any // Permitir propiedades adicionales
}

interface SearchableSelectProps {
  options: SearchableOption[]
  value?: SearchableOption | null
  onValueChange: (value: SearchableOption | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  renderOption?: (option: SearchableOption) => React.ReactNode
  onSearchChange?: (search: string) => void
  darkMode?: boolean
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found",
  disabled = false,
  className,
  renderOption,
  onSearchChange,
  darkMode = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Notificar al padre cuando cambia el término de búsqueda
  React.useEffect(() => {
    if (onSearchChange) {
      onSearchChange(searchTerm)
    }
  }, [searchTerm, onSearchChange])

  // Filtrar opciones según búsqueda (solo si no hay callback externo)
  const filteredOptions = React.useMemo(() => {
    // Si hay callback externo, no filtrar localmente
    if (onSearchChange) {
      return options
    }

    if (!searchTerm.trim()) return options

    const searchLower = searchTerm.toLowerCase()
    return options.filter(option =>
      option.label.toLowerCase().includes(searchLower) ||
      option.value.toLowerCase().includes(searchLower) ||
      option.description?.toLowerCase().includes(searchLower)
    )
  }, [options, searchTerm, onSearchChange])

  // Cerrar dropdown al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option: SearchableOption) => {
    onValueChange(option)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange(null)
    setSearchTerm('')
  }

  const defaultRenderOption = (option: SearchableOption) => (
    <>
      <div className={darkMode ? "font-medium text-[#D6DDE6]" : "font-medium text-foreground"}>{option.label}</div>
      {option.description && (
        <div className={darkMode ? "text-sm text-gray-400" : "text-sm text-muted-foreground"}>{option.description}</div>
      )}
    </>
  )

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Campo principal */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-lg px-4 cursor-pointer transition-colors",
          darkMode
            ? "border border-slate-600 bg-[#1a2332] text-[#D6DDE6] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
            : "border-0 bg-muted/50 text-foreground focus-within:ring-2 focus-within:ring-ring",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && (darkMode ? "ring-2 ring-blue-500" : "ring-2 ring-ring")
        )}
      >
        <div className="flex-1 min-w-0">
          {value ? (
            <span className="block truncate">{value.label}</span>
          ) : (
            <span className={darkMode ? "text-gray-400" : "text-muted-foreground"}>{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className={cn(
          "absolute z-50 w-full mt-1 rounded-lg shadow-lg max-h-80 overflow-hidden",
          darkMode
            ? "bg-[#131921] border border-slate-600"
            : "bg-popover border border-border"
        )}>
          {/* Campo de búsqueda */}
          <div className={cn("p-3", darkMode ? "border-b border-slate-600" : "border-b border-border")}>
            <div className="relative">
              <Search className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4", darkMode ? "text-gray-400" : "text-muted-foreground")} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  "pl-10 h-10",
                  darkMode && "bg-[#1a2332] border-slate-600 text-[#D6DDE6] placeholder:text-gray-400"
                )}
                autoFocus
              />
            </div>
          </div>

          {/* Lista de opciones */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className={cn("p-4 text-center text-sm", darkMode ? "text-gray-400" : "text-muted-foreground")}>
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors last:border-b-0",
                    darkMode
                      ? "border-b border-slate-700 hover:bg-[#1a2332]"
                      : "border-b border-border hover:bg-muted/50",
                    value?.value === option.value && (darkMode ? "bg-[#1a2332]" : "bg-muted/50")
                  )}
                >
                  {renderOption ? renderOption(option) : defaultRenderOption(option)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
