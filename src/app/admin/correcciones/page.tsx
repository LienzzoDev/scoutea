'use client'

import { Plus, Search, Trash2, Edit, Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'

interface TeamCorrection {
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

type TabType = 'teams' | 'leagues'

export default function CorreccionesPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()

  const [activeTab, setActiveTab] = useState<TabType>('teams')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado para correcciones de equipos
  const [teamCorrections, setTeamCorrections] = useState<TeamCorrection[]>([])
  const [teamSearch, setTeamSearch] = useState('')
  const [editingTeam, setEditingTeam] = useState<string | null>(null)
  const [editTeamData, setEditTeamData] = useState<Partial<TeamCorrection>>({})

  // Estado para correcciones de ligas
  const [leagueCorrections, setLeagueCorrections] = useState<LeagueCorrection[]>([])
  const [leagueSearch, setLeagueSearch] = useState('')
  const [editingLeague, setEditingLeague] = useState<string | null>(null)
  const [editLeagueData, setEditLeagueData] = useState<Partial<LeagueCorrection>>({})

  // Estado para nuevo registro
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTeamData, setNewTeamData] = useState({ original_name: '', corrected_name: '' })
  const [newLeagueData, setNewLeagueData] = useState({ national_tier: '', rename_national_tier: '', country: '' })

  // Cargar correcciones de equipos
  const loadTeamCorrections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/corrections/teams?search=${teamSearch}`)
      if (!response.ok) throw new Error('Error al cargar correcciones de equipos')
      const data = await response.json()
      setTeamCorrections(data.corrections)
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

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      if (activeTab === 'teams') {
        loadTeamCorrections()
      } else {
        loadLeagueCorrections()
      }
    }
  }, [isLoaded, isSignedIn, activeTab, teamSearch, leagueSearch])

  // Crear nueva corrección de equipo
  const handleCreateTeam = async () => {
    try {
      const response = await fetch('/api/admin/corrections/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeamData)
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.__error || 'Error al crear')
      }
      setNewTeamData({ original_name: '', corrected_name: '' })
      setShowNewForm(false)
      loadTeamCorrections()
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

  // Actualizar corrección de equipo
  const handleUpdateTeam = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/corrections/teams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editTeamData)
      })
      if (!response.ok) throw new Error('Error al actualizar')
      setEditingTeam(null)
      loadTeamCorrections()
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

  // Eliminar corrección de equipo
  const handleDeleteTeam = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta corrección?')) return
    try {
      const response = await fetch(`/api/admin/corrections/teams/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Error al eliminar')
      loadTeamCorrections()
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

  if (!isLoaded) return <LoadingPage />
  if (!isSignedIn) return null

  return (
    <main className='px-6 py-8 max-w-full mx-auto'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-[#D6DDE6]'>Reglas de Corrección</h1>
          <p className='text-sm text-slate-400 mt-1'>
            Define reglas para normalizar nombres de equipos y ligas
          </p>
        </div>
        <Button
          className='bg-[#FF5733] hover:bg-[#E64A2B] text-white'
          onClick={() => setShowNewForm(true)}
        >
          <Plus className='h-4 w-4 mr-2' />
          Nueva Regla
        </Button>
      </div>

      {/* Tabs */}
      <div className='mb-6 border-b border-slate-700'>
        <div className='flex space-x-8'>
          <button
            onClick={() => setActiveTab('teams')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'teams'
                ? 'border-[#FF5733] text-[#FF5733]'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Equipos
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
        </div>
      </div>

      {/* Search */}
      <div className='mb-6 relative max-w-md'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400' />
        <Input
          placeholder='Buscar...'
          value={activeTab === 'teams' ? teamSearch : leagueSearch}
          onChange={e => activeTab === 'teams' ? setTeamSearch(e.target.value) : setLeagueSearch(e.target.value)}
          className='pl-10 bg-[#131921] border-slate-700 text-white placeholder:text-slate-400'
        />
      </div>

      {error && (
        <div className='mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg'>
          <p className='text-red-400'>Error: {error}</p>
        </div>
      )}

      {/* Formulario nueva regla */}
      {showNewForm && (
        <div className='mb-6 p-4 bg-[#1a2332] border border-slate-700 rounded-lg'>
          <h3 className='text-lg font-semibold text-white mb-4'>
            Nueva Regla de {activeTab === 'teams' ? 'Equipo' : 'Liga'}
          </h3>
          {activeTab === 'teams' ? (
            <div className='space-y-3'>
              <Input
                placeholder='Nombre Original'
                value={newTeamData.original_name}
                onChange={e => setNewTeamData({ ...newTeamData, original_name: e.target.value })}
                className='bg-[#131921] border-slate-700 text-white'
              />
              <Input
                placeholder='Nombre Corregido'
                value={newTeamData.corrected_name}
                onChange={e => setNewTeamData({ ...newTeamData, corrected_name: e.target.value })}
                className='bg-[#131921] border-slate-700 text-white'
              />
              <div className='flex gap-2'>
                <Button onClick={handleCreateTeam} className='bg-green-600 hover:bg-green-700'>
                  <Check className='h-4 w-4 mr-2' />
                  Crear
                </Button>
                <Button onClick={() => setShowNewForm(false)} variant='outline' className='border-slate-700'>
                  <X className='h-4 w-4 mr-2' />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className='space-y-3'>
              <Input
                placeholder='National Tier'
                value={newLeagueData.national_tier}
                onChange={e => setNewLeagueData({ ...newLeagueData, national_tier: e.target.value })}
                className='bg-[#131921] border-slate-700 text-white'
              />
              <Input
                placeholder='Rename National Tier'
                value={newLeagueData.rename_national_tier}
                onChange={e => setNewLeagueData({ ...newLeagueData, rename_national_tier: e.target.value })}
                className='bg-[#131921] border-slate-700 text-white'
              />
              <Input
                placeholder='Country'
                value={newLeagueData.country}
                onChange={e => setNewLeagueData({ ...newLeagueData, country: e.target.value })}
                className='bg-[#131921] border-slate-700 text-white'
              />
              <div className='flex gap-2'>
                <Button onClick={handleCreateLeague} className='bg-green-600 hover:bg-green-700'>
                  <Check className='h-4 w-4 mr-2' />
                  Crear
                </Button>
                <Button onClick={() => setShowNewForm(false)} variant='outline' className='border-slate-700'>
                  <X className='h-4 w-4 mr-2' />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabla de correcciones */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='flex items-center gap-2 text-slate-400'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5733]'></div>
            <span>Cargando...</span>
          </div>
        </div>
      ) : activeTab === 'teams' ? (
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
              {teamCorrections.map(correction => (
                <tr key={correction.id} className='hover:bg-slate-700/30'>
                  <td className='p-4'>
                    {editingTeam === correction.id ? (
                      <Input
                        value={editTeamData.original_name || correction.original_name}
                        onChange={e => setEditTeamData({ ...editTeamData, original_name: e.target.value })}
                        className='bg-[#0a0f16] border-slate-600 text-white text-sm'
                      />
                    ) : (
                      <span className='text-sm text-white'>{correction.original_name}</span>
                    )}
                  </td>
                  <td className='p-4'>
                    {editingTeam === correction.id ? (
                      <Input
                        value={editTeamData.corrected_name || correction.corrected_name}
                        onChange={e => setEditTeamData({ ...editTeamData, corrected_name: e.target.value })}
                        className='bg-[#0a0f16] border-slate-600 text-white text-sm'
                      />
                    ) : (
                      <span className='text-sm text-white font-medium'>{correction.corrected_name}</span>
                    )}
                  </td>
                  <td className='p-4'>
                    <div className='flex items-center justify-center gap-2'>
                      {editingTeam === correction.id ? (
                        <>
                          <Button
                            size='sm'
                            onClick={() => handleUpdateTeam(correction.id)}
                            className='bg-green-600 hover:bg-green-700'
                          >
                            <Check className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => setEditingTeam(null)}
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
                              setEditingTeam(correction.id)
                              setEditTeamData(correction)
                            }}
                            className='border-slate-600'
                          >
                            <Edit className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleDeleteTeam(correction.id)}
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
          {teamCorrections.length === 0 && (
            <div className='text-center py-8 text-slate-400'>
              No hay reglas de corrección para equipos
            </div>
          )}
        </div>
      ) : (
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
      )}
    </main>
  )
}
