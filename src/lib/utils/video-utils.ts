/**
 * Utilidades para manejo de URLs de video
 */

/**
 * Convierte URLs de YouTube a formato embebido
 * Soporta formatos: watch, youtu.be, embed, v
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null

  try {
    // Patrones de URL de YouTube
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
      /youtube\.com\/v\/([^&\s]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }

    // Si no es YouTube, devolver la URL original
    return url
  } catch {
    return url
  }
}

/**
 * Verifica si una URL es de YouTube
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false
  return url.includes('youtube.com') || url.includes('youtu.be')
}

/**
 * Extrae el ID del video de una URL de YouTube
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null

  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
      /youtube\.com\/v\/([^&\s]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  } catch {
    return null
  }
}
