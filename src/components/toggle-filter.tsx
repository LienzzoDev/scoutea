'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface ToggleOption {
  value: any
  label: string
  color?: string
}

interface ToggleFilterProps {
  label: string
  options: ToggleOption[]
  selectedValue?: any
  onSelectionChange: (value?: any) => void
  placeholder?: string
}

export default function ToggleFilter({
  label,
  options,
  selectedValue,
  onSelectionChange,
  placeholder = "Select option..."
}: ToggleFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Manejar selección
  const handleSelection = (value: any) => {
    if (selectedValue === value) {
      // Si ya está seleccionado, deseleccionar
      onSelectionChange(undefined)
    } else {
      // Seleccionar nuevo valor
      onSelectionChange(value)
    }
    setIsOpen(false)
  }

  // Limpiar selección
  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange(undefined)
  }

  // Obtener opción seleccionada
  const selectedOption = options.find(option => option.value === selectedValue)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Campo principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors min-h-[44px]"
      >
        <div className="flex-1 text-left">
          {selectedOption ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-md">
              {selectedOption.label}
              <span
                onClick={clearSelection}
                className="hover:bg-gray-300 rounded-full p-0.5 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </span>
            </span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          <ChevronDown 
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {label}
            </div>
            
            <div className="flex gap-2">
              {options.map((option) => (
                <button
                  key={option.value?.toString() || 'undefined'}
                  onClick={() => handleSelection(option.value)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedValue === option.value
                      ? 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {selectedOption && (
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    onSelectionChange(undefined)
                    setIsOpen(false)
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
                >
                  Limpiar selección
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}