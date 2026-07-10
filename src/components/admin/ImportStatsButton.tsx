"use client";

import { upload } from "@vercel/blob/client";
import { Upload, CheckCircle, XCircle, Loader2, Terminal, Download, RefreshCw, Settings, Copy } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'debug';
  message: string;
}

export default function ImportStatsButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'success' | 'info' | 'debug'>('all');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: { success: number; failed: number; created: number; updated: number; skipped?: number; errors: string[]; createdPlayers: string[] };
  } | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [maxRows, setMaxRows] = useState<number | null>(null);
  const [maxRowsInput, setMaxRowsInput] = useState<string>('');
  const [skipExisting, setSkipExisting] = useState<boolean>(false);
  const [logsCopied, setLogsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current && showLogs) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    }]);
  };

  // 🔢 Recálculo automático de campos derivados (edad, nacionalidad, normalizaciones)
  // Se dispara solo al terminar la importación, sin que el admin ejecute scripts.
  const runRecalculation = async () => {
    addLog('info', '🔢 Iniciando recálculo automático de campos derivados...');
    setProgress({ current: 0, total: 0, percentage: 0 });

    try {
      const response = await fetch('/api/admin/recalculate', { method: 'POST' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        addLog('error', `❌ Error al recalcular: ${errorData.error || 'Error desconocido'}`);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) return;

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

            if (data.type === 'recalc_progress') {
              setProgress({
                current: data.current,
                total: data.total,
                percentage: data.percentage,
              });
            } else if (data.type === 'info') {
              addLog('info', data.message);
            } else if (data.type === 'success') {
              addLog('success', data.message);
            } else if (data.type === 'error') {
              addLog('error', data.message);
            } else if (data.type === 'recalc_complete') {
              addLog('success', data.message);
              addLog('info', '🎉 Todos los campos derivados se han completado automáticamente.');
            }
          } catch (e) {
            console.error('Error parsing recalc SSE data:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error during recalculation:', error);
      addLog('error', `❌ Error en el recálculo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
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

    // Validar tamaño antes de subir. La subida va vía Vercel Blob (no por el body de la función),
    // así que el tope real lo pone el Blob Store; 100 MB cubre de sobra un export completo de la BD.
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_FILE_SIZE) {
      setResult({
        success: false,
        message: `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo es 100 MB`
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
      if (maxRows !== null) {
        addLog('info', `⚙️ Límite configurado: ${maxRows} filas máximo`);
      }
      if (skipExisting) {
        addLog('info', '⏭️ Modo retomar activo: los jugadores ya existentes se saltarán.');
      }

      // 1) Subir el archivo DIRECTAMENTE a Vercel Blob. Esto evita el límite de 4.5 MB del body de
      //    las funciones serverless de Vercel (la causa del error "Request Entity Too Large").
      addLog('info', '☁️ Subiendo archivo al almacenamiento...');
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/blob-upload',
        ...(file.type ? { contentType: file.type } : {}),
      });
      addLog('success', '✅ Archivo subido. Procesando en el servidor...');

      // 2) Disparar el import pasando solo la URL del blob (JSON pequeño, sin límite de tamaño).
      const response = await fetch('/api/admin/import-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blobUrl: blob.url,
          filename: file.name,
          maxRows,
          skipExisting,
        }),
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
        let importCompleted = false;

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
                      percentage: data.total > 0 ? Math.round((data.current / data.total) * 100) : 0
                    });
                    addLog('info', `📊 Progreso: ${data.current}/${data.total} jugadores procesados`);
                  } else if (data.type === 'batch') {
                    addLog('success', `✅ Lote ${data.batchNum}/${data.totalBatches} completado`);
                  } else if (data.type === 'player_created') {
                    addLog('success', `🆕 Jugador creado: ${data.playerName}`);
                  } else if (data.type === 'player_updated') {
                    addLog('info', `🔄 Jugador actualizado: ${data.playerName}`);
                  } else if (data.type === 'error') {
                    addLog('error', `⚠️ ${data.message}`);
                  } else if (data.type === 'debug') {
                    addLog('debug', data.message);
                  } else if (data.type === 'complete') {
                    addLog('success', '✅ Importación completada!');
                    setResult({
                      success: true,
                      message: data.message,
                      details: data.results
                    });
                    // Abrir el modal de logs automáticamente al finalizar
                    setShowLogs(true);
                    importCompleted = true;
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }
        }

        // 🔢 Tras la importación, recalcular automáticamente los campos derivados
        if (importCompleted) {
          await runRecalculation();
          addLog('info', '💡 Revisa el resumen de resultados abajo y recarga la página.');
        } else {
          // El stream terminó sin evento 'complete' (conexión cortada o error
          // no reportado): antes esto se quedaba sin resultado ni error visible.
          addLog('error', '❌ El stream terminó sin confirmar la importación.');
          setResult({
            success: false,
            message: 'La importación se interrumpió antes de completarse. Revisa los logs y reintenta.'
          });
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

          addLog('success', `✅ ${data.results.success} jugadores procesados exitosamente`);
          if (data.results.created > 0) {
            addLog('success', `🆕 ${data.results.created} jugadores nuevos creados`);
          }
          if (data.results.updated > 0) {
            addLog('info', `🔄 ${data.results.updated} jugadores actualizados`);
          }
          if (data.results.failed > 0) {
            addLog('error', `❌ ${data.results.failed} jugadores fallidos`);
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
    setShowConfigDialog(true);
  };

  const handleConfirmConfig = () => {
    const parsed = maxRowsInput.trim() === '' ? null : parseInt(maxRowsInput);
    setMaxRows(parsed && !isNaN(parsed) && parsed > 0 ? parsed : null);
    setShowConfigDialog(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'debug': return 'text-blue-400';
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
    a.download = `import-stats-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLogsToClipboard = async () => {
    const logsText = logs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
    try {
      await navigator.clipboard.writeText(logsText);
      // Feedback vía estado React (manipular innerHTML choca con el render)
      setLogsCopied(true);
      setTimeout(() => setLogsCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar logs:', err);
      alert('Error al copiar los logs al portapapeles');
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Diálogo de configuración */}
      {showConfigDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#131921] border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-[#FF5733]" />
              <h3 className="text-lg font-semibold text-slate-200">Configurar Importación</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Límite de filas (opcional)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Dejar vacío para importar todas"
                  value={maxRowsInput}
                  onChange={(e) => setMaxRowsInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0e14] border border-slate-600 rounded text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Ej: 100 para importar solo las primeras 100 filas
                </p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipExisting}
                  onChange={(e) => setSkipExisting(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-[#0a0e14] text-[#FF5733] focus:ring-[#FF5733]"
                />
                <span className="text-sm text-slate-300">
                  Saltar jugadores ya importados
                  <span className="block text-xs text-slate-400 mt-0.5">
                    Útil para retomar tras un cuelgue: los jugadores ya existentes en BD no se vuelven a procesar.
                  </span>
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowConfigDialog(false);
                    setMaxRowsInput('');
                  }}
                  className="px-4 py-2 bg-slate-700 text-slate-200 rounded hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmConfig}
                  className="px-4 py-2 bg-[#FF5733] text-white rounded hover:bg-[#E64A2E] transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <span>Importar Jugadores</span>
            </>
          )}
        </button>
        {maxRows !== null && !isUploading && (
          <span className="text-xs text-slate-400 px-2 py-1 bg-slate-800 rounded">
            Límite: {maxRows} filas
          </span>
        )}
        {skipExisting && !isUploading && (
          <span className="text-xs text-slate-400 px-2 py-1 bg-slate-800 rounded">
            Saltar existentes ON
          </span>
        )}
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

      {/* Panel de Logs en Tiempo Real - Modal Popup */}
      {showLogs && logs.length > 0 && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLogs(false)}
        >
          <div
            className="bg-[#0a0e14] border border-slate-700 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-[#FF5733]" />
                <span className="font-semibold text-slate-200 text-lg">Live Import Logs</span>
                <span className="text-slate-400 text-sm">({filteredLogs.length}/{logs.length} entradas)</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Filtros */}
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value as any)}
                  className="bg-slate-800 text-slate-300 text-sm px-3 py-1.5 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                >
                  <option value="all">Todos</option>
                  <option value="error">Solo Errores</option>
                  <option value="success">Solo Exitosos</option>
                  <option value="info">Solo Info</option>
                  <option value="debug">Solo Debug</option>
                </select>

                {/* Botón de copiar */}
                <button
                  onClick={copyLogsToClipboard}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-700 text-white rounded hover:bg-blue-600 text-sm transition-colors"
                  title="Copiar logs al portapapeles"
                >
                  <Copy className="h-4 w-4" />
                  <span>{logsCopied ? '¡Copiado!' : 'Copiar'}</span>
                </button>

                {/* Botón de exportar */}
                <button
                  onClick={exportLogs}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 text-sm transition-colors"
                  title="Descargar logs como archivo .txt"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>

                {/* Botón de cerrar */}
                <button
                  onClick={() => setShowLogs(false)}
                  className="flex items-center justify-center w-8 h-8 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
                  title="Cerrar logs"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>
            </div>

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {filteredLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 hover:bg-slate-800/50 px-3 py-2 rounded transition-colors">
                  <span className="text-slate-500 flex-shrink-0 text-sm font-mono">[{log.timestamp}]</span>
                  <span className={`flex-1 ${getLogColor(log.type)} text-sm`}>{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            {/* Footer con estadísticas y resultados */}
            <div className="border-t border-slate-700 bg-[#080c11]">
              {/* Estadísticas de logs */}
              <div className="p-3 flex items-center justify-between text-xs text-slate-400">
                <span>Total de logs: {logs.length}</span>
                {isUploading && (
                  <span className="flex items-center gap-2">
                    <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                    Importación en progreso...
                  </span>
                )}
              </div>

              {/* Resultado de la importación (si existe) */}
              {result && (
                <div className={`mx-3 mb-3 p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-900/20 border-green-700 text-green-300'
                    : 'bg-red-900/20 border-red-700 text-red-300'
                }`}>
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
                            <p>🆕 Jugadores nuevos creados: {result.details.created}</p>
                          )}
                          {result.details.updated > 0 && (
                            <p>🔄 Jugadores actualizados: {result.details.updated}</p>
                          )}
                          {(result.details.skipped ?? 0) > 0 && (
                            <p>⏭️ Saltados (ya existentes): {result.details.skipped}</p>
                          )}

                          {result.details.createdPlayers && result.details.createdPlayers.length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer hover:underline text-green-400">
                                Ver jugadores creados ({result.details.createdPlayers.length})
                              </summary>
                              <ul className="mt-2 ml-4 space-y-1 text-xs">
                                {result.details.createdPlayers.map((player, index) => (
                                  <li key={index} className="list-disc">
                                    {player}
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
          </div>
        </div>
      )}
    </div>
  );
}
