import { useState, useCallback } from 'react';

export interface Torneo {
  id_torneo: string;
  nombre: string;
  descripcion?: string | null;
  pais?: string | null;
  ciudad?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_torneo: string;
  categoria?: string | null;
  genero: string;
  estado: string;
  max_equipos?: number | null;
  equipos_inscritos: number;
  premio_primero?: number | null;
  premio_segundo?: number | null;
  premio_tercero?: number | null;
  organizador?: string | null;
  contacto_email?: string | null;
  contacto_telefono?: string | null;
  sitio_web?: string | null;
}

export interface TorneoFilters {
  search?: string;
  tipo_torneo?: string;
  categoria?: string;
  genero?: string;
  estado?: string;
  pais?: string;
  es_publico?: boolean;
  es_gratuito?: boolean;
  fecha_inicio_desde?: Date;
  fecha_inicio_hasta?: Date;
}

export interface TorneoResponse {
  torneos: Torneo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const useTournaments = () => {
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const searchTorneos = useCallback(async (filters?: TorneoFilters, pageNum = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      // Build query params
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
      });

      if (filters) {
        if (filters.search) params.append('search', filters.search);
        if (filters.tipo_torneo) params.append('tipo_torneo', filters.tipo_torneo);
        if (filters.categoria) params.append('categoria', filters.categoria);
        if (filters.genero) params.append('genero', filters.genero);
        if (filters.estado) params.append('estado', filters.estado);
        if (filters.pais) params.append('pais', filters.pais);
        if (filters.es_publico !== undefined) params.append('es_publico', filters.es_publico.toString());
        if (filters.es_gratuito !== undefined) params.append('es_gratuito', filters.es_gratuito.toString());
        if (filters.fecha_inicio_desde) params.append('fecha_inicio_desde', filters.fecha_inicio_desde.toISOString());
        if (filters.fecha_inicio_hasta) params.append('fecha_inicio_hasta', filters.fecha_inicio_hasta.toISOString());
      }

      const response = await fetch(`/api/torneos?${params.toString()}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch torneos: ${response.status}`);
      }

      const data: TorneoResponse = await response.json();
      setTorneos(data.torneos || []);
      setTotal(data.pagination.total);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error in searchTorneos:', err);
      setError(err as Error);
      setTorneos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTorneo = useCallback(async (id: string): Promise<Torneo | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/torneos/${id}`);
      if (!response.ok) throw new Error('Failed to fetch torneo');
      return await response.json();
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTorneo = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/torneos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete torneo');
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    torneos,
    loading,
    error,
    total,
    page,
    totalPages,
    searchTorneos,
    getTorneo,
    deleteTorneo,
    clearError,
  };
};