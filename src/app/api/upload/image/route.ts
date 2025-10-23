import { auth } from '@clerk/nextjs/server'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
    }

    // Validar tipo de archivo (imágenes y videos)
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    const allValidTypes = [...validImageTypes, ...validVideoTypes]

    if (!allValidTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF) o videos (MP4, WebM, MOV)'
      }, { status: 400 })
    }

    // Validar tamaño según tipo (5MB para imágenes, 50MB para videos)
    const isVideo = validVideoTypes.includes(file.type)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024 // 50MB para videos, 5MB para imágenes
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `El archivo es demasiado grande. Máximo ${isVideo ? '50MB para videos' : '5MB para imágenes'}`
      }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const filename = `reports/${userId}/${timestamp}-${randomString}.${extension}`

    // Subir a Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false
    })

    return NextResponse.json({
      success: true,
      url: blob.url
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      {
        error: 'Error al subir el archivo',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
