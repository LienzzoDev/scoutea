import { useState, useEffect, useCallback, useRef } from 'react'

interface ScoutPreferences {
  selectedCategories: string[]
}

const DEFAULT_PREFERENCES: ScoutPreferences = {
  selectedCategories: ['scout_level', 'scout_elo', 'total_reports']
}

// Helper para cargar desde localStorage
const loadFromLocalStorage = (): string[] | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('scouts-selected-categories')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

export function useScoutPreferences() {
  const [preferences, setPreferences] = useState<ScoutPreferences>(() => {
    // Inicializar con localStorage si está disponible
    const stored = loadFromLocalStorage()
    return stored ? { selectedCategories: stored } : DEFAULT_PREFERENCES
  })
  const [loading, setLoading] = useState(true)
  const initialLoadDone = useRef(false)

  // Cargar preferencias al montar
  useEffect(() => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    const loadPreferences = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/user/scout-preferences')

        // Si no está autenticado (401), usar localStorage sin mostrar error
        if (response.status === 401) {
          const stored = loadFromLocalStorage()
          if (stored) {
            setPreferences({ selectedCategories: stored })
          }
          return
        }

        if (!response.ok) {
          // Otros errores: usar fallback silenciosamente
          const stored = loadFromLocalStorage()
          if (stored) {
            setPreferences({ selectedCategories: stored })
          }
          return
        }

        const data = await response.json()
        if (data.preferences?.selectedCategories) {
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...data.preferences
          })
          // Sincronizar con localStorage
          localStorage.setItem('scouts-selected-categories', JSON.stringify(data.preferences.selectedCategories))
        }
      } catch (err) {
        // Error de red: usar fallback silenciosamente
        console.warn('Could not load scout preferences from server, using local storage')
        const stored = loadFromLocalStorage()
        if (stored) {
          setPreferences({ selectedCategories: stored })
        }
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [])

  // Guardar preferencias en la DB (con debounce)
  const savePreferences = useCallback(async (newPreferences: Partial<ScoutPreferences>) => {
    try {
      const response = await fetch('/api/user/scout-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      })

      if (!response.ok) {
        throw new Error('Failed to save scout preferences')
      }

      // También guardar en localStorage como backup
      if (newPreferences.selectedCategories) {
        localStorage.setItem('scouts-selected-categories', JSON.stringify(newPreferences.selectedCategories))
      }
    } catch (err) {
      console.error('Error saving scout preferences:', err)
      // Guardar en localStorage como fallback
      if (newPreferences.selectedCategories) {
        localStorage.setItem('scouts-selected-categories', JSON.stringify(newPreferences.selectedCategories))
      }
    }
  }, [])

  // Actualizar categorías seleccionadas
  const setSelectedCategories = useCallback((categories: string[]) => {
    setPreferences(prev => ({ ...prev, selectedCategories: categories }))
    savePreferences({ selectedCategories: categories })
  }, [savePreferences])

  // Resetear a valores por defecto
  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES)
    savePreferences({ selectedCategories: DEFAULT_PREFERENCES.selectedCategories })
  }, [savePreferences])

  return {
    preferences,
    loading,
    setSelectedCategories,
    resetToDefaults,
    selectedCategories: preferences.selectedCategories
  }
}
