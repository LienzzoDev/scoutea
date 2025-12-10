"use client";

import { Upload, CheckCircle, XCircle, Loader2, Terminal, Download, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export default function ImportTeamsButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'success' | 'info'>('all');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: { success: number; failed: number; created: number; updated: number; errors: string[]; createdTeams: string[] };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auto-scroll logs to bottom ONLY if user is already at the bottom
  useEffect(() => {
    if (logsEndRef.current && logsContainerRef.current && showLogs) {
      const container = logsContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      // Only auto-scroll if user is near the bottom (within 100px)
      if (isNearBottom) {
        logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [logs, showLogs]);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    }]);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar extensión del archivo
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      setResult({
        success: false,
        message: 'Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV válido'
      });
      return;
    }

    setIsUploading(true);
    setResult(null);
    setLogs([]);
    setProgress({ current: 0, total: 0, percentage: 0 });
    setShowLogs(true);

    addLog('info', `📁 Archivo seleccionado: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    addLog('info', '🔄 Iniciando importación...');

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);

      addLog('info', '📤 Enviando archivo al servidor...');

      // Enviar al endpoint con streaming habilitado
      const response = await fetch('/api/admin/import-teams', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        addLog('error', `❌ Error del servidor: ${errorData.error || 'Error desconocido'}`);
        setResult({
          success: false,
          message: errorData.error || 'Error al importar el archivo'
        });
        setIsUploading(false);
        return;
      }

      // Verificar si la respuesta es streaming (SSE) o JSON normal
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('text/event-stream')) {
        // Procesar SSE stream
        addLog('info', '📡 Recibiendo actualizaciones en tiempo real...');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));

                  if (data.type === 'progress') {
                    setProgress({
                      current: data.current,
                      total: data.total,
                      percentage: Math.round((data.current / data.total) * 100)
                    });
                    addLog('info', `📊 Progreso: ${data.current}/${data.total} equipos procesados`);
                  } else if (data.type === 'batch') {
                    addLog('success', `✅ Lote ${data.batchNum}/${data.totalBatches} completado`);
                  } else if (data.type === 'team_created') {
                    addLog('success', `🆕 Equipo creado: ${data.teamName}`);
                  } else if (data.type === 'team_updated') {
                    addLog('info', `🔄 Equipo actualizado: ${data.teamName}`);
                  } else if (data.type === 'error') {
                    addLog('error', `⚠️ ${data.message}`);
                  } else if (data.type === 'complete') {
                    addLog('success', '✅ Importación completada!');
                    addLog('info', '💡 Revisa los logs arriba para ver detalles y errores');
                    setResult({
                      success: true,
                      message: data.message,
                      details: data.results
                    });
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }
        }
      } else {
        // Respuesta JSON tradicional
        const data = await response.json();
        addLog('info', '📥 Procesando respuesta del servidor...');

        if (data.results) {
          setProgress({
            current: data.results.success,
            total: data.results.success + data.results.failed,
            percentage: 100
          });

          addLog('success', `✅ ${data.results.success} equipos procesados exitosamente`);
          if (data.results.created > 0) {
            addLog('success', `🆕 ${data.results.created} equipos nuevos creados`);
          }
          if (data.results.updated > 0) {
            addLog('info', `🔄 ${data.results.updated} equipos actualizados`);
          }
          if (data.results.failed > 0) {
            addLog('error', `❌ ${data.results.failed} equipos fallidos`);
          }
        }

        setResult({
          success: true,
          message: data.message || 'Importación completada exitosamente',
          details: data.results
        });

        addLog('success', '🎉 Importación finalizada!');
        addLog('info', '💡 Revisa los logs y errores antes de recargar');
        addLog('info', '🔄 Haz clic en "Refrescar Lista" cuando estés listo');
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      addLog('error', `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setResult({
        success: false,
        message: 'Error al procesar el archivo. Verifica el formato.'
      });
    } finally {
      setIsUploading(false);
      // Limpiar el input para permitir cargar el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-slate-300';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });

  const exportLogs = () => {
    const logsText = logs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReload = () => {
    router.refresh();
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Botón de importación */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleButtonClick}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#E64A2E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Importando...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Importar Equipos desde Excel (Hoja TEAMS)</span>
            </>
          )}
        </button>
        {logs.length > 0 && (
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            <Terminal className="h-4 w-4" />
            <span>{showLogs ? 'Ocultar' : 'Mostrar'} Logs</span>
          </button>
        )}
      </div>

      {/* Barra de progreso */}
      {isUploading && progress.total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-300">
            <span>Progreso de importación</span>
            <span>{progress.current} / {progress.total} ({progress.percentage}%)</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#FF5733] h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Panel de Logs en Tiempo Real */}
      {showLogs && logs.length > 0 && (
        <div className="bg-[#0a0e14] border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#FF5733]" />
              <span className="font-semibold text-slate-300">Live Import Logs</span>
              <span className="text-slate-500">({filteredLogs.length}/{logs.length} entradas)</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Filtros */}
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value as 'all' | 'error' | 'success' | 'info')}
                className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded border border-slate-600"
              >
                <option value="all">Todos</option>
                <option value="error">Solo Errores</option>
                <option value="success">Solo Exitosos</option>
                <option value="info">Solo Info</option>
              </select>

              {/* Botón de exportar */}
              <button
                onClick={exportLogs}
                className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-xs"
              >
                <Download className="h-3 w-3" />
                Exportar
              </button>
            </div>
          </div>

          <div ref={logsContainerRef} className="max-h-96 overflow-y-auto space-y-1">
            {filteredLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-2 hover:bg-slate-800/50 px-2 py-1 rounded">
                <span className="text-slate-500 flex-shrink-0">[{log.timestamp}]</span>
                <span className={`flex-1 ${getLogColor(log.type)}`}>{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Resultado de la importación */}
      {result && (
        <div
          className={`p-4 rounded-lg border ${
            result.success
              ? 'bg-green-900/20 border-green-700 text-green-300'
              : 'bg-red-900/20 border-red-700 text-red-300'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">{result.message}</p>
                {result.success && (
                  <button
                    onClick={handleReload}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Recargar Página
                  </button>
                )}
              </div>

              {/* Detalles adicionales */}
              {result.details && (
                <div className="mt-2 space-y-1 text-sm">
                  <p>✅ Exitosos: {result.details.success}</p>
                  <p>❌ Fallidos: {result.details.failed}</p>
                  {result.details.created > 0 && (
                    <p>🆕 Equipos nuevos creados: {result.details.created}</p>
                  )}
                  {result.details.updated > 0 && (
                    <p>🔄 Equipos actualizados: {result.details.updated}</p>
                  )}

                  {result.details.createdTeams && result.details.createdTeams.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer hover:underline text-green-400">
                        Ver equipos creados ({result.details.createdTeams.length})
                      </summary>
                      <ul className="mt-2 ml-4 space-y-1 text-xs">
                        {result.details.createdTeams.map((team, index) => (
                          <li key={index} className="list-disc">
                            {team}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {result.details.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer hover:underline">
                        Ver errores ({result.details.errors.length})
                      </summary>
                      <ul className="mt-2 ml-4 space-y-1 text-xs">
                        {result.details.errors.slice(0, 10).map((error, index) => (
                          <li key={index} className="list-disc">
                            {error}
                          </li>
                        ))}
                        {result.details.errors.length > 10 && (
                          <li className="text-slate-400">
                            ... y {result.details.errors.length - 10} errores más
                          </li>
                        )}
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