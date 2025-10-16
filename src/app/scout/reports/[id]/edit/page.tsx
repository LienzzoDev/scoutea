'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

import ScoutNavbar from '@/components/layout/scout-navbar'
import { MediaUpload } from '@/components/scout/media-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

export default function EditReportPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const reportId = params.id as string
  
  const [potential, setPotential] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [playerName, setPlayerName] = useState('')
  
  const [formData, setFormData] = useState({
    reportText: '',
    urlReport: '',
    urlVideo: '',
    imageUrl: ''
  })

  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // Solo cargar una vez
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    const loadReport = async () => {
      try {
        const response = await fetch(`/api/reports/${reportId}`)
        const result = await response.json()
        
        if (result.success) {
          const report = result.data
          setFormData({
            reportText: report.form_text_report || '',
            urlReport: report.form_url_report || '',
            urlVideo: report.form_url_video || '',
            imageUrl: report.url_secondary || ''
          })
          setPotential(report.form_potential ? parseInt(report.form_potential) : 0)
          setPlayerName(report.player?.player_name || report.player_name || '')
        } else {
          throw new Error(result.error || 'Error al cargar el reporte')
        }
      } catch (error) {
        console.error('Error loading report:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al cargar el reporte",
          variant: "destructive"
        })
        router.push('/scout/reports')
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [reportId, toast, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (potential === 0) {
      toast({
        title: "Error",
        description: "El potencial es requerido",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Updating report with data:', {
        reportText: formData.reportText,
        urlReport: formData.urlReport,
        urlVideo: formData.urlVideo,
        imageUrl: formData.imageUrl,
        potential
      })

      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportText: formData.reportText || null,
          urlReport: formData.urlReport || null,
          urlVideo: formData.urlVideo || null,
          imageUrl: formData.imageUrl || null,
          potential
        })
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response result:', result)

      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: "Reporte actualizado correctamente",
        })
        
        router.push('/scout/reports')
      } else {
        throw new Error(result.error || 'Error al actualizar el reporte')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el reporte",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4]">
        <ScoutNavbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B0000]"></div>
            <span className="ml-3 text-[#6d6d6d] mt-2">Cargando reporte...</span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <ScoutNavbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#6d6d6d] mb-6">
          <span>Scout</span>
          <span>›</span>
          <span>Reports</span>
          <span>›</span>
          <span className="text-[#000000]">Editar Reporte</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-[#000000] mb-2">
          Editar Reporte
        </h1>
        <p className="text-lg text-[#6d6d6d] mb-8">
          {playerName}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-border bg-card p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
            {/* Left Column - Player Info (Read-only) */}
            <div className="space-y-5">
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <h3 className="text-sm font-medium text-foreground mb-2">Jugador</h3>
                <p className="text-base font-semibold text-foreground">{playerName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No puedes cambiar el jugador del reporte
                </p>
              </div>
            </div>

            {/* Right Column - Report Details */}
            <div className="space-y-5">
              {/* Report Text */}
              <div className="space-y-2">
                <Label htmlFor="report-text" className="text-sm font-medium text-foreground">
                  Report Text
                </Label>
                <Textarea
                  id="report-text"
                  placeholder="Enter your report details here..."
                  value={formData.reportText}
                  onChange={(e) => handleInputChange('reportText', e.target.value)}
                  className="min-h-[320px] resize-none rounded-lg border-0 bg-muted/50 p-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* URL Report */}
              <div className="space-y-2">
                <Label htmlFor="url-report" className="text-sm font-medium text-foreground">
                  URL report
                </Label>
                <Input
                  id="url-report"
                  type="url"
                  placeholder="https://example.com/report"
                  value={formData.urlReport}
                  onChange={(e) => handleInputChange('urlReport', e.target.value)}
                  className="h-12 rounded-lg border-0 bg-muted/50 px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Media Upload (Image or Video) */}
              <MediaUpload
                imageValue={formData.imageUrl}
                videoValue={formData.urlVideo}
                onImageChange={(url) => handleInputChange('imageUrl', url)}
                onVideoChange={(url) => handleInputChange('urlVideo', url)}
              />

              {/* Potential Rating */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">*Potential</Label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPotential(value)}
                      className="group relative h-12 w-12 rounded-full transition-all hover:scale-110"
                      aria-label={`Set potential to ${value}`}
                    >
                      <div
                        className={`h-full w-full rounded-full border-2 transition-all ${
                          value <= potential
                            ? "border-[#8B0000] bg-[#8B0000]"
                            : "border-muted-foreground/30 bg-muted/30 group-hover:border-muted-foreground/50"
                        }`}
                      />
                      {value <= potential && (
                        <svg
                          className="absolute inset-0 m-auto h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/scout/reports')}
                  className="h-14 flex-1 rounded-lg text-base font-semibold"
                >
                  CANCELAR
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-14 flex-1 rounded-lg bg-[#8B0000] text-base font-semibold text-white hover:bg-[#660000] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
