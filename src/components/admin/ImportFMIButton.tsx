"use client";

import { Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState, useRef } from "react";

import { Button } from "@/components/ui/button";

interface ImportResult {
  success: boolean;
  message: string;
  results?: {
    success: number;
    failed: number;
    errors: string[];
  };
}

export default function ImportFMIButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar que sea un archivo JSON
    if (!file.name.endsWith('.json')) {
      setResult({
        success: false,
        message: 'Por favor selecciona un archivo JSON válido'
      });
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      // Leer el archivo
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);

      // Enviar al endpoint
      const response = await fetch('/api/admin/import-fmi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          results: data.results
        });

        // Recargar la página después de 2 segundos para mostrar los cambios
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || 'Error al importar los datos'
        });
      }
    } catch (error) {
      console.error('Error importing FMI data:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error al procesar el archivo'
      });
    } finally {
      setIsUploading(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Botón principal */}
      <Button
        onClick={handleButtonClick}
        disabled={isUploading}
        className="bg-[#FF5733] hover:bg-[#E64A2B] text-white border-none disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Importando...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Importar FMI JSON
          </>
        )}
      </Button>

      {/* Input oculto para seleccionar archivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Resultado de la importación */}
      {result && (
        <div
          className={`mt-2 p-4 rounded-lg border-2 ${
            result.success
              ? 'bg-green-900/20 border-green-700'
              : 'bg-red-900/20 border-red-700'
          }`}
        >
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  result.success ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {result.message}
              </p>

              {result.results && (
                <div className="mt-2 text-sm text-slate-300">
                  <p>✅ Exitosos: {result.results.success}</p>
                  <p>❌ Fallidos: {result.results.failed}</p>

                  {result.results.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-slate-400 hover:text-white">
                        Ver errores ({result.results.errors.length})
                      </summary>
                      <ul className="mt-2 ml-4 list-disc text-xs text-red-400 max-h-40 overflow-y-auto">
                        {result.results.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
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
