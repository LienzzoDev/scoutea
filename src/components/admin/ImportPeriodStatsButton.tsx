"use client";

import { Upload, CheckCircle, XCircle, Loader2, Terminal } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  results?: { success: number; failed: number; notFound: number; errors: string[] };
}

export default function ImportPeriodStatsButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current && showLogs) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs, showLogs]);

  const addLog = (type: LogEntry['type'], message: string) =>
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), type, message }]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (ext !== '.zip' && ext !== '.xlsx' && ext !== '.xls') {
      setResult({ success: false, message: 'Selecciona un .zip (varios XLSX) o un .xlsx' });
      return;
    }

    // Rechazar antes de subir archivos que superarían el límite del servidor
    const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB
    if (file.size > MAX_FILE_SIZE) {
      setResult({
        success: false,
        message: `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo es 200 MB`
      });
      return;
    }

    setIsUploading(true);
    setResult(null);
    setLogs([]);
    setProgress({ current: 0, total: 0, percentage: 0 });
    setShowLogs(true);
    addLog('info', `📁 Archivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/import-stats-zip', { method: 'POST', body: formData });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        addLog('error', `❌ ${errorData.error || 'Error del servidor'}`);
        setResult({ success: false, message: errorData.error || 'Error al importar' });
        setIsUploading(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let importCompleted = false;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === 'progress') {
                setProgress({ current: data.current, total: data.total, percentage: data.percentage });
              } else if (data.type === 'start' || data.type === 'info') {
                addLog('info', data.message);
              } else if (data.type === 'success') {
                addLog('success', data.message);
              } else if (data.type === 'warning') {
                addLog('warning', data.message);
              } else if (data.type === 'error') {
                addLog('error', data.message);
              } else if (data.type === 'complete') {
                addLog('success', '✅ Importación de stats completada!');
                setResult({ success: true, message: data.message, results: data.results });
                setShowLogs(true);
                importCompleted = true;
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }

      if (!importCompleted) {
        addLog('error', '❌ El stream terminó sin confirmar la importación.');
        setResult({
          success: false,
          message: 'La importación se interrumpió antes de completarse. Revisa los logs y reintenta.'
        });
      }
    } catch (error) {
      addLog('error', `❌ ${error instanceof Error ? error.message : 'Error al procesar'}`);
      setResult({ success: false, message: error instanceof Error ? error.message : 'Error al procesar' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getLogColor = (type: LogEntry['type']) =>
    type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : type === 'warning' ? 'text-yellow-400' : 'text-slate-300';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-[#FF5733] hover:bg-[#E64A2B] text-white border-none disabled:opacity-50"
        >
          {isUploading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando...</>
          ) : (
            <><Upload className="h-4 w-4 mr-2" />Importar Stats (ZIP)</>
          )}
        </Button>
        {logs.length > 0 && (
          <Button onClick={() => setShowLogs(!showLogs)} className="bg-slate-700 hover:bg-slate-600 text-white border-none">
            <Terminal className="h-4 w-4 mr-2" />{showLogs ? 'Ocultar' : 'Mostrar'} Logs
          </Button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept=".zip,.xlsx,.xls" onChange={handleFileChange} className="hidden" />

      {isUploading && progress.total > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-slate-300">
            <span>Progreso</span>
            <span>{progress.current} / {progress.total} ({progress.percentage}%)</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div className="bg-[#FF5733] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress.percentage}%` }} />
          </div>
        </div>
      )}

      {showLogs && logs.length > 0 && (
        <div className="bg-[#0a0e14] border border-slate-700 rounded-lg max-h-64 overflow-y-auto p-3 space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-slate-500 font-mono text-xs">[{log.timestamp}]</span>
              <span className={getLogColor(log.type)}>{log.message}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}

      {result && (
        <div className={`mt-2 p-4 rounded-lg border-2 ${result.success ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
          <div className="flex items-start gap-2">
            {result.success ? <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />}
            <div className="flex-1">
              <p className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>{result.message}</p>
              {result.results && (
                <div className="mt-2 text-sm text-slate-300">
                  <p>✅ Importados: {result.results.success}</p>
                  <p>🔍 Sin jugador en BD: {result.results.notFound}</p>
                  <p>❌ Con error: {result.results.failed - result.results.notFound}</p>
                  {result.results.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-slate-400 hover:text-white">Ver detalles ({result.results.errors.length})</summary>
                      <ul className="mt-2 ml-4 list-disc text-xs text-red-400 max-h-40 overflow-y-auto">
                        {result.results.errors.slice(0, 50).map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
