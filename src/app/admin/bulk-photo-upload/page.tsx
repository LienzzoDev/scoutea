'use client'

import { Upload, CheckCircle2, AlertTriangle, XCircle, FileArchive } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

type Status = 'idle' | 'uploading' | 'done' | 'error'

interface ProgressState {
  current: number
  total: number
  filename: string
}

interface Result {
  updated: number
  orphans: string[]
  errors: Array<{ file: string; reason: string }>
}

export default function BulkPhotoUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setStatus('idle')
    setProgress(null)
    setResult(null)
    setErrorMsg(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!file) return
    setStatus('uploading')
    setProgress(null)
    setResult(null)
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/bulk-photo-upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(err.error || `HTTP ${response.status}`)
      }
      if (!response.body) throw new Error('Respuesta sin stream')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const raw of events) {
          const line = raw.trim()
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload) continue

          try {
            const msg = JSON.parse(payload)
            if (msg.type === 'start') {
              setProgress({ current: 0, total: msg.total, filename: '' })
            } else if (msg.type === 'progress') {
              setProgress({ current: msg.current, total: msg.total, filename: msg.filename })
            } else if (msg.type === 'complete') {
              setResult({
                updated: msg.updated,
                orphans: msg.orphans,
                errors: msg.errors,
              })
              setStatus('done')
            }
          } catch (e) {
            console.error('Error parsing SSE:', e)
          }
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }

  const percent = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Subida masiva de fotos</h1>
        <p className="text-slate-400 text-sm">
          Sube un archivo ZIP con las fotos de los jugadores. Los nombres deben ser el
          <code className="mx-1 px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">id_player</code>
          seguido de
          <code className="mx-1 px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">.png</code>
          (ej: <code className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">1.png</code>,
          <code className="mx-1 px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">2.png</code>).
          Las fotos existentes se sobrescriben. Máximo 100 MB por ZIP.
        </p>
      </div>

      {/* Upload card */}
      <div className="bg-[#131921] border border-slate-700 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={status === 'uploading'}
              className="block w-full text-sm text-slate-300
                file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                file:text-sm file:font-medium file:cursor-pointer
                file:bg-[#FF5733]/10 file:text-[#FF5733]
                hover:file:bg-[#FF5733]/20"
            />
            {file && (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                <FileArchive className="w-4 h-4" />
                <span>{file.name}</span>
                <span>·</span>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || status === 'uploading'}
            className="bg-[#FF5733] hover:bg-[#E64A2B] text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            {status === 'uploading' ? 'Procesando...' : 'Subir ZIP'}
          </Button>
          {(status === 'done' || status === 'error') && (
            <Button
              variant="outline"
              onClick={reset}
              className="text-slate-300 border-slate-700 hover:bg-slate-700"
            >
              Nuevo lote
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      {status === 'uploading' && progress && (
        <div className="bg-[#131921] border border-slate-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-200">
              {progress.current} / {progress.total}
            </span>
            <span className="text-sm text-slate-400">{percent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF5733] transition-all duration-150"
              style={{ width: `${percent}%` }}
            />
          </div>
          {progress.filename && (
            <p className="mt-3 text-xs text-slate-400 truncate">
              Procesando: <span className="text-slate-300">{progress.filename}</span>
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {status === 'error' && errorMsg && (
        <div className="bg-red-950/40 border border-red-800 rounded-lg p-6 mb-6 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-200">Error durante la subida</p>
            <p className="text-sm text-red-300 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {status === 'done' && result && (
        <div className="space-y-4">
          {/* Updated */}
          <div className="bg-green-950/40 border border-green-800 rounded-lg p-6 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-200">
                {result.updated} jugadores actualizados
              </p>
              <p className="text-sm text-green-300/80 mt-1">
                Las fotos se han asociado correctamente y son visibles inmediatamente.
              </p>
            </div>
          </div>

          {/* Orphans */}
          {result.orphans.length > 0 && (
            <div className="bg-yellow-950/40 border border-yellow-800 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-200">
                    {result.orphans.length} archivos sin jugador asociado
                  </p>
                  <p className="text-sm text-yellow-300/80 mt-1">
                    Los nombres no coinciden con ningún id_player existente.
                  </p>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto bg-slate-900/50 rounded p-3 text-sm text-slate-300 font-mono">
                {result.orphans.map((f) => (
                  <div key={f}>{f}</div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="bg-red-950/40 border border-red-800 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-200">
                    {result.errors.length} errores
                  </p>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto bg-slate-900/50 rounded p-3 text-sm text-slate-300 font-mono space-y-1">
                {result.errors.map((e, i) => (
                  <div key={i}>
                    <span className="text-red-300">{e.file}</span>
                    <span className="text-slate-500"> — {e.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
