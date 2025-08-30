"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Edit, Settings, Plus, X, Save } from "lucide-react"
import { useJugadores } from "@/hooks/usePlayers"
import { CrearJugadorData } from "@/types/player"

export default function NuevoJugadorPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const { crearJugador } = useJugadores()
  
  // Estado del formulario
  const [formData, setFormData] = useState<CrearJugadorData>({
    nombre: '',
    nombreUsuario: '',
    posicion: '',
    edad: 18,
    equipo: '',
    numeroCamiseta: undefined,
    biografia: '',
    valoracion: '',
    urlAvatar: '',
    atributos: []
  })

  // Estado de la UI
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newAttribute, setNewAttribute] = useState({ nombre: '', valor: '' })

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    }
    if (!formData.nombreUsuario.trim()) {
      newErrors.nombreUsuario = 'El nombre de usuario es requerido'
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
        atributos: [...(prev.atributos || []), { ...newAttribute }]
      }))
      setNewAttribute({ nombre: '', valor: '' })
    }
  }

  // Remover atributo
  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      atributos: prev.atributos?.filter((_, i) => i !== index) || []
    }))
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
          router.push('/jugadores')
        }
    } catch (error) {
      console.error('Error al crear jugador:', error)
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
              onClick={() => router.back()}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarImage src={formData.urlAvatar || "/dynamic-soccer-player.png"} />
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
            <Button variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
              <Settings className="h-4 w-4 mr-2" />
              Hacer Scraping
            </Button>
          </div>
        </div>

        {/* Form */}
        <form id="jugador-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Información Personal */}
          <section>
            <h2 className="text-xl font-semibold mb-6 text-[#D6DDE6]">Información Personal</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombreUsuario" className="text-sm text-slate-300 mb-2 block">
                  Nombre de Usuario *
                </Label>
                <Input
                  id="nombreUsuario"
                  value={formData.nombreUsuario}
                  onChange={(e) => handleInputChange('nombreUsuario', e.target.value)}
                  placeholder="Nombre de usuario único"
                  className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 ${
                    errors.nombreUsuario ? 'border-red-500' : ''
                  }`}
                />
                {errors.nombreUsuario && (
                  <p className="text-red-400 text-sm mt-1">{errors.nombreUsuario}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre" className="text-sm text-slate-300 mb-2 block">
                    Nombre Completo *
                  </Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Nombre completo del jugador"
                    className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 ${
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
                    onChange={(e) => handleInputChange('posicion', e.target.value)}
                    placeholder="Posición en el campo"
                    className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 ${
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
                    onChange={(e) => handleInputChange('equipo', e.target.value)}
                    placeholder="Nombre del equipo"
                    className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 ${
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
                    value={formData.numeroCamiseta || ''}
                    onChange={(e) => handleInputChange('numeroCamiseta', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Número"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <Label htmlFor="valoracion" className="text-sm text-slate-300 mb-2 block">
                    Valoración
                  </Label>
                  <Input
                    id="valoracion"
                    value={formData.valoracion}
                    onChange={(e) => handleInputChange('valoracion', e.target.value)}
                    placeholder="Ej: 250k, 1.5M"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="urlAvatar" className="text-sm text-slate-300 mb-2 block">
                  URL del Avatar
                </Label>
                <Input
                  id="urlAvatar"
                  value={formData.urlAvatar}
                  onChange={(e) => handleInputChange('urlAvatar', e.target.value)}
                  placeholder="URL de la imagen del jugador"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <Label htmlFor="biografia" className="text-sm text-slate-300 mb-2 block">
                  Biografía
                </Label>
                <Textarea
                  id="biografia"
                  value={formData.biografia}
                  onChange={(e) => handleInputChange('biografia', e.target.value)}
                  placeholder="Escribe una breve biografía del jugador"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 min-h-[100px]"
                />
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
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Valor del atributo"
                    value={newAttribute.valor}
                    onChange={(e) => setNewAttribute(prev => ({ ...prev, valor: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  />
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
                  {formData.atributos.map((attr, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div className="flex-1">
                        <span className="text-[#D6DDE6] font-medium">{attr.nombre}:</span>
                        <span className="text-slate-300 ml-2">{attr.valor}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttribute(index)}
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
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
