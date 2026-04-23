'use client'

import { ArrowLeft, Save, X, Upload, FileText } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  TOURNAMENT_CATEGORIES,
  TOURNAMENT_MODES,
  TOURNAMENT_REGIONS,
} from "@/constants/tournament-form"
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { useTournaments } from "@/hooks/tournament/useTournaments"

export default function NuevoTorneoPage() {
  const { isSignedIn, isLoaded } = useAuthRedirect()
  const _router = useRouter()
  const { createTorneo, loading } = useTournaments()

  const [formData, setFormData] = useState({
    nombre: '',
    pais: '',
    fecha_inicio: '',
    fecha_fin: '',
    pdf_url: '',
    // Nuevos desplegables (sustituyen a descripcion, ciudad y id_competition).
    mode: '',
    region: '',
    categoria: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePdfUpload = async (file: File) => {
    setUploadingPdf(true)
    setErrors(prev => ({ ...prev, pdf: '' }))
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload-tournament-pdf', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir el archivo')
      }
      
      const result = await response.json()
      setFormData(prev => ({ ...prev, pdf_url: result.url }))
      setPdfFile(file)
      setPdfPreview(URL.createObjectURL(file))
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al subir el archivo'
      setErrors(prev => ({ ...prev, pdf: errorMessage }))
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Verificar que es un PDF
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({ ...prev, pdf: 'El archivo debe ser un PDF' }))
        return
      }
      
      // Verificar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, pdf: 'El archivo es demasiado grande. Máximo 10MB' }))
        return
      }
      
      handlePdfUpload(file)
    }
  }

  const removePdf = () => {
    setFormData(prev => ({ ...prev, pdf_url: '' }))
    setPdfFile(null)
    setPdfPreview(null)
    setErrors(prev => ({ ...prev, pdf: '' }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file && file.type === 'application/pdf') {
        if (file.size <= 10 * 1024 * 1024) {
          handlePdfUpload(file)
        } else {
          setErrors(prev => ({ ...prev, pdf: 'El archivo es demasiado grande. Máximo 10MB' }))
        }
      } else {
        setErrors(prev => ({ ...prev, pdf: 'El archivo debe ser un PDF' }))
      }
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del torneo es requerido'
    }

    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es requerida'
    }

    if (!formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin es requerida'
    }

    if (formData.fecha_inicio && formData.fecha_fin) {
      if (new Date(formData.fecha_inicio) >= new Date(formData.fecha_fin)) {
        newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Los 3 desplegables opcionales: si el usuario no seleccionó nada los mandamos
    // como null (la columna Prisma es String?). Parity con el resto de campos
    // opcionales ya existentes en el formulario.
    const torneoData = {
      ...formData,
      mode: formData.mode || null,
      region: formData.region || null,
      categoria: formData.categoria || null,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      tipo_torneo: 'nacional',
      genero: 'mixto',
      estado: 'planificado',
      es_publico: true,
      es_gratuito: true,
      moneda: 'EUR',
    }

    const success = await createTorneo(torneoData)
    if (success) {
      // Añadir parámetro para forzar recarga en la página principal
      _router.push('/admin/torneos?created=true')
    }
  }

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#080F17] flex items-center justify-center">
      <div className="text-center">
        <div className="text-[#D6DDE6] text-xl">Cargando...</div>
      </div>
    </div>
  }

  if (!isSignedIn) {
    _router.replace('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-[#080F17] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() =>_router.back()}
              className="text-gray-400 hover:text-[#D6DDE6] mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold text-[#D6DDE6]">
              Nuevo Torneo
            </h1>
          </div>
          <p className="text-gray-400">
            Completa la información para crear un nuevo torneo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <Card className="bg-[#131921] border-slate-700">
            <CardHeader>
              <CardTitle className="text-[#D6DDE6]">Información del Torneo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nombre del Torneo *
                </label>
                <Input
                  value={formData.nombre}
                  onChange={(e) =>handleInputChange('nombre', e.target.value)}
                  className="bg-[#1F2937] border-slate-600 text-white" placeholder="Ej: Copa de Verano 2024"/>
                {errors.nombre && <p className="text-red-400 text-sm mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  País
                </label>
                <Input
                  value={formData.pais}
                  onChange={(e) => handleInputChange('pais', e.target.value)}
                  className="bg-[#1F2937] border-slate-600 text-white"
                  placeholder="Ej: España"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Mode
                  </label>
                  <Select
                    value={formData.mode || ''}
                    onValueChange={(value) => handleInputChange('mode', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOURNAMENT_MODES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Region
                  </label>
                  <Select
                    value={formData.region || ''}
                    onValueChange={(value) => handleInputChange('region', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOURNAMENT_REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <Select
                    value={formData.categoria || ''}
                    onValueChange={(value) => handleInputChange('categoria', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOURNAMENT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card className="bg-[#131921] border-slate-700">
            <CardHeader>
              <CardTitle className="text-[#D6DDE6]">Fechas del Torneo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Fecha de Inicio *
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.fecha_inicio}
                    onChange={(e) =>handleInputChange('fecha_inicio', e.target.value)}
                    className="bg-[#1F2937] border-slate-600 text-white" />
                  {errors.fecha_inicio && <p className="text-red-400 text-sm mt-1">{errors.fecha_inicio}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Fecha de Fin *
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.fecha_fin}
                    onChange={(e) =>handleInputChange('fecha_fin', e.target.value)}
                    className="bg-[#1F2937] border-slate-600 text-white" />
                  {errors.fecha_fin && <p className="text-red-400 text-sm mt-1">{errors.fecha_fin}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documento PDF del Torneo */}
          <Card className="bg-[#131921] border-slate-700">
            <CardHeader>
              <CardTitle className="text-[#D6DDE6] flex items-center">
                <FileText className="h-5 w-5 mr-2 text-[#8C1A10]" />
                Documento PDF del Torneo
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Sube el documento oficial del torneo (reglamento, información, etc.)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!pdfFile ? (
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                    isDragOver 
                      ? 'border-[#8C1A10] bg-[#8C1A10]/5' 
                      : 'border-slate-600 hover:border-[#8C1A10]'
                  }`}
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-[#8C1A10]/10 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-[#8C1A10]" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-[#D6DDE6]">
                        {isDragOver ? '¡Suelta el archivo aquí!' : 'Arrastra y suelta tu PDF aquí'}
                      </p>
                      <p className="text-gray-400">
                        {isDragOver ? 'El archivo se subirá automáticamente' : 'o haz clic para seleccionar un archivo'}
                      </p>
                      <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          Solo PDF
                        </span>
                        <span>•</span>
                        <span>Máximo 10MB</span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="pdf-upload"
                        disabled={uploadingPdf}
                      />
                      <Button
                        type="button"
                        className="bg-[#8C1A10] hover:bg-[#7A1610] text-white"
                        disabled={uploadingPdf}
                      >
                        {uploadingPdf ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Seleccionar PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-600 rounded-lg p-6 bg-[#1F2937]/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[#D6DDE6] font-medium text-lg">{pdfFile.name}</h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                          <span>{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          <span>•</span>
                          <span className="text-green-400">✓ Subido correctamente</span>
                        </div>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FileText className="h-3 w-3 mr-1" />
                            PDF Listo
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>window.open(pdfPreview || '#', '_blank')}
                        className="border-blue-600 text-blue-400 hover:bg-blue-900">
                        <FileText className="h-3 w-3 mr-1" />
                        Ver PDF
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removePdf}
                        className="border-red-600 text-red-400 hover:bg-red-900"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {errors.pdf && (
                <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
                  <p className="text-red-400 text-sm flex items-center">
                    <X className="h-4 w-4 mr-2" />
                    {errors.pdf}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>_router.back()}
              className="border-slate-600 text-gray-300 hover:bg-slate-700">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#8C1A10] hover:bg-[#7A1610] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Torneo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
