import { useState, useEffect, useCallback, useRef } from 'react'

interface DashboardPreferences {
  selectedCategories: string[]
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  selectedCategories: ['position', 'age', 'team']
}

// Helper para cargar desde localStorage
const loadFromLocalStorage = (): string[] | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('dashboard-selected-categories')
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

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<DashboardPreferences>(() => {
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
        const response = await fetch('/api/user/preferences')

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
          localStorage.setItem('dashboard-selected-categories', JSON.stringify(data.preferences.selectedCategories))
        }
      } catch (err) {
        // Error de red: usar fallback silenciosamente
        console.warn('Could not load preferences from server, using local storage')
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
  const savePreferences = useCallback(async (newPreferences: Partial<DashboardPreferences>) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences)
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      // También guardar en localStorage como backup
      if (newPreferences.selectedCategories) {
        localStorage.setItem('dashboard-selected-categories', JSON.stringify(newPreferences.selectedCategories))
      }
    } catch (err) {
      console.error('Error saving preferences:', err)
      // Guardar en localStorage como fallback
      if (newPreferences.selectedCategories) {
        localStorage.setItem('dashboard-selected-categories', JSON.stringify(newPreferences.selectedCategories))
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
