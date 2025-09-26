import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

interface Scout {
  id: string
  name: string
  country: string
  rating: string
  rank: string
  // Añadir más campos según sea necesario
}

interface UseScoutProfileReturn {
  scout: Scout | null
  loading: boolean
  error: string | null
  isScoutInList: boolean
  listLoading: boolean
  isSaving: boolean
  handleToggleList: () => Promise<void>
  refetch: () => Promise<void>
}

export function useScoutProfile(scoutId: string): UseScoutProfileReturn {
  const [scout, setScout] = useState<Scout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isScoutInList, setIsScoutInList] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Función para obtener los datos del scout
  const fetchScout = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/scouts/${scoutId}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setScout(data.scout)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching scout:', err)
    } finally {
      setLoading(false)
    }
  }

  // Función para verificar si el scout está en la lista
  const checkScoutInList = async () => {
    try {
      setListLoading(true)
      setListError(null)
      
      const response = await fetch(`/api/my-scouts/check/${scoutId}`)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setIsScoutInList(data.isInList)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setListError(errorMessage)
      console.error('Error checking scout in list:', err)
    } finally {
      setListLoading(false)
    }
  }

  // Función para añadir/quitar scout de la lista
  const handleToggleList = async () => {
    if (!scout) return

    try {
      setIsSaving(true)
      
      const endpoint = isScoutInList 
        ? `/api/my-scouts/remove/${scoutId}`
        : `/api/my-scouts/add/${scoutId}`
      
      const response = await fetch(endpoint, {
        method: isScoutInList ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scoutId: scout.id
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Actualizar el estado
      setIsScoutInList(!isScoutInList)
      
      // Mostrar toast de éxito
      toast({
        title: isScoutInList ? "Scout removed from list" : "Scout added to list",
        description: isScoutInList 
          ? `${scout.name} has been removed from your scout list`
          : `${scout.name} has been added to your scout list`,
        variant: "default",
      })

      console.log('✅ Scout list updated:', data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error toggling scout in list:', err)
      
      toast({
        title: "Error",
        description: `Failed to ${isScoutInList ? 'remove' : 'add'} scout: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Efectos
  useEffect(() => {
    if (scoutId) {
      fetchScout()
      checkScoutInList()
    }
  }, [scoutId])

  return {
    scout,
    loading,
    error: error || listError,
    isScoutInList,
    listLoading,
    isSaving,
    handleToggleList,
    refetch: fetchScout,
  }
}