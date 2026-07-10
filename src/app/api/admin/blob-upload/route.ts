/**
 * 🔑 AUTORIZACIÓN DE SUBIDA DIRECTA A VERCEL BLOB (client upload)
 *
 * El navegador sube archivos grandes DIRECTAMENTE a Vercel Blob (no a esta función), evitando el
 * límite de 4.5 MB del body de las funciones serverless de Vercel. Este endpoint solo emite el token
 * de subida tras verificar que quien sube es admin, y restringe tipo/tamaño del archivo.
 *
 * Flujo: cliente `upload(file, { handleUploadUrl: '/api/admin/blob-upload' })` → aquí validamos y
 * devolvemos el token → el cliente sube a Blob → luego POSTea la URL del blob al importador real.
 *
 * Requiere BLOB_READ_WRITE_TOKEN en el entorno (lo inyecta Vercel al conectar un Blob Store).
 */
import { auth } from '@clerk/nextjs/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 100 MB: holgado para un export completo de la BD (el límite real lo pone el plan de Blob).
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Solo admins pueden obtener un token de subida.
        const { userId, sessionClaims } = await auth()
        if (!userId) throw new Error('No autorizado. Debes iniciar sesión.')
        const role = (sessionClaims?.public_metadata as { role?: string })?.role
        if (role !== 'admin') throw new Error('Acceso denegado. Solo administradores.')

        return {
          allowedContentTypes: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv', // .csv
            'application/octet-stream', // algunos navegadores no ponen mime
          ],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        }
      },
      // El import se dispara aparte con la URL del blob; no hace falta lógica aquí.
      // (En local este callback no se invoca porque Vercel no puede alcanzar localhost.)
      onUploadCompleted: async () => {},
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error autorizando la subida.' },
      { status: 400 }
    )
  }
}
