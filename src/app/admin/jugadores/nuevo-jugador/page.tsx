"use client"

import { useAuth } from "@clerk/nextjs"
import { ChevronLeft, Edit, Settings, Plus, X, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, FormEvent } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePlayers } from "@/hooks/player/usePlayers"
import { CrearJugadorData } from "@/types/player"

export default function NuevoJugadorPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const _router = useRouter()
  const { crearJugador } = usePlayers()
  
  // Estado del formulario
  const [formData, setFormData] = useState<CrearJugadorData>({
    nombre: '',
    posicion: '',
    edad: 18,
    equipo: ''
  })

  // Estado de la UI
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newAttribute, setNewAttribute] = useState({ nombre: '', valor: '' })

  // Estado para scraping
  const [urlTrfm, setUrlTrfm] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapingResult, setScrapingResult] = useState<any>(null)

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }
    if (!formData.posicion.trim()) {
      newErrors.posicion = 'La posición es requerida'
    }
    if (formData.edad < 16 || formData.edad > 50) {
      newErrors.edad = 'La edad debe estar entre 16 y 50 años'
    }
    if (!formData.equipo.trim()) {
      newErrors.equipo = 'El equipo es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar cambios en inputs
  const handleInputChange = (field: keyof CrearJugadorData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Agregar atributo
  const addAttribute = () => {
    if (newAttribute.nombre.trim() && newAttribute.valor.trim()) {
      setFormData(prev => ({
        ...prev,
        atributos: [...(prev.atributos ?? []), { ...newAttribute }]
      }))
      setNewAttribute({ nombre: '', valor: '' })
    }
  }

  // Remover atributo
  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      atributos: prev.atributos?.filter((_attr, i) => i !== index) ?? []
    }))
  }

  // Hacer scraping de URL individual
  const handleScraping = async () => {
    if (!urlTrfm.trim()) {
      alert('Por favor ingresa una URL de Transfermarkt')
      return
    }

    // Validar que sea una URL de Transfermarkt
    if (!urlTrfm.includes('transfermarkt')) {
      alert('La URL debe ser de Transfermarkt')
      return
    }

    setScraping(true)
    setScrapingResult(null)

    try {
      const response = await fetch('/api/admin/scraping/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: urlTrfm })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al hacer scraping')
      }

      setScrapingResult(data)

      // Auto-rellenar formulario con datos scrapeados
      if (data.data) {
        const scraped = data.data

        // Solo rellenar campos que estén vacíos
        if (scraped.player_name && !formData.nombre) {
          handleInputChange('nombre', scraped.player_name)
        }
        if (scraped.position_player && !formData.posicion) {
          handleInputChange('posicion', scraped.position_player)
        }
        if (scraped.team_name && !formData.equipo) {
          handleInputChange('equipo', scraped.team_name)
        }
        if (scraped.date_of_birth && !formData.edad) {
          // Calcular edad desde fecha de nacimiento
          const birthDate = new Date(scraped.date_of_birth)
          const age = new Date().getFullYear() - birthDate.getFullYear()
          handleInputChange('edad', age)
        }
      }

      alert('Scraping completado exitosamente! Los datos han sido cargados en el formulario.')

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      alert(`Error al hacer scraping: ${errorMsg}`)
    } finally {
      setScraping(false)
    }
  }

  // Enviar formulario
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const resultado = await crearJugador(formData)
      if (resultado) {
        // Redirigir a la lista de jugadores
        _router.push('/admin/jugadores')
      } else {
        console.error('❌ No se pudo crear el jugador - resultado null')
      }
    } catch (_error) {
      console.error('❌ Error al crear jugador:', _error)
    } finally {
      setLoading(false)
    }
  }

  // Si no está cargado o autenticado, mostrar nada
  if (!isLoaded || !isSignedIn) {
    return null
  }

  return (
    <main className="mx-[306px] py-8">
        {/* Player Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-white"
              onClick={() => _router.back()}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarImage src={formData.urlAvatar ?? "/dynamic-soccer-player.png"} />
                <AvatarFallback>JP</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FF5733] rounded-full flex items-center justify-center">
                <Edit className="w-3 h-3 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-[#D6DDE6]">Nuevo Jugador</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Button 
              type="submit"
              form="jugador-form"
              disabled={loading}
              className="bg-[#FF5733] hover:bg-[#E64A2B] text-white px-6"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={handleScraping}
              disabled={scraping || !urlTrfm}
              variant="outline"
              className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {scraping ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scrapeando...</span>
                </div>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Hacer Scraping
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Form */}
        <form id="jugador-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Scraping Section */}
          <section className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-[#D6DDE6] flex items-center">
              <Settings className="h-5 w-5 mr-2 text-blue-400" />
              Scraping de Transfermarkt
            </h2>
            <div className="space-y-2">
              <Label htmlFor="urlTrfm" className="text-sm text-slate-300 block">
                URL de Transfermarkt
              </Label>
              <Input
                id="urlTrfm"
                value={urlTrfm}
                onChange={(e) => setUrlTrfm(e.target.value)}
                placeholder="https://www.transfermarkt.es/jugador/profil/spieler/..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-400">
                Ingresa la URL del perfil del jugador en Transfermarkt y haz clic en "Hacer Scraping" para cargar automáticamente sus datos.
              </p>
              {scrapingResult && (
                <div className="mt-3 p-3 bg-green-900/20 border border-green-700 rounded text-sm text-green-300">
                  ✅ Datos cargados exitosamente desde Transfermarkt
                </div>
              )}
            </div>
          </section>

          {/* Información Personal */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[#D6DDE6]">Información Personal</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre" className="text-sm text-slate-300 mb-2 block">
                    Nombre Completo *
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) =>handleInputChange('nombre', e.target.value)}
                    placeholder="Nombre completo del jugador" className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 ${
                      errors.nombre ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.nombre && (
                    <p className="text-red-400 text-sm mt-1">{errors.nombre}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="posicion" className="text-sm text-slate-300 mb-2 block">
                    Posición *
                  </Label>
                  <Input
                    id="posicion"
                    value={formData.posicion}
                    onChange={(e) =>handleInputChange('posicion', e.target.value)}
                    placeholder="Posición en el campo" className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 ${
                      errors.posicion ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.posicion && (
                    <p className="text-red-400 text-sm mt-1">{errors.posicion}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edad" className="text-sm text-slate-300 mb-2 block">
                    Edad *
                  </Label>
                  <Input
                    id="edad"
                    type="number"
                    min="16"
                    max="50"
                    value={formData.edad}
                    onChange={(e) => handleInputChange('edad', parseInt(e.target.value) || 18)}
                    className={`bg-slate-800 border-slate-700 text-white ${
                      errors.edad ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.edad && (
                    <p className="text-red-400 text-sm mt-1">{errors.edad}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="equipo" className="text-sm text-slate-300 mb-2 block">
                    Equipo *
                  </Label>
                  <Input
                    id="equipo"
                    value={formData.equipo}
                    onChange={(e) =>handleInputChange('equipo', e.target.value)}
                    placeholder="Nombre del equipo" className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 ${
                      errors.equipo ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.equipo && (
                    <p className="text-red-400 text-sm mt-1">{errors.equipo}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numeroCamiseta" className="text-sm text-slate-300 mb-2 block">
                    Número de Camiseta
                  </Label>
                  <Input
                    id="numeroCamiseta"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.numeroCamiseta ?? ''}
                    onChange={(e) =>handleInputChange('numeroCamiseta', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Número" className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
                </div>
                <div>
                  <Label htmlFor="valoracion" className="text-sm text-slate-300 mb-2 block">
                    Valoración
                  </Label>
                  <Input
                    id="valoracion"
                    value={formData.valoracion ?? ''}
                    onChange={(e) =>handleInputChange('valoracion', e.target.value)}
                    placeholder="Ej: 250k, 1.5M" className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="urlAvatar" className="text-sm text-slate-300 mb-2 block">
                  URL del Avatar
                </Label>
                <Input
                  id="urlAvatar"
                  value={formData.urlAvatar ?? ''}
                  onChange={(e) =>handleInputChange('urlAvatar', e.target.value)}
                  placeholder="URL de la imagen del jugador" className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
              </div>

              <div>
                <Label htmlFor="biografia" className="text-sm text-slate-300 mb-2 block">
                  Biografía
                </Label>
                <Textarea
                  id="biografia"
                  value={formData.biografia ?? ''}
                  onChange={(e) =>handleInputChange('biografia', e.target.value)}
                  placeholder="Escribe una breve biografía del jugador" className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 min-h-[100px]" />
              </div>
            </div>
          </section>

          {/* Atributos */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[#D6DDE6]">Atributos</h2>
            <div className="space-y-4">
              {/* Agregar nuevo atributo */}
              <div className="flex space-x-3">
                <div className="flex-1">
                  <Input
                    placeholder="Nombre del atributo"
                    value={newAttribute.nombre}
                    onChange={(e) => setNewAttribute(prev => ({ ...prev, nombre: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Valor del atributo"
                    value={newAttribute.valor}
                    onChange={(e) => setNewAttribute(prev => ({ ...prev, valor: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
                </div>
                <Button
                  type="button"
                  onClick={addAttribute}
                  disabled={!newAttribute.nombre.trim() || !newAttribute.valor.trim()}
                  className="bg-[#FF5733] hover:bg-[#E64A2B] text-white px-4"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Lista de atributos */}
              {formData.atributos && formData.atributos.length > 0 && (
                <div className="space-y-2">
                  {formData.atributos.map((attr: { nombre: string; valor: string }, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div className="flex-1">
                        <span className="text-[#D6DDE6] font-medium">{attr.nombre}:</span>
                        <span className="text-slate-300 ml-2">{attr.valor}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>removeAttribute(index)}
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </form>
      </main>
  )
}
