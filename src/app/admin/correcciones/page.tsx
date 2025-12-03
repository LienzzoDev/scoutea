'use client'

import { Plus, Search, Trash2, Edit, Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'

interface NationalityCorrection {
  id: string
  original_name: string
  corrected_name: string
}

interface LeagueCorrection {
  id: string
  national_tier: string
  rename_national_tier: string
  country: string
}

interface CompetitionCorrection {
  id: string
  original_name: string
  corrected_name: string
  country?: string | null
}

type TabType = 'nationalities' | 'leagues' | 'competitions'

export default function CorreccionesPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()

  const [activeTab, setActiveTab] = useState<TabType>('nationalities')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado para correcciones de nacionalidades
  const [nationalityCorrections, setNationalityCorrections] = useState<NationalityCorrection[]>([])
  const [nationalitySearch, setNationalitySearch] = useState('')
  const [editingNationality, setEditingNationality] = useState<string | null>(null)
  const [editNationalityData, setEditNationalityData] = useState<Partial<NationalityCorrection>>({})

  // Estado para correcciones de ligas
  const [leagueCorrections, setLeagueCorrections] = useState<LeagueCorrection[]>([])
  const [leagueSearch, setLeagueSearch] = useState('')
  const [editingLeague, setEditingLeague] = useState<string | null>(null)
  const [editLeagueData, setEditLeagueData] = useState<Partial<LeagueCorrection>>({})

  // Estado para correcciones de competiciones
  const [competitionCorrections, setCompetitionCorrections] = useState<CompetitionCorrection[]>([])
  const [competitionSearch, setCompetitionSearch] = useState('')
  const [editingCompetition, setEditingCompetition] = useState<string | null>(null)
  const [editCompetitionData, setEditCompetitionData] = useState<Partial<CompetitionCorrection>>({})

  // Estado para nuevo registro
  const [showNewForm, setShowNewForm] = useState(false)
  const [newNationalityData, setNewNationalityData] = useState({ original_name: '', corrected_name: '' })
  const [newLeagueData, setNewLeagueData] = useState({ national_tier: '', rename_national_tier: '', country: '' })
  const [newCompetitionData, setNewCompetitionData] = useState({ original_name: '', corrected_name: '', country: '' })

  // Cargar correcciones de nacionalidades
  const loadNationalityCorrections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/corrections/nationalities?search=${nationalitySearch}`)
      if (!response.ok) throw new Error('Error al cargar correcciones de nacionalidades')
      const data = await response.json()
      setNationalityCorrections(data.corrections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Cargar correcciones de ligas
  const loadLeagueCorrections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/corrections/leagues?search=${leagueSearch}`)
      if (!response.ok) throw new Error('Error al cargar correcciones de ligas')
      const data = await response.json()
      setLeagueCorrections(data.corrections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Cargar correcciones de competiciones
  const loadCompetitionCorrections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/corrections/competitions?search=${competitionSearch}`)
      if (!response.ok) throw new Error('Error al cargar correcciones de competiciones')
      const data = await response.json()
      setCompetitionCorrections(data.corrections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      if (activeTab === 'nationalities') {
        loadNationalityCorrections()
      } else if (activeTab === 'leagues') {
        loadLeagueCorrections()
      } else {
        loadCompetitionCorrections()
      }
    }
  }, [isLoaded, isSignedIn, activeTab, nationalitySearch, leagueSearch, competitionSearch])

  // Crear nueva corrección de nacionalidad
  const handleCreateNationality = async () => {
    try {
      const response = await fetch('/api/admin/corrections/nationalities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNationalityData)
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.__error || 'Error al crear')
      }
      setNewNationalityData({ original_name: '', corrected_name: '' })
      setShowNewForm(false)
      loadNationalityCorrections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear')
    }
  }

  // Crear nueva corrección de liga
  const handleCreateLeague = async () => {
    try {
      const response = await fetch('/api/admin/corrections/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeagueData)
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.__error || 'Error al crear')
      }
      setNewLeagueData({ national_tier: '', rename_national_tier: '', country: '' })
      setShowNewForm(false)
      loadLeagueCorrections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear')
    }
  }

  // Crear nueva corrección de competición
  const handleCreateCompetition = async () => {
    try {
      const response = await fetch('/api/admin/corrections/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompetitionData)
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.__error || 'Error al crear')
      }
      setNewCompetitionData({ original_name: '', corrected_name: '', country: '' })
      setShowNewForm(false)
      loadCompetitionCorrections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear')
    }
  }

  // Actualizar corrección de nacionalidad
  const handleUpdateNationality = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/corrections/nationalities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editNationalityData)
      })
      if (!response.ok) throw new Error('Error al actualizar')
      setEditingNationality(null)
      loadNationalityCorrections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar')
    }
  }

  // Actualizar corrección de liga
  const handleUpdateLeague = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/corrections/leagues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editLeagueData)
      })
      if (!response.ok) throw new Error('Error al actualizar')
      setEditingLeague(null)
      loadLeagueCorrections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar')
    }
  }

  // Actualizar corrección de competición
  const handleUpdateCompetition = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/corrections/competitions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editCompetitionData)
      })
      if (!response.ok) throw new Error('Error al actualizar')
      setEditingCompetition(null)
      loadCompetitionCorrections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar')
    }
  }

  // Eliminar corrección de nacionalidad
  const handleDeleteNationality = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta corrección?')) return
    try {
      const response = await fetch(`/api/admin/corrections/nationalities/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Error al eliminar')
      loadNationalityCorrections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  // Eliminar corrección de liga
  const handleDeleteLeague = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta corrección?')) return
    try {
      const response = await fetch(`/api/admin/corrections/leagues/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Error al eliminar')
      loadLeagueCorrections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  // Eliminar corrección de competición
  const handleDeleteCompetition = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta corrección?')) return
    try {
      const response = await fetch(`/api/admin/corrections/competitions/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Error al eliminar')
      loadCompetitionCorrections()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  // Aplicar todas las correcciones a jugadores existentes
  const handleApplyAllCorrections = async () => {
    if (!confirm('¿Estás seguro de aplicar todas las correcciones a los jugadores existentes? Este proceso puede tardar varios minutos.')) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/corrections/apply-all', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.__error || 'Error al aplicar correcciones')
      }
      
      alert(`✅ Correcciones aplicadas exitosamente!\n\nJugadores procesados: ${data.stats.totalPlayers}\nJugadores actualizados: ${data.stats.updatedPlayers}\nErrores: ${data.stats.errors}`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMsg)
      alert(`❌ Error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) return <LoadingPage />
  if (!isSignedIn) return null

  const getCurrentSearch = () => {
    if (activeTab === 'nationalities') return nationalitySearch
    if (activeTab === 'leagues') return leagueSearch
    return competitionSearch
  }

  const setCurrentSearch = (value: string) => {
    if (activeTab === 'nationalities') setNationalitySearch(value)
    else if (activeTab === 'leagues') setLeagueSearch(value)
    else setCompetitionSearch(value)
  }

  return (
    <main className='px-6 py-8 max-w-full mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-[#D6DDE6]'>Reglas de Corrección</h1>
          <p className='text-sm text-slate-400 mt-1'>
            Define reglas para normalizar nombres de nacionalidades, ligas y competiciones
          </p>
        </div>
        <div className='flex gap-3'>
          <Button
            className='bg-green-600 hover:bg-green-700 text-white'
            onClick={handleApplyAllCorrections}
            disabled={loading}
          >
            {loading ? 'Aplicando...' : 'Aplicar a Todos'}
          </Button>
          <Button
            className='bg-[#FF5733] hover:bg-[#E64A2B] text-white'
            onClick={() => setShowNewForm(true)}
          >
            <Plus className='h-4 w-4 mr-2' />
            Nueva Regla
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className='mb-6 border-b border-slate-700'>
        <div className='flex space-x-8'>
          <button
            onClick={() => setActiveTab('nationalities')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'nationalities'
                ? 'border-[#FF5733] text-[#FF5733]'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Nacionalidad
          </button>
          <button
            onClick={() => setActiveTab('leagues')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'leagues'
                ? 'border-[#FF5733] text-[#FF5733]'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Ligas
          </button>
          <button
            onClick={() => setActiveTab('competitions')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'competitions'
                ? 'border-[#FF5733] text-[#FF5733]'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Competiciones
          </button>
        </div>
      </div>

      {/* Search */}
      <div className='mb-6 relative max-w-md'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
        <Input
          placeholder='Buscar...'
          value={getCurrentSearch()}
          onChange={e => setCurrentSearch(e.target.value)}
          className='pl-10 bg-[#131921] border-slate-700 text-white placeholder:text-slate-400'
        />
      </div>

      {error && (
        <div className='mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg'>
          <p className='text-red-400'>Error: {error}</p>
        </div>
      )}

      {/* Dialog para nueva regla */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className='bg-[#1a2332] border-slate-700 text-white'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold text-white'>
              Nueva Regla de {activeTab === 'nationalities' ? 'Nacionalidad' : activeTab === 'leagues' ? 'Liga' : 'Competición'}
            </DialogTitle>
            <DialogDescription className='text-slate-400'>
              Crea una nueva regla de corrección para normalizar nombres
            </DialogDescription>
          </DialogHeader>
          {activeTab === 'nationalities' ? (
            <div className='space-y-4 mt-4'>
              <div>
                <label className='text-sm text-slate-300 mb-2 block'>Nombre Original</label>
                <Input
                  placeholder='Ej: España'
                  value={newNationalityData.original_name}
                  onChange={e => setNewNationalityData({ ...newNationalityData, original_name: e.target.value })}
                  className='bg-[#131921] border-slate-700 text-white'
                />
              </div>
              <div>
                <label className='text-sm text-slate-300 mb-2 block'>Nombre Corregido</label>
                <Input
                  placeholder='Ej: Spain'
                  value={newNationalityData.corrected_name}
                  onChange={e => setNewNationalityData({ ...newNationalityData, corrected_name: e.target.value })}
                  className='bg-[#131921] border-slate-700 text-white'
                />
              </div>
              <div className='flex gap-2 pt-4'>
                <Button onClick={handleCreateNationality} className='bg-[#FF5733] hover:bg-[#E64A2B] flex-1'>
                  <Check className='h-4 w-4 mr-2' />
                  Crear Regla
                </Button>
                <Button onClick={() => setShowNewForm(false)} variant='outline' className='border-slate-700'>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : activeTab === 'leagues' ? (
            <div className='space-y-4 mt-4'>
              <div>
                <label className='text-sm text-slate-300 mb-2 block'>National Tier</label>
                <Input
                  placeholder='Ej: LaLiga'
                  value={newLeagueData.national_tier}
                  onChange={e => setNewLeagueData({ ...newLeagueData, national_tier: e.target.value })}
                  className='bg-[#131921] border-slate-700 text-white'
                />
              </div>
              <div>
                <label className='text-sm text-slate-300 mb-2 block'>Rename National Tier</label>
                <Input
                  placeholder='Ej: La Liga'
                  value={newLeagueData.rename_national_tier}
                  onChange={e => setNewLeagueData({ ...newLeagueData, rename_national_tier: e.target.value })}
                  className='bg-[#131921] border-slate-700 text-white'
                />
              </div>
              <div>
                <label className='text-sm text-slate-300 mb-2 block'>Country</label>
                <Input
                  placeholder='Ej: Spain'
                  value={newLeagueData.country}
                  onChange={e => setNewLeagueData({ ...newLeagueData, country: e.target.value })}
                  className='bg-[#131921] border-slate-700 text-white'
                />
              </div>
              <div className='flex gap-2 pt-4'>
                <Button onClick={handleCreateLeague} className='bg-[#FF5733] hover:bg-[#E64A2B] flex-1'>
                  <Check className='h-4 w-4 mr-2' />
                  Crear Regla
                </Button>
                <Button onClick={() => setShowNewForm(false)} variant='outline' className='border-slate-700'>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className='space-y-4 mt-4'>
              <div>
                <label className='text-sm text-slate-300 mb-2 block'>Nombre Original</label>
                <Input
                  placeholder='Ej: UEFA Champions League'
                  value={newCompetitionData.original_name}
                  onChange={e => setNewCompetitionData({ ...newCompetitionData, original_name: e.target.value })}
                  className='bg-[#131921] border-slate-700 text-white'
                />
              </div>
              <div>
                <label className='text-sm text-slate-300 mb-2 block'>Nombre Corregido</label>
                <Input
                  placeholder='Ej: Champions League'
                  value={newCompetitionData.corrected_name}
                  onChange={e => setNewCompetitionData({ ...newCompetitionData, corrected_name: e.target.value })}
                  className='bg-[#131921] border-slate-700 text-white'
                />
              </div>
              <div>
                <label className='text-sm text-slate-300 mb-2 block'>País (opcional)</label>
                <Input
                  placeholder='Ej: Europe'
                  value={newCompetitionData.country}
                  onChange={e => setNewCompetitionData({ ...newCompetitionData, country: e.target.value })}
                  className='bg-[#131921] border-slate-700 text-white'
                />
              </div>
              <div className='flex gap-2 pt-4'>
                <Button onClick={handleCreateCompetition} className='bg-[#FF5733] hover:bg-[#E64A2B] flex-1'>
                  <Check className='h-4 w-4 mr-2' />
                  Crear Regla
                </Button>
                <Button onClick={() => setShowNewForm(false)} variant='outline' className='border-slate-700'>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tabla de correcciones */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='flex items-center gap-2 text-slate-400'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5733]'></div>
            <span>Cargando...</span>
          </div>
        </div>
      ) : activeTab === 'nationalities' ? (
        <div className='rounded-lg border border-slate-700 bg-[#131921] overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-[#1a2332] border-b border-slate-700'>
              <tr>
                <th className='p-4 text-left text-sm font-semibold text-slate-300'>Nombre Original</th>
                <th className='p-4 text-left text-sm font-semibold text-slate-300'>Nombre Corregido</th>
                <th className='p-4 text-center text-sm font-semibold text-slate-300 w-32'>Acciones</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-700'>
              {nationalityCorrections.map(correction => (
                <tr key={correction.id} className='hover:bg-slate-700/30'>
                  <td className='p-4'>
                    {editingNationality === correction.id ? (
                      <Input
                        value={editNationalityData.original_name || correction.original_name}
                        onChange={e => setEditNationalityData({ ...editNationalityData, original_name: e.target.value })}
                        className='bg-[#0a0f16] border-slate-600 text-white text-sm'
                      />
                    ) : (
                      <span className='text-sm text-white'>{correction.original_name}</span>
                    )}
                  </td>
                  <td className='p-4'>
                    {editingNationality === correction.id ? (
                      <Input
                        value={editNationalityData.corrected_name || correction.corrected_name}
                        onChange={e => setEditNationalityData({ ...editNationalityData, corrected_name: e.target.value })}
                        className='bg-[#0a0f16] border-slate-600 text-white text-sm'
                      />
                    ) : (
                      <span className='text-sm text-white font-medium'>{correction.corrected_name}</span>
                    )}
                  </td>
                  <td className='p-4'>
                    <div className='flex items-center justify-center gap-2'>
                      {editingNationality === correction.id ? (
                        <>
                          <Button
                            size='sm'
                            onClick={() => handleUpdateNationality(correction.id)}
                            className='bg-green-600 hover:bg-green-700'
                          >
                            <Check className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => setEditingNationality(null)}
                            className='border-slate-600'
                          >
                            <X className='h-3 w-3' />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              setEditingNationality(correction.id)
                              setEditNationalityData(correction)
                            }}
                            className='border-slate-600'
                          >
                            <Edit className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleDeleteNationality(correction.id)}
                            className='border-red-700 text-red-400 hover:bg-red-900/20'
                          >
                            <Trash2 className='h-3 w-3' />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {nationalityCorrections.length === 0 && (
            <div className='text-center py-8 text-slate-400'>
              No hay reglas de corrección para nacionalidades
            </div>
          )}
        </div>
      ) : activeTab === 'leagues' ? (
        <div className='rounded-lg border border-slate-700 bg-[#131921] overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-[#1a2332] border-b border-slate-700'>
              <tr>
                <th className='p-4 text-left text-sm font-semibold text-slate-300'>National Tier</th>
                <th className='p-4 text-left text-sm font-semibold text-slate-300'>Rename National Tier</th>
                <th className='p-4 text-left text-sm font-semibold text-slate-300'>Country</th>
                <th className='p-4 text-center text-sm font-semibold text-slate-300 w-32'>Acciones</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-700'>
              {leagueCorrections.map(correction => (
                <tr key={correction.id} className='hover:bg-slate-700/30'>
                  <td className='p-4'>
                    {editingLeague === correction.id ? (
                      <Input
                        value={editLeagueData.national_tier || correction.national_tier}
                        onChange={e => setEditLeagueData({ ...editLeagueData, national_tier: e.target.value })}
                        className='bg-[#0a0f16] border-slate-600 text-white text-sm'
                      />
                    ) : (
                      <span className='text-sm text-white'>{correction.national_tier}</span>
                    )}
                  </td>
                  <td className='p-4'>
                    {editingLeague === correction.id ? (
                      <Input
                        value={editLeagueData.rename_national_tier || correction.rename_national_tier}
                        onChange={e => setEditLeagueData({ ...editLeagueData, rename_national_tier: e.target.value })}
                        className='bg-[#0a0f16] border-slate-600 text-white text-sm'
                      />
                    ) : (
                      <span className='text-sm text-white font-medium'>{correction.rename_national_tier}</span>
                    )}
                  </td>
                  <td className='p-4'>
                    {editingLeague === correction.id ? (
                      <Input
                        value={editLeagueData.country || correction.country}
                        onChange={e => setEditLeagueData({ ...editLeagueData, country: e.target.value })}
                        className='bg-[#0a0f16] border-slate-600 text-white text-sm'
                      />
                    ) : (
                      <span className='text-sm text-slate-300'>{correction.country}</span>
                    )}
                  </td>
                  <td className='p-4'>
                    <div className='flex items-center justify-center gap-2'>
                      {editingLeague === correction.id ? (
                        <>
                          <Button
                            size='sm'
                            onClick={() => handleUpdateLeague(correction.id)}
                            className='bg-green-600 hover:bg-green-700'
                          >
                            <Check className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => setEditingLeague(null)}
                            className='border-slate-600'
                          >
                            <X className='h-3 w-3' />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              setEditingLeague(correction.id)
                              setEditLeagueData(correction)
                            }}
                            className='border-slate-600'
                          >
                            <Edit className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleDeleteLeague(correction.id)}
                            className='border-red-700 text-red-400 hover:bg-red-900/20'
                          >
                            <Trash2 className='h-3 w-3' />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leagueCorrections.length === 0 && (
            <div className='text-center py-8 text-slate-400'>
              No hay reglas de corrección para ligas
            </div>
          )}
        </div>
      ) : (
        <div className='rounded-lg border border-slate-700 bg-[#131921] overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-[#1a2332] border-b border-slate-700'>
              <tr>
                <th className='p-4 text-left text-sm font-semibold text-slate-300'>Nombre Original</th>
                <th className='p-4 text-left text-sm font-semibold text-slate-300'>Nombre Corregido</th>
                <th className='p-4 text-left text-sm font-semibold text-slate-300'>País</th>
                <th className='p-4 text-center text-sm font-semibold text-slate-300 w-32'>Acciones</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-700'>
              {competitionCorrections.map(correction => (
                <tr key={correction.id} className='hover:bg-slate-700/30'>
                  <td className='p-4'>
                    {editingCompetition === correction.id ? (
                      <Input
                        value={editCompetitionData.original_name || correction.original_name}
                        onChange={e => setEditCompetitionData({ ...editCompetitionData, original_name: e.target.value })}
                        className='bg-[#0a0f16] border-slate-600 text-white text-sm'
                      />
                    ) : (
                      <span className='text-sm text-white'>{correction.original_name}</span>
                    )}
                  </td>
                  <td className='p-4'>
                    {editingCompetition === correction.id ? (
                      <Input
                        value={editCompetitionData.corrected_name || correction.corrected_name}
                        onChange={e => setEditCompetitionData({ ...editCompetitionData, corrected_name: e.target.value })}
                        className='bg-[#0a0f16] border-slate-600 text-white text-sm'
                      />
                    ) : (
                      <span className='text-sm text-white font-medium'>{correction.corrected_name}</span>
                    )}
                  </td>
                  <td className='p-4'>
                    {editingCompetition === correction.id ? (
                      <Input
                        value={editCompetitionData.country || correction.country || ''}
                        onChange={e => setEditCompetitionData({ ...editCompetitionData, country: e.target.value })}
                        className='bg-[#0a0f16] border-slate-600 text-white text-sm'
                      />
                    ) : (
                      <span className='text-sm text-slate-300'>{correction.country || '-'}</span>
                    )}
                  </td>
                  <td className='p-4'>
                    <div className='flex items-center justify-center gap-2'>
                      {editingCompetition === correction.id ? (
                        <>
                          <Button
                            size='sm'
                            onClick={() => handleUpdateCompetition(correction.id)}
                            className='bg-green-600 hover:bg-green-700'
                          >
                            <Check className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => setEditingCompetition(null)}
                            className='border-slate-600'
                          >
                            <X className='h-3 w-3' />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              setEditingCompetition(correction.id)
                              setEditCompetitionData(correction)
                            }}
                            className='border-slate-600'
                          >
                            <Edit className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleDeleteCompetition(correction.id)}
                            className='border-red-700 text-red-400 hover:bg-red-900/20'
                          >
                            <Trash2 className='h-3 w-3' />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {competitionCorrections.length === 0 && (
            <div className='text-center py-8 text-slate-400'>
              No hay reglas de corrección para competiciones
            </div>
          )}
        </div>
      )}
    </main>
  )
}
