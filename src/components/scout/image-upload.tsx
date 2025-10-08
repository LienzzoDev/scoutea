'use client'

import { useState } from 'react'
import { Upload, X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ value, onChange, label = 'Imagen' }: ImageUploadProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url')
  const [urlInput, setUrlInput] = useState(value || '')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Solo se permiten imágenes (JPEG, PNG, WebP, GIF)",
        variant: "destructive"
      })
      return
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "La imagen es demasiado grande. Máximo 5MB",
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
        onChange(result.url)
        toast({
          title: "¡Éxito!",
          description: "Imagen subida correctamente"
        })
      } else {
        throw new Error(result.error || 'Error al subir la imagen')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir la imagen",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      toast({
        title: "¡Éxito!",
        description: "URL de imagen guardada"
      })
    }
  }

  const handleClear = () => {
    onChange('')
    setUrlInput('')
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      
      {/* Mode Selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            uploadMode === 'url'
              ? 'bg-[#8B0000] text-white'
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
              ? 'bg-[#8B0000] text-white'
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
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors bg-muted/20">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000] mb-2"></div>
                  <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Click para subir</span> o arrastra aquí
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WebP, GIF (máx. 5MB)
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative">
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="Eliminar imagen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 break-all">{value}</p>
        </div>
      )}
    </div>
  )
}
