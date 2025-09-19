'use client'

import { ChevronDown, X, Search } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { Input } from '@/components/ui/input'

interface AdminMultiSelectFilterProps {
  label: string
  options: string[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) =>void
  placeholder?: string
  searchPlaceholder?: string
  maxDisplayTags?: number
}

export default function AdminMultiSelectFilter({
  label: _label,
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Seleccionar opciones...",
  searchPlaceholder = "Buscar...",
  maxDisplayTags = 2
}: AdminMultiSelectFilterProps) {
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
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded-md"
          >
            {value}
            <span
              onClick={(e) =>removeTag(value, e)}
              className="hover:bg-slate-600 rounded-full p-0.5 transition-colors cursor-pointer">
              <X className="w-3 h-3" />
            </span>
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-md">
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
        onClick={() =>setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-slate-700 rounded-lg bg-[#131921] hover:bg-slate-800 transition-colors min-h-[44px]">
        <div className="flex-1 text-left">
          {selectedValues.length === 0 ? (
            <span className="text-slate-400">{placeholder}</span>
          ) : (
            getDisplayText()
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          {selectedValues.length > 0 && (
            <span
              onClick={clearAll}
              className="p-1 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
              title="Limpiar todo"
            >
              <X className="w-4 h-4 text-slate-400" />
            </span>
          )}
          <ChevronDown 
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#131921] border border-slate-700 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Header con búsqueda */}
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-10 border-slate-700 bg-[#131921] text-white placeholder:text-slate-400" />
            </div>
            
            {selectedValues.length > 0 && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700">
                <span className="text-sm text-slate-400">
                  {selectedValues.length} seleccionado{selectedValues.length !== 1 ? 's' : ''}
                </span>
                <span
                  onClick={clearAll}
                  className="text-sm text-slate-400 hover:text-slate-200 font-medium cursor-pointer"
                >
                  Limpiar todo
                </span>
              </div>
            )}
          </div>

          {/* Lista de opciones */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-sm">
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option)
                return (
                  <button
                    key={option}
                    onClick={() => handleOptionToggle(option)}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-slate-800 text-slate-200' : 'text-slate-300'
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && (
                      <div className="w-4 h-4 bg-[#FF5733] rounded-full flex items-center justify-center">
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