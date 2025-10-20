/**
 * 🎭 POOL DE USER-AGENTS PARA ROTACIÓN
 *
 * Pool diverso de User-Agents actualizados (2024) para simular
 * diferentes navegadores, sistemas operativos y dispositivos.
 */

const USER_AGENTS = [
  // Chrome en Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',

  // Chrome en macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',

  // Firefox en Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',

  // Firefox en macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',

  // Safari en macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',

  // Edge en Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',

  // Chrome en Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // Firefox en Linux
  'Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
]

/**
 * Obtiene un User-Agent aleatorio del pool
 */
export function getRandomUserAgent(): string {
  const randomIndex = Math.floor(Math.random() * USER_AGENTS.length)
  return USER_AGENTS[randomIndex]
}

/**
 * Genera un conjunto de headers HTTP realistas para simular un navegador
 * @param referer - URL de referencia (opcional)
 */
export function getRealisticHeaders(referer?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': getRandomAcceptLanguage(),
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  }

  if (referer) {
    headers['Referer'] = referer
    headers['Sec-Fetch-Site'] = 'same-origin'
  }

  return headers
}

/**
 * Genera un Accept-Language aleatorio para mayor variedad
 */
function getRandomAcceptLanguage(): string {
  const languages = [
    'es-ES,es;q=0.9,en;q=0.8',
    'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
    'es,en-US;q=0.9,en;q=0.8',
    'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
    'es-MX,es;q=0.9,en;q=0.8',
  ]

  const randomIndex = Math.floor(Math.random() * languages.length)
  return languages[randomIndex]
}

/**
 * Genera una pausa aleatoria para simular comportamiento humano
 * @param min - Tiempo mínimo en milisegundos
 * @param max - Tiempo máximo en milisegundos
 * @returns Tiempo de pausa aleatorio
 */
export function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Pausa la ejecución por un tiempo aleatorio
 * @param min - Tiempo mínimo en milisegundos
 * @param max - Tiempo máximo en milisegundos
 */
export async function randomSleep(min: number, max: number): Promise<void> {
  const delay = getRandomDelay(min, max)
  return new Promise(resolve => setTimeout(resolve, delay))
}
