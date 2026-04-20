import { auth } from '@clerk/nextjs/server'
import { put } from '@vercel/blob'
import JSZip from 'jszip'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export const maxDuration = 300
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_ZIP_SIZE = 100 * 1024 * 1024 // 100 MB

type SSEMessage =
  | { type: 'start'; total: number }
  | { type: 'progress'; current: number; total: number; filename: string; status: 'updated' | 'orphan' | 'error'; reason?: string }
  | {
      type: 'complete'
      updated: number
      orphans: string[]
      errors: Array<{ file: string; reason: string }>
    }

function sendSSE(controller: ReadableStreamDefaultController, data: SSEMessage) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`))
}

export async function POST(request: NextRequest) {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const userRole = (sessionClaims?.public_metadata as { role?: string })?.role
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
  }
  if (file.size > MAX_ZIP_SIZE) {
    return NextResponse.json({ error: 'El ZIP supera el límite de 100 MB' }, { status: 400 })
  }

  const zip = await JSZip.loadAsync(await file.arrayBuffer()).catch(() => null)
  if (!zip) {
    return NextResponse.json({ error: 'Archivo ZIP inválido o corrupto' }, { status: 400 })
  }

  // Filtrar entradas PNG (ignorar carpetas, archivos macOS __MACOSX/, etc.)
  const entries = Object.values(zip.files).filter(
    (entry) =>
      !entry.dir &&
      !entry.name.startsWith('__MACOSX/') &&
      !entry.name.split('/').pop()!.startsWith('.') &&
      entry.name.toLowerCase().endsWith('.png'),
  )

  const stream = new ReadableStream({
    async start(controller) {
      const orphans: string[] = []
      const errors: Array<{ file: string; reason: string }> = []
      let updated = 0

      sendSSE(controller, { type: 'start', total: entries.length })

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]!
        const filename = entry.name.split('/').pop() || entry.name
        const basename = filename.replace(/\.png$/i, '')
        const id = parseInt(basename, 10)

        if (!Number.isInteger(id) || String(id) !== basename) {
          errors.push({ file: filename, reason: 'Nombre no numérico' })
          sendSSE(controller, {
            type: 'progress',
            current: i + 1,
            total: entries.length,
            filename,
            status: 'error',
            reason: 'Nombre no numérico',
          })
          continue
        }

        try {
          const player = await prisma.jugador.findUnique({
            where: { id_player: id },
            select: { id_player: true },
          })
          if (!player) {
            orphans.push(filename)
            sendSSE(controller, {
              type: 'progress',
              current: i + 1,
              total: entries.length,
              filename,
              status: 'orphan',
            })
            continue
          }

          const buffer = await entry.async('nodebuffer')
          const blob = await put(`players/${id}.png`, buffer, {
            access: 'public',
            addRandomSuffix: false,
            allowOverwrite: true,
            contentType: 'image/png',
          })

          await prisma.jugador.update({
            where: { id_player: id },
            data: { photo_coverage: blob.url },
          })
          updated++
          sendSSE(controller, {
            type: 'progress',
            current: i + 1,
            total: entries.length,
            filename,
            status: 'updated',
          })
        } catch (err) {
          const reason = err instanceof Error ? err.message : 'Error desconocido'
          errors.push({ file: filename, reason })
          sendSSE(controller, {
            type: 'progress',
            current: i + 1,
            total: entries.length,
            filename,
            status: 'error',
            reason,
          })
        }
      }

      sendSSE(controller, { type: 'complete', updated, orphans, errors })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
