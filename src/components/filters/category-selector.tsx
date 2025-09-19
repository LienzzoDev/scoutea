'use client'

import { Settings, ChevronDown, X, Check } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

interface Category {
  _key: string
  label: string
}

interface CategorySelectorProps {
  title: string
  categories: Category[]
  selectedCategories: string[]
  onCategoryToggle: (categoryKey: string) => void
  minCategories?: number
  maxCategories?: number
  storageKey: string
}

export default function CategorySelector({
  title,
  categories,
  selectedCategories,
  onCategoryToggle,
  minCategories = 1,
  maxCategories,
  storageKey
}: CategorySelectorProps) {
  const [showSelector, setShowSelector] = useState(false)

  const getSelectedCategoriesData = () => {
    return selectedCategories
      .map(key => categories.find(cat => cat.key === key))
      .filter(Boolean) as Category[]
  }

  const handleCategoryToggle = (categoryKey: string) => {
    const isSelected = selectedCategories.includes(categoryKey)
    
    if (isSelected && selectedCategories.length <= minCategories) {
      return // No permitir deseleccionar si estamos en el mínimo
    }
    
    if (!isSelected && maxCategories && selectedCategories.length >= maxCategories) {
      return // No permitir seleccionar más si estamos en el máximo
    }
    
    onCategoryToggle(categoryKey)
  }

  if (!showSelector) {
    // Vista colapsada - Solo botón
    return (
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() =>setShowSelector(true)}
          className="flex items-center gap-2 border-[#e7e7e7] text-[#6d6d6d] hover:border-[#8c1a10] hover:text-[#8c1a10]">
          <Settings className="w-4 h-4" />
          <span>Customize Display</span>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
            {selectedCategories.length}
          </span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  // Vista expandida - Todo el contenido
  return (
    <div className="bg-white rounded-lg p-4 border border-[#e7e7e7] mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-[#8c1a10]" />
          <h3 className="font-semibold text-[#000000]">{title}</h3>
          <span className="text-sm text-[#6d6d6d]">
            ({selectedCategories.length} selected)
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>setShowSelector(false)}
          className="border-[#e7e7e7] text-[#6d6d6d]">
          Hide Options
          <ChevronDown className="w-4 h-4 ml-2 transition-transform rotate-180" />
        </Button>
      </div>

      {/* 📋 CATEGORÍAS SELECCIONADAS ACTUALMENTE */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        {getSelectedCategoriesData().map((category) => (
          <div
            key={category.key}
            className="flex items-center gap-2 bg-[#8c1a10] text-white px-3 py-1 rounded-full text-sm whitespace-nowrap"
          >
            <span>{category.label}</span>
            <button
              onClick={() =>handleCategoryToggle(category.key)}
              className="hover:bg-white/20 rounded-full p-0.5 transition-colors" disabled={selectedCategories.length <= minCategories}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* 🎛️ SELECTOR DE CATEGORÍAS DISPONIBLES */}
      <div className="border-t border-[#e7e7e7] pt-4">
        <p className="text-sm text-[#6d6d6d] mb-3">
          Select the categories you want to display:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.key)
            const canDeselect = isSelected && selectedCategories.length > minCategories
            const canSelect = !isSelected && (!maxCategories || selectedCategories.length < maxCategories)
            
            return (
              <button
                key={category.key}
                onClick={() => handleCategoryToggle(category.key)}
                disabled={isSelected ? !canDeselect : !canSelect}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-sm ${
                  isSelected
                    ? 'bg-[#8c1a10] text-white border-[#8c1a10]'
                    : 'bg-white text-[#6d6d6d] border-[#e7e7e7] hover:border-[#8c1a10] hover:text-[#8c1a10]'
                } ${(isSelected && !canDeselect) || (!isSelected && !canSelect) ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  isSelected 
                    ? 'bg-white border-white' 
                    : 'border-current'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-[#8c1a10]" />}
                </div>
                <span className="truncate">{category.label}</span>
              </button>
            )
          })}
        </div>
        
        {selectedCategories.length > 5 && (
          <p className="text-xs text-blue-600 mt-2">
            💡 Tip: With many categories selected, they will scroll horizontally in the list.
          </p>
        )}
      </div>
    </div>
  )
}