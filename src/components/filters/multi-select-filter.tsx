'use client'

import { ChevronDown, X, Search } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { Input } from '@/components/ui/input'

interface MultiSelectFilterProps {
  label: string
  options: string[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) =>void
  placeholder?: string
  searchPlaceholder?: string
  maxDisplayTags?: number
}

export default function MultiSelectFilter({
  label: _label,
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  maxDisplayTags = 2
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
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-md"
          >
            {value}
            <span
              onClick={(e) =>removeTag(value, e)}
              className="hover:bg-gray-300 rounded-full p-0.5 transition-colors cursor-pointer">
              <X className="w-3 h-3" />
            </span>
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
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
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors min-h-[44px]">
        <div className="flex-1 text-left">
          {selectedValues.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            getDisplayText()
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          {selectedValues.length > 0 && (
            <span
              onClick={clearAll}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
              title="Limpiar todo"
            >
              <X className="w-4 h-4 text-gray-500" />
            </span>
          )}
          <ChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Header con búsqueda */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-10 border-gray-300" />
            </div>
            
            {selectedValues.length > 0 && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">
                  {selectedValues.length} seleccionado{selectedValues.length !== 1 ? 's' : ''}
                </span>
                <span
                  onClick={clearAll}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
                >
                  Limpiar todo
                </span>
              </div>
            )}
          </div>

          {/* Lista de opciones */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option)
                return (
                  <button
                    key={option}
                    onClick={() => handleOptionToggle(option)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-gray-100 text-gray-800' : 'text-gray-700'
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && (
                      <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
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