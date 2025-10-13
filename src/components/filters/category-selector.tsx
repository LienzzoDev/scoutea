'use client'

import { Settings, ChevronDown, ChevronRight, X, Check } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

interface Category {
  key: string
  label: string
}

interface CategoryGroup {
  groupName: string
  categories: Category[]
  subgroups?: CategoryGroup[]
}

interface CategorySelectorProps {
  title: string
  categories: Category[] | CategoryGroup[]
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
  storageKey: _storageKey
}: CategorySelectorProps) {
  const [showSelector, setShowSelector] = useState(false)

  // Helper function to check if categories are grouped
  const isGrouped = (cats: Category[] | CategoryGroup[]): cats is CategoryGroup[] => {
    return cats.length > 0 && 'groupName' in cats[0]
  }

  // Estado para controlar qué grupo está expandido (solo uno a la vez)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  // Estado para controlar qué subgrupo está expandido dentro de un grupo
  const [expandedSubgroup, setExpandedSubgroup] = useState<string | null>(null)

  // Helper to flatten categories from groups
  const flattenCategories = (cats: Category[] | CategoryGroup[]): Category[] => {
    if (!isGrouped(cats)) return cats as Category[]

    const flattened: Category[] = []
    const processGroup = (group: CategoryGroup) => {
      flattened.push(...group.categories)
      if (group.subgroups) {
        group.subgroups.forEach(processGroup)
      }
    }

    cats.forEach(processGroup)
    return flattened
  }

  const getSelectedCategoriesData = () => {
    const allCategories = flattenCategories(categories)
    return selectedCategories
      .map(key => allCategories.find(cat => cat.key === key))
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

  const toggleGroup = (groupName: string) => {
    // Si el grupo ya está expandido, colapsarlo. Si no, expandirlo
    setExpandedGroup(prev => prev === groupName ? null : groupName)
    // Reset subgroup cuando cambiamos de grupo
    setExpandedSubgroup(null)
  }

  const toggleSubgroup = (subgroupName: string) => {
    // Si el subgrupo ya está expandido, colapsarlo. Si no, expandirlo
    setExpandedSubgroup(prev => prev === subgroupName ? null : subgroupName)
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

        {isGrouped(categories) ? (
          // Render grouped categories con botones
          <div className="space-y-4">
            {/* Botones de grupos principales */}
            <div className="flex flex-wrap gap-2">
              {categories.map((group) => {
                const isExpanded = expandedGroup === group.groupName

                return (
                  <button
                    key={group.groupName}
                    onClick={() => toggleGroup(group.groupName)}
                    className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                      isExpanded
                        ? 'bg-[#8c1a10] text-white border-[#8c1a10]'
                        : 'bg-white text-[#000000] border-[#e7e7e7] hover:border-[#8c1a10] hover:text-[#8c1a10]'
                    }`}
                  >
                    {group.groupName}
                  </button>
                )
              })}
            </div>

            {/* Categorías del grupo expandido */}
            {expandedGroup && categories.find(g => g.groupName === expandedGroup) && (
              <div className="border border-[#e7e7e7] rounded-lg p-4 bg-[#f8f9fa]">
                {(() => {
                  const group = categories.find(g => g.groupName === expandedGroup)!

                  if (group.subgroups) {
                    // Render subgroups con botones
                    return (
                      <div className="space-y-4">
                        {/* Botones de subgrupos */}
                        <div className="flex flex-wrap gap-2">
                          {group.subgroups.map((subgroup) => {
                            const isSubExpanded = expandedSubgroup === subgroup.groupName

                            return (
                              <button
                                key={subgroup.groupName}
                                onClick={() => toggleSubgroup(subgroup.groupName)}
                                className={`px-3 py-1.5 rounded-md border font-medium text-xs transition-all ${
                                  isSubExpanded
                                    ? 'bg-[#8c1a10] text-white border-[#8c1a10]'
                                    : 'bg-white text-[#6d6d6d] border-[#e7e7e7] hover:border-[#8c1a10] hover:text-[#8c1a10]'
                                }`}
                              >
                                {subgroup.groupName}
                              </button>
                            )
                          })}
                        </div>

                        {/* Categorías del subgrupo expandido */}
                        {expandedSubgroup && group.subgroups.find(sg => sg.groupName === expandedSubgroup) && (
                          <div className="border border-[#d1d5db] rounded-lg p-3 bg-white">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                              {group.subgroups
                                .find(sg => sg.groupName === expandedSubgroup)!
                                .categories.map((category) => {
                                  const isSelected = selectedCategories.includes(category.key)
                                  const canDeselect = isSelected && selectedCategories.length > minCategories
                                  const canSelect = !isSelected && (!maxCategories || selectedCategories.length < maxCategories)

                                  return (
                                    <button
                                      key={category.key}
                                      onClick={() => handleCategoryToggle(category.key)}
                                      disabled={isSelected ? !canDeselect : !canSelect}
                                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-xs ${
                                        isSelected
                                          ? 'bg-[#8c1a10] text-white border-[#8c1a10]'
                                          : 'bg-white text-[#6d6d6d] border-[#e7e7e7] hover:border-[#8c1a10] hover:text-[#8c1a10]'
                                      } ${(isSelected && !canDeselect) || (!isSelected && !canSelect) ? 'opacity-75 cursor-not-allowed' : ''}`}
                                    >
                                      <div className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                        isSelected
                                          ? 'bg-white border-white'
                                          : 'border-current'
                                      }`}>
                                        {isSelected && <Check className="w-2 h-2 text-[#8c1a10]" />}
                                      </div>
                                      <span className="truncate text-left">{category.label}</span>
                                    </button>
                                  )
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  } else {
                    // Render categories directly
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {group.categories.map((category) => {
                          const isSelected = selectedCategories.includes(category.key)
                          const canDeselect = isSelected && selectedCategories.length > minCategories
                          const canSelect = !isSelected && (!maxCategories || selectedCategories.length < maxCategories)

                          return (
                            <button
                              key={category.key}
                              onClick={() => handleCategoryToggle(category.key)}
                              disabled={isSelected ? !canDeselect : !canSelect}
                              className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-xs ${
                                isSelected
                                  ? 'bg-[#8c1a10] text-white border-[#8c1a10]'
                                  : 'bg-white text-[#6d6d6d] border-[#e7e7e7] hover:border-[#8c1a10] hover:text-[#8c1a10]'
                              } ${(isSelected && !canDeselect) || (!isSelected && !canSelect) ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                              <div className={`w-3 h-3 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'bg-white border-white'
                                  : 'border-current'
                              }`}>
                                {isSelected && <Check className="w-2 h-2 text-[#8c1a10]" />}
                              </div>
                              <span className="truncate text-left">{category.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  }
                })()}
              </div>
            )}
          </div>
        ) : (
          // Render flat categories (backward compatibility)
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(categories as Category[]).map((category) => {
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
        )}

        {selectedCategories.length > 5 && (
          <p className="text-xs text-blue-600 mt-4">
            💡 Tip: With many categories selected, they will scroll horizontally in the list.
          </p>
        )}
      </div>
    </div>
  )
}