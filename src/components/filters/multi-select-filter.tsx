'use client'

import { ChevronDown, X, Search } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MultiSelectFilterProps {
  label: string
  options: string[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  maxDisplayTags?: number
  theme?: 'light' | 'dark'
}

export default function MultiSelectFilter({
  label: _label,
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  maxDisplayTags = 2,
  theme = 'light'
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filtrar opciones basado en búsqueda
  const filteredOptions = (options || []).filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Manejar selección de opción
  const handleOptionToggle = (option: string) => {
    const newSelection = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option]

    onSelectionChange(newSelection)
  }

  // Remover tag específico
  const removeTag = (option: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange(selectedValues.filter(v => v !== option))
  }

  // Limpiar todas las selecciones
  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange([])
  }

  // Obtener texto para mostrar en el campo
  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder
    }

    const visibleTags = selectedValues.slice(0, maxDisplayTags)
    const remainingCount = selectedValues.length - maxDisplayTags

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {visibleTags.map((value) => (
          <span
            key={value}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md",
              theme === 'dark'
                ? "bg-slate-700 text-slate-200"
                : "bg-gray-200 text-gray-800"
            )}
          >
            {value}
            <span
              onClick={(e) => removeTag(value, e)}
              className={cn(
                "rounded-full p-0.5 transition-colors cursor-pointer",
                theme === 'dark'
                  ? "hover:bg-slate-600"
                  : "hover:bg-gray-300"
              )}
            >
              <X className="w-3 h-3" />
            </span>
          </span>
        ))}
        {remainingCount > 0 && (
          <span className={cn(
            "px-2 py-1 text-xs rounded-md",
            theme === 'dark'
              ? "bg-slate-800 text-slate-400"
              : "bg-gray-100 text-gray-600"
          )}>
            +{remainingCount} más
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Campo principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-3 rounded-lg transition-colors min-h-[44px]",
          theme === 'dark'
            ? "border border-slate-700 bg-[#131921] hover:bg-slate-800"
            : "border border-gray-300 bg-white hover:bg-gray-50"
        )}
      >
        <div className="flex-1 text-left">
          {selectedValues.length === 0 ? (
            <span className={theme === 'dark' ? "text-slate-400" : "text-gray-500"}>
              {placeholder}
            </span>
          ) : (
            getDisplayText()
          )}
        </div>

        <div className="flex items-center gap-2 ml-2">
          {selectedValues.length > 0 && (
            <span
              onClick={clearAll}
              className={cn(
                "p-1 rounded-full transition-colors cursor-pointer",
                theme === 'dark'
                  ? "hover:bg-slate-700"
                  : "hover:bg-gray-200"
              )}
              title="Limpiar todo"
            >
              <X className={cn(
                "w-4 h-4",
                theme === 'dark' ? "text-slate-400" : "text-gray-500"
              )} />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              theme === 'dark' ? "text-slate-400" : "text-gray-500",
              isOpen ? 'rotate-180' : ''
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden",
          theme === 'dark'
            ? "bg-[#131921] border border-slate-700"
            : "bg-white border border-gray-200"
        )}>
          {/* Header con búsqueda */}
          <div className={cn(
            "p-3 border-b",
            theme === 'dark' ? "border-slate-700" : "border-gray-100"
          )}>
            <div className="relative">
              <Search className={cn(
                "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4",
                theme === 'dark' ? "text-slate-400" : "text-gray-400"
              )} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  "pl-10",
                  theme === 'dark'
                    ? "border-slate-700 bg-[#131921] text-white placeholder:text-slate-400"
                    : "border-gray-300"
                )}
              />
            </div>

            {selectedValues.length > 0 && (
              <div className={cn(
                "flex items-center justify-between mt-2 pt-2 border-t",
                theme === 'dark' ? "border-slate-700" : "border-gray-100"
              )}>
                <span className={cn(
                  "text-sm",
                  theme === 'dark' ? "text-slate-400" : "text-gray-600"
                )}>
                  {selectedValues.length} seleccionado{selectedValues.length !== 1 ? 's' : ''}
                </span>
                <span
                  onClick={clearAll}
                  className={cn(
                    "text-sm font-medium cursor-pointer",
                    theme === 'dark'
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-gray-600 hover:text-gray-800"
                  )}
                >
                  Limpiar todo
                </span>
              </div>
            )}
          </div>

          {/* Lista de opciones */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className={cn(
                "p-3 text-center text-sm",
                theme === 'dark' ? "text-slate-400" : "text-gray-500"
              )}>
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option)
                return (
                  <button
                    key={option}
                    onClick={() => handleOptionToggle(option)}
                    className={cn(
                      "w-full text-left px-3 py-2 transition-colors flex items-center justify-between",
                      theme === 'dark'
                        ? isSelected
                          ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                          : 'text-slate-300 hover:bg-slate-800'
                        : isSelected
                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-50'
                          : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <span>{option}</span>
                    {isSelected && (
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center",
                        theme === 'dark' ? "bg-[#FF5733]" : "bg-gray-400"
                      )}>
                        <X className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
