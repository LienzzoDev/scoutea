'use client'

import { Upload, X, Image as ImageIcon, Video as VideoIcon, Link as LinkIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface MediaUploadProps {
  imageValue?: string
  videoValue?: string
  onImageChange: (url: string) => void
  onVideoChange: (url: string) => void
  darkMode?: boolean
}

export function MediaUpload({ imageValue, videoValue, onImageChange, onVideoChange, darkMode = false }: MediaUploadProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [mediaType, setMediaType] = useState<'image' | 'video'>(imageValue ? 'image' : videoValue ? 'video' : 'image')
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url')
  const [urlInput, setUrlInput] = useState('')

  const currentValue = mediaType === 'image' ? imageValue : videoValue

  const handleMediaTypeChange = (type: 'image' | 'video') => {
    setMediaType(type)
    setUrlInput('')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo según el tipo de media
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    const validTypes = mediaType === 'image' ? validImageTypes : validVideoTypes

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: mediaType === 'image' 
          ? "Solo se permiten imágenes (JPEG, PNG, WebP, GIF)"
          : "Solo se permiten videos (MP4, WebM, MOV)",
        variant: "destructive"
      })
      return
    }

    // Validar tamaño
    const maxSize = mediaType === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024 // 5MB para imágenes, 50MB para videos
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: mediaType === 'image'
          ? "La imagen es demasiado grande. Máximo 5MB"
          : "El video es demasiado grande. Máximo 50MB",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        if (mediaType === 'image') {
          onImageChange(result.url)
          onVideoChange('') // Limpiar video
        } else {
          onVideoChange(result.url)
          onImageChange('') // Limpiar imagen
        }
        toast({
          title: "¡Éxito!",
          description: `${mediaType === 'image' ? 'Imagen' : 'Video'} subido correctamente`
        })
      } else {
        throw new Error(result.error || 'Error al subir el archivo')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir el archivo",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      const url = urlInput.trim()

      // Auto-detectar si es un video (YouTube, Vimeo, etc.) o MP4/WebM
      const isVideoUrl =
        url.includes('youtube.com') ||
        url.includes('youtu.be') ||
        url.includes('vimeo.com') ||
        url.endsWith('.mp4') ||
        url.endsWith('.webm') ||
        url.endsWith('.mov')

      // Si es una URL de video, guardarla en urlVideo independientemente de la pestaña
      if (isVideoUrl) {
        onVideoChange(url)
        onImageChange('') // Limpiar imagen
        // Cambiar automáticamente a la pestaña de video
        setMediaType('video')
        toast({
          title: "¡Éxito!",
          description: "URL de video guardada (detectada automáticamente)"
        })
      } else {
        // Si no, guardar según la pestaña seleccionada
        if (mediaType === 'image') {
          onImageChange(url)
          onVideoChange('') // Limpiar video
          toast({
            title: "¡Éxito!",
            description: "URL de imagen guardada"
          })
        } else {
          onVideoChange(url)
          onImageChange('') // Limpiar imagen
          toast({
            title: "¡Éxito!",
            description: "URL de video guardada"
          })
        }
      }

      setUrlInput('')
    }
  }

  const handleClear = () => {
    if (mediaType === 'image') {
      onImageChange('')
    } else {
      onVideoChange('')
    }
    setUrlInput('')
  }

  return (
    <div className="space-y-3">
      <Label className={darkMode ? 'text-sm font-medium text-[#D6DDE6]' : 'text-sm font-medium text-foreground'}>Media del Reporte</Label>
      
      {/* Media Type Selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleMediaTypeChange('image')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mediaType === 'image'
              ? 'bg-[#8B0000] text-white'
              : darkMode
                ? 'bg-[#1a2332] text-gray-300 hover:bg-[#1a2332]/80 border border-slate-600'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <ImageIcon className="w-4 h-4 inline mr-2" />
          Imagen
        </button>
        <button
          type="button"
          onClick={() => handleMediaTypeChange('video')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mediaType === 'video'
              ? 'bg-[#8B0000] text-white'
              : darkMode
                ? 'bg-[#1a2332] text-gray-300 hover:bg-[#1a2332]/80 border border-slate-600'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <VideoIcon className="w-4 h-4 inline mr-2" />
          Video
        </button>
      </div>

      {/* Upload Mode Selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            uploadMode === 'url'
              ? 'bg-blue-600 text-white'
              : darkMode
                ? 'bg-[#1a2332] text-gray-300 hover:bg-[#1a2332]/80 border border-slate-600'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <LinkIcon className="w-4 h-4 inline mr-2" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            uploadMode === 'file'
              ? 'bg-blue-600 text-white'
              : darkMode
                ? 'bg-[#1a2332] text-gray-300 hover:bg-[#1a2332]/80 border border-slate-600'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Subir
        </button>
      </div>

      {/* URL Mode */}
      {uploadMode === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder={
                mediaType === 'image'
                  ? "https://example.com/image.jpg"
                  : "https://youtube.com/watch?v=... o https://example.com/video.mp4"
              }
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className={`h-12 rounded-lg px-4 ${
                darkMode
                  ? 'border border-slate-600 bg-[#1a2332] text-[#D6DDE6] placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500'
                  : 'border-0 bg-muted/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring'
              }`}
            />
            <Button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
              className="h-12 px-6 bg-[#8B0000] hover:bg-[#660000]"
            >
              Guardar
            </Button>
          </div>
        </div>
      )}

      {/* File Upload Mode */}
      {uploadMode === 'file' && (
        <div className="space-y-2">
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            darkMode
              ? 'border-slate-600 hover:border-slate-500 bg-[#1a2332]/50'
              : 'border-muted-foreground/30 hover:border-muted-foreground/50 bg-muted/20'
          }`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000] mb-2"></div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>Subiendo {mediaType === 'image' ? 'imagen' : 'video'}...</p>
                </>
              ) : (
                <>
                  {mediaType === 'image' ? (
                    <ImageIcon className={`w-8 h-8 mb-2 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                  ) : (
                    <VideoIcon className={`w-8 h-8 mb-2 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                  )}
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                    <span className="font-semibold">Click para subir</span> o arrastra aquí
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-muted-foreground'}`}>
                    {mediaType === 'image'
                      ? 'PNG, JPG, WebP, GIF (máx. 5MB)'
                      : 'MP4, WebM, MOV (máx. 50MB)'}
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept={
                mediaType === 'image'
                  ? 'image/jpeg,image/jpg,image/png,image/webp,image/gif'
                  : 'video/mp4,video/webm,video/quicktime'
              }
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {/* Preview */}
      {currentValue && (
        <div className="relative">
          <div className="relative w-full rounded-lg overflow-hidden bg-muted">
            {mediaType === 'image' ? (
              <img
                src={currentValue}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center bg-black">
                <VideoIcon className="w-12 h-12 text-white/50" />
              </div>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title={`Eliminar ${mediaType === 'image' ? 'imagen' : 'video'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className={`text-xs mt-2 break-all ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>{currentValue}</p>
        </div>
      )}

      {/* Info */}
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
        💡 <strong>Nota:</strong> Los reportes solo soportan videos. Si pegas una URL de YouTube, Vimeo o video, se detectará automáticamente como video.
      </p>
    </div>
  )
}
