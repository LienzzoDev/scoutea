"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SearchableOption {
  value: string
  label: string
  description?: string
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
  renderOption
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Filtrar opciones según búsqueda
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) return options

    const searchLower = searchTerm.toLowerCase()
    return options.filter(option =>
      option.label.toLowerCase().includes(searchLower) ||
      option.value.toLowerCase().includes(searchLower) ||
      option.description?.toLowerCase().includes(searchLower)
    )
  }, [options, searchTerm])

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
      <div className="font-medium text-foreground">{option.label}</div>
      {option.description && (
        <div className="text-sm text-muted-foreground">{option.description}</div>
      )}
    </>
  )

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Campo principal */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-lg border-0 bg-muted/50 px-4 text-foreground cursor-pointer transition-colors",
          "focus-within:ring-2 focus-within:ring-ring",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "ring-2 ring-ring"
        )}
      >
        <div className="flex-1 min-w-0">
          {value ? (
            <span className="block truncate">{value.label}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
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
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Campo de búsqueda */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-10 h-10"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de opciones */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors border-b border-border last:border-b-0",
                    "hover:bg-muted/50",
                    value?.value === option.value && "bg-muted/50"
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
