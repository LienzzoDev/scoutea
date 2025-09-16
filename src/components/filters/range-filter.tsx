'use client'

import { ChevronDown, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { Input } from '@/components/ui/input'

interface RangeFilterProps {
  label: string
  minValue?: number
  maxValue?: number
  onRangeChange: (min?: number, max?: number) => void
  placeholder?: string
  step?: string
  suffix?: string
}

export default function RangeFilter({
  label,
  minValue,
  maxValue,
  onRangeChange,
  placeholder = "Select range...",
  step = "1",
  suffix = ""
}: RangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localMin, setLocalMin] = useState(minValue?.toString() || '')
  const [localMax, setLocalMax] = useState(maxValue?.toString() || '')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sincronizar valores locales con props
  useEffect(() => {
    setLocalMin(minValue?.toString() || '')
    setLocalMax(maxValue?.toString() || '')
  }, [minValue, maxValue])

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

  // Aplicar cambios
  const applyRange = () => {
    const min = localMin ? parseFloat(localMin) : undefined
    const max = localMax ? parseFloat(localMax) : undefined
    onRangeChange(min, max)
    setIsOpen(false)
  }

  // Limpiar filtro
  const clearRange = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalMin('')
    setLocalMax('')
    onRangeChange(undefined, undefined)
  }

  // Obtener texto para mostrar
  const getDisplayText = () => {
    if (!minValue && !maxValue) {
      return placeholder
    }

    if (minValue && maxValue) {
      return `${minValue}${suffix} - ${maxValue}${suffix}`
    } else if (minValue) {
      return `≥ ${minValue}${suffix}`
    } else if (maxValue) {
      return `≤ ${maxValue}${suffix}`
    }

    return placeholder
  }

  const hasValue = minValue !== undefined || maxValue !== undefined

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Campo principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors min-h-[44px]"
      >
        <div className="flex-1 text-left">
          {hasValue ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-md">
              {getDisplayText()}
              <span
                onClick={clearRange}
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
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Rango de {label}
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step={step}
                  placeholder="Mín"
                  value={localMin}
                  onChange={(e) => setLocalMin(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  step={step}
                  placeholder="Máx"
                  value={localMax}
                  onChange={(e) => setLocalMax(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={applyRange}
                className="flex-1 px-3 py-2 bg-[#8c1a10] text-white rounded-md hover:bg-[#7a1610] transition-colors text-sm"
              >
                Aplicar
              </button>
              <button
                onClick={() => {
                  setLocalMin('')
                  setLocalMax('')
                  onRangeChange(undefined, undefined)
                  setIsOpen(false)
                }}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}