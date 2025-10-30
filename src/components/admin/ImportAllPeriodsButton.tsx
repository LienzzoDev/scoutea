"use client";

import { Upload, CheckCircle, XCircle, Loader2, Terminal, Download, RefreshCw, X, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

import type { StatsPeriod } from "@/lib/utils/stats-period-utils";

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  period?: string;
}

interface PeriodProgress {
  period: StatsPeriod;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  current: number;
  total: number;
  percentage: number;
  success: number;
  failed: number;
  created: number;
  updated: number;
  notFound: number;
}

export default function ImportAllPeriodsButton() {
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'success' | 'info'>('all');
  const [periodProgress, setPeriodProgress] = useState<Record<StatsPeriod, PeriodProgress>>({
    '3m': { period: '3m', label: '3 Meses', status: 'pending', current: 0, total: 0, percentage: 0, success: 0, failed: 0, created: 0, updated: 0, notFound: 0 },
    '6m': { period: '6m', label: '6 Meses', status: 'pending', current: 0, total: 0, percentage: 0, success: 0, failed: 0, created: 0, updated: 0, notFound: 0 },
    '1y': { period: '1y', label: '1 Año', status: 'pending', current: 0, total: 0, percentage: 0, success: 0, failed: 0, created: 0, updated: 0, notFound: 0 },
    '2y': { period: '2y', label: '2 Años', status: 'pending', current: 0, total: 0, percentage: 0, success: 0, failed: 0, created: 0, updated: 0, notFound: 0 },
  });
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      totalSuccess: number;
      totalFailed: number;
      totalCreated: number;
      totalUpdated: number;
      totalNotFound: number;
      periodsCompleted: number;
      periodsTotal: number;
    };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current && showLogs) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  const periods: { value: StatsPeriod; label: string; description: string }[] = [
    { value: '3m', label: '3 Meses', description: 'Estadísticas de los últimos 3 meses' },
    { value: '6m', label: '6 Meses', description: 'Estadísticas de los últimos 6 meses' },
    { value: '1y', label: '1 Año', description: 'Estadísticas del último año' },
    { value: '2y', label: '2 Años', description: 'Estadísticas de los últimos 2 años' },
  ];

  const addLog = (type: LogEntry['type'], message: string, period?: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      period
    }]);
  };

  const handleButtonClick = () => {
    setShowModal(true);
  };

  const handleConfirmImport = () => {
    setShowModal(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar extensión del archivo
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      setResult({
        success: false,
        message: 'Por favor selecciona un archivo Excel (.xlsx, .xls) válido con todas las hojas de períodos'
      });
      return;
    }

    setIsUploading(true);
    setResult(null);
    setLogs([]);
    setShowLogs(true);

    // Reset progress
    setPeriodProgress({
      '3m': { period: '3m', label: '3 Meses', status: 'pending', current: 0, total: 0, percentage: 0, success: 0, failed: 0, created: 0, updated: 0, notFound: 0 },
      '6m': { period: '6m', label: '6 Meses', status: 'pending', current: 0, total: 0, percentage: 0, success: 0, failed: 0, created: 0, updated: 0, notFound: 0 },
      '1y': { period: '1y', label: '1 Año', status: 'pending', current: 0, total: 0, percentage: 0, success: 0, failed: 0, created: 0, updated: 0, notFound: 0 },
      '2y': { period: '2y', label: '2 Años', status: 'pending', current: 0, total: 0, percentage: 0, success: 0, failed: 0, created: 0, updated: 0, notFound: 0 },
    });

    addLog('info', `📁 Archivo seleccionado: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    addLog('info', '📅 Importando TODOS los períodos: 3M, 6M, 1Y, 2Y');
    addLog('info', '🔄 Iniciando importación...');

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);

      addLog('info', '📤 Enviando archivo al servidor...');

      // Enviar al endpoint de importación múltiple
      const response = await fetch(`/api/admin/import-all-periods-stats`, {
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

                // Actualizar estado del período actual
                if (data.period) {
                  const period = data.period as StatsPeriod;

                  if (data.type === 'period_start') {
                    setPeriodProgress(prev => ({
                      ...prev,
                      [period]: { ...prev[period], status: 'processing' }
                    }));
                    addLog('info', `🔄 [${data.periodLabel}] Iniciando importación...`, period);
                  } else if (data.type === 'progress') {
                    setPeriodProgress(prev => ({
                      ...prev,
                      [period]: {
                        ...prev[period],
                        current: data.current,
                        total: data.total,
                        percentage: Math.round((data.current / data.total) * 100)
                      }
                    }));
                    if (data.current % 50 === 0 || data.current === data.total) {
                      addLog('info', `📊 [${data.periodLabel}] Progreso: ${data.current}/${data.total}`, period);
                    }
                  } else if (data.type === 'period_complete') {
                    setPeriodProgress(prev => ({
                      ...prev,
                      [period]: {
                        ...prev[period],
                        status: 'completed',
                        success: data.results.success,
                        failed: data.results.failed,
                        created: data.results.created,
                        updated: data.results.updated,
                        notFound: data.results.notFound,
                        percentage: 100
                      }
                    }));
                    addLog('success', `✅ [${data.periodLabel}] Completado: ${data.results.success} exitosos, ${data.results.failed} fallidos`, period);
                  } else if (data.type === 'period_error') {
                    setPeriodProgress(prev => ({
                      ...prev,
                      [period]: { ...prev[period], status: 'error' }
                    }));
                    addLog('error', `❌ [${data.periodLabel}] Error: ${data.message}`, period);
                  } else if (data.type === 'stats_created') {
                    addLog('success', `🆕 [${data.periodLabel}] Stats creadas: ${data.playerName || data.playerId}`, period);
                  } else if (data.type === 'stats_updated') {
                    addLog('info', `🔄 [${data.periodLabel}] Stats actualizadas: ${data.playerName || data.playerId}`, period);
                  } else if (data.type === 'player_not_found') {
                    addLog('warning', `⚠️ [${data.periodLabel}] Jugador no encontrado: ${data.identifier}`, period);
                  } else if (data.type === 'error') {
                    addLog('error', `⚠️ [${data.periodLabel}] ${data.message}`, period);
                  }
                }

                // Mensajes generales
                if (data.type === 'start') {
                  addLog('info', data.message);
                } else if (data.type === 'info') {
                  addLog('info', data.message);
                } else if (data.type === 'complete') {
                  addLog('success', '🎉 ¡Importación completa de TODOS los períodos finalizada!');
                  addLog('info', data.message);
                  setResult({
                    success: true,
                    message: data.message,
                    details: data.summary
                  });
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
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

  const copyLogsToClipboard = async () => {
    const logsText = logs.map(log =>
      `[${log.timestamp}] [${log.type.toUpperCase()}]${log.period ? ` [${log.period.toUpperCase()}]` : ''} ${log.message}`
    ).join('\n');
    try {
      await navigator.clipboard.writeText(logsText);
      // Mostrar feedback visual temporal
      const button = document.getElementById('copy-logs-btn-all-periods');
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="ml-1">Copiado!</span>';
        setTimeout(() => {
          button.innerHTML = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error('Error al copiar logs:', err);
      alert('Error al copiar los logs al portapapeles');
    }
  };

  const exportLogs = () => {
    const logsText = logs.map(log =>
      `[${log.timestamp}] [${log.type.toUpperCase()}]${log.period ? ` [${log.period.toUpperCase()}]` : ''} ${log.message}`
    ).join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-all-periods-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReload = () => {
    router.refresh();
    window.location.reload();
  };

  const getStatusIcon = (status: PeriodProgress['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
    }
  };

  const getStatusColor = (status: PeriodProgress['status']) => {
    switch (status) {
      case 'pending': return 'text-slate-400';
      case 'processing': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
    }
  };

  return (
    <>
      {/* Botón principal */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleButtonClick}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Importando Todos los Períodos...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Importar TODAS las Stats (3M, 6M, 1Y, 2Y)</span>
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

        {/* Progreso por período */}
        {isUploading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {periods.map(({ value, label }) => {
              const progress = periodProgress[value];
              return (
                <div
                  key={value}
                  className={`bg-[#0a0e14] border rounded-lg p-3 ${
                    progress.status === 'processing' ? 'border-blue-500' :
                    progress.status === 'completed' ? 'border-green-500' :
                    progress.status === 'error' ? 'border-red-500' :
                    'border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(progress.status)}</span>
                      <span className={`font-semibold ${getStatusColor(progress.status)}`}>
                        {label}
                      </span>
                    </div>
                    {progress.total > 0 && (
                      <span className="text-sm text-slate-400">
                        {progress.current}/{progress.total} ({progress.percentage}%)
                      </span>
                    )}
                  </div>

                  {progress.total > 0 && (
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress.status === 'processing' ? 'bg-blue-600' :
                          progress.status === 'completed' ? 'bg-green-600' :
                          progress.status === 'error' ? 'bg-red-600' :
                          'bg-slate-600'
                        }`}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  )}

                  {progress.status === 'completed' && (
                    <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                      <div>✅ Exitosos: {progress.success}</div>
                      <div>🆕 Creados: {progress.created}</div>
                      <div>🔄 Actualizados: {progress.updated}</div>
                      {progress.failed > 0 && <div className="text-red-400">❌ Fallidos: {progress.failed}</div>}
                      {progress.notFound > 0 && <div className="text-yellow-400">⚠️ No encontrados: {progress.notFound}</div>}
                    </div>
                  )}
                </div>
              );
            })}
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
                  <Terminal className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-slate-200 text-lg">Live Import Logs (Todos los períodos)</span>
                  <span className="text-slate-400 text-sm">({filteredLogs.length}/{logs.length} entradas)</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Filtros */}
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value as any)}
                    className="bg-slate-800 text-slate-300 text-sm px-3 py-1.5 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="all">Todos</option>
                    <option value="error">Solo Errores</option>
                    <option value="success">Solo Exitosos</option>
                    <option value="info">Solo Info</option>
                  </select>

                  {/* Botón de copiar */}
                  <button
                    id="copy-logs-btn-all-periods"
                    onClick={copyLogsToClipboard}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-700 text-white rounded hover:bg-purple-600 text-sm transition-colors"
                    title="Copiar logs al portapapeles"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copiar</span>
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
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Contenido scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {filteredLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 hover:bg-slate-800/50 px-3 py-2 rounded transition-colors">
                    <span className="text-slate-500 flex-shrink-0 text-sm font-mono">[{log.timestamp}]</span>
                    {log.period && (
                      <span className="text-purple-400 flex-shrink-0 text-sm font-mono">[{log.period.toUpperCase()}]</span>
                    )}
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
                      <div className="animate-pulse w-2 h-2 bg-purple-500 rounded-full"></div>
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
                            <p>📊 Períodos completados: {result.details.periodsCompleted}/{result.details.periodsTotal}</p>
                            <p>✅ Total exitosos: {result.details.totalSuccess}</p>
                            <p>❌ Total fallidos: {result.details.totalFailed}</p>
                            {result.details.totalCreated > 0 && (
                              <p>🆕 Total estadísticas nuevas: {result.details.totalCreated}</p>
                            )}
                            {result.details.totalUpdated > 0 && (
                              <p>🔄 Total estadísticas actualizadas: {result.details.totalUpdated}</p>
                            )}
                            {result.details.totalNotFound > 0 && (
                              <p>⚠️ Total jugadores no encontrados: {result.details.totalNotFound}</p>
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

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Importar Todas las Temporalidades</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Esta acción importará las estadísticas de <strong>TODOS los períodos</strong> desde un único archivo Excel:
              </p>
              <ul className="space-y-2">
                {periods.map((period) => (
                  <li key={period.value} className="flex items-center gap-2 text-gray-600">
                    <span className="text-purple-600">✓</span>
                    <span><strong>{period.label}:</strong> {period.description}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 text-sm">
                  <strong>Importante:</strong> El archivo Excel debe contener las hojas con nombres: <code>3M</code>, <code>6M</code>, <code>1Y</code>, <code>2Y</code>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Seleccionar Archivo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}