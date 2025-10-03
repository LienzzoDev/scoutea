import { useState, useEffect, useCallback, useMemo } from 'react';
import { handleApiResponse } from '@/lib/utils/api-response';

interface ScoutListItem {
  id: string;
  userId: string;
  scoutId: string;
  createdAt: string;
  updatedAt: string;
  scout: {
    id_scout: string;
    scout_name: string | null;
    name: string | null;
    surname: string | null;
    nationality: string | null;
    scout_level: string | null;
    scout_elo: number | null;
    total_reports: number | null;
    url_profile: string | null;
  };
}

export const useScoutList = () => {
  const [scoutList, setScoutList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar la lista de scouts del usuario
  const loadScoutList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 useScoutList: Loading user scout list...');
      
      const response = await fetch('/api/scout-list');
      
      // Si no está autenticado o no existe el usuario, no es un error crítico
      if (response.status === 401 || response.status === 404) {
        console.log('ℹ️  useScoutList: User not authenticated or not found - using empty list');
        setScoutList([]);
        setError(null); // No mostrar error
        return;
      }
      
      const result = await handleApiResponse(response);
      
      if (result.success) {
        const scoutIds = result.data?.scoutList?.map((item: ScoutListItem) => item.scoutId) || [];
        console.log('✅ useScoutList: Loaded scout list:', scoutIds.length);
        setScoutList(scoutIds);
      } else {
        console.error('❌ useScoutList: Failed to load scout list:', result.error);
        // Solo mostrar error si no es problema de autenticación
        if (!result.error?.includes('Usuario no encontrado') && !result.error?.includes('No autorizado')) {
          setError(result.error || 'Error al cargar la lista');
        }
        setScoutList([]);
      }
    } catch (err) {
      console.log('ℹ️  useScoutList: Could not load scout list (user may not be authenticated)');
      setError(null); // No mostrar error de conexión como crítico
      setScoutList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Añadir scout a la lista
  const addToList = useCallback(async (scoutId: string): Promise<boolean> => {
    try {
      console.log('🚀 useScoutList: Adding scout to list:', scoutId);
      setError(null);
      
      const response = await fetch('/api/scout-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scoutId }),
      });

      const result = await handleApiResponse(response);
      
      if (result.success) {
        setScoutList(prev => [...prev, scoutId]);
        console.log('✅ useScoutList: Scout added to list successfully');
        return true;
      } else {
        console.error('❌ useScoutList: Failed to add scout to list:', result.error);
        setError(result.error || 'Error al añadir scout');
        return false;
      }
    } catch (err) {
      console.error('❌ useScoutList: Error adding scout to list:', err);
      setError('Error de conexión');
      return false;
    }
  }, []);

  // Remover scout de la lista
  const removeFromList = useCallback(async (scoutId: string): Promise<boolean> => {
    try {
      console.log('🚀 useScoutList: Removing scout from list:', scoutId);
      setError(null);
      
      const response = await fetch(`/api/scout-list/${scoutId}`, {
        method: 'DELETE',
      });

      const result = await handleApiResponse(response);
      
      if (result.success) {
        setScoutList(prev => prev.filter(id => id !== scoutId));
        console.log('✅ useScoutList: Scout removed from list successfully');
        return true;
      } else {
        console.error('❌ useScoutList: Failed to remove scout from list:', result.error);
        setError(result.error || 'Error al remover scout');
        return false;
      }
    } catch (err) {
      console.error('❌ useScoutList: Error removing scout from list:', err);
      setError('Error de conexión');
      return false;
    }
  }, []);

  // Crear un Set para búsquedas más eficientes
  const scoutListSet = useMemo(() => new Set(scoutList), [scoutList]);

  // Verificar si un scout está en la lista (optimizado)
  const isInList = useCallback((scoutId: string): boolean => {
    return scoutListSet.has(scoutId);
  }, [scoutListSet]);

  // Cargar la lista al montar el hook
  useEffect(() => {
    loadScoutList();
  }, [loadScoutList]);

  return {
    scoutList,
    loading,
    error,
    addToList,
    removeFromList,
    isInList,
    loadScoutList,
  };
};