/**
 * Utilidades para manejo de imágenes de jugadores
 */

/**
 * Verifica si una URL de imagen es una foto por defecto/placeholder de Transfermarkt
 *
 * @param imageUrl - URL de la imagen a verificar
 * @returns true si es una imagen por defecto, false si es una foto real del jugador
 *
 * @example
 * isDefaultTransfermarktImage("https://img.a.transfermarkt.technology/portrait/header/default.jpg")
 * // returns true
 *
 * isDefaultTransfermarktImage("https://img.a.transfermarkt.technology/portrait/header/28003-1671468604.jpg")
 * // returns false
 */
export function isDefaultTransfermarktImage(imageUrl: string | null | undefined): boolean {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return true; // Considerar null/undefined como "por defecto"
  }

  // Lista de patrones que indican imagen por defecto
  const defaultPatterns = [
    '/default.jpg',
    '/default.png',
    '/default.jpeg',
    '/placeholder.jpg',
    '/placeholder.png',
    '/no-image.jpg',
    '/no-photo.jpg',
    '/avatar-default',
    '/silhouette',
  ];

  // Verificar si la URL contiene algún patrón de imagen por defecto
  const urlLower = imageUrl.toLowerCase();
  return defaultPatterns.some(pattern => urlLower.includes(pattern));
}

/**
 * Verifica si una URL de imagen es válida y no es un placeholder
 *
 * @param imageUrl - URL de la imagen a verificar
 * @returns true si es una imagen válida y real, false en caso contrario
 */
export function isValidPlayerImage(imageUrl: string | null | undefined): boolean {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return false;
  }

  // No es válida si es una imagen por defecto
  if (isDefaultTransfermarktImage(imageUrl)) {
    return false;
  }

  // Verificar que sea una URL válida (http/https o path relativo)
  const isAbsoluteUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
  const isRelativePath = imageUrl.startsWith('/');

  return isAbsoluteUrl || isRelativePath;
}

/**
 * Obtiene la URL de imagen a usar, con fallback a null si es una imagen por defecto
 *
 * @param imageUrl - URL de la imagen
 * @returns La URL si es válida, null si es por defecto
 */
export function getValidImageUrl(imageUrl: string | null | undefined): string | null {
  return isValidPlayerImage(imageUrl) ? imageUrl : null;
}
