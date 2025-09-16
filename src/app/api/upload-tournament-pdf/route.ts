import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verificar si las variables de entorno están configuradas
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN no está configurada')
      return NextResponse.json(
        { error: 'Configuración de almacenamiento no disponible. Contacta al administrador.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Verificar que es un PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'El archivo debe ser un PDF' },
        { status: 400 }
      )
    }

    // Verificar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB' },
        { status: 400 }
      )
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const fileName = `torneo-${timestamp}-${file.name}`
    
    console.log('Subiendo archivo:', fileName, 'Tamaño:', file.size)
    
    // Subir archivo a Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
      contentType: 'application/pdf'
    })

    console.log('Archivo subido exitosamente:', blob.url)

    return NextResponse.json({
      url: blob.url,
      filename: fileName,
      size: file.size
    })
  } catch (error) {
    console.error('Error uploading PDF:', error)
    
    // Proporcionar más detalles del error en desarrollo
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}`
      : 'Error interno del servidor al subir el archivo'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
