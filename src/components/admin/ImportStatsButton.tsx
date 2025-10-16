"use client";

import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ImportStatsButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: { success: number; failed: number; created: number; updated: number; errors: string[]; createdPlayers: string[] };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);

      // Enviar al endpoint
      const response = await fetch('/api/admin/import-stats', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Importación completada exitosamente',
          details: data.results
        });

        // Recargar la página después de 2 segundos para mostrar los datos actualizados
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || 'Error al importar el archivo'
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
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
              <span>Importar Estadísticas XLS</span>
            </>
          )}
        </button>
      </div>

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
              <p className="font-semibold">{result.message}</p>

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
  );
}
