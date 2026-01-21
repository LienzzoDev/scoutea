/**
 * Constantes relacionadas con redes sociales
 */

/**
 * Lista de dominios de redes sociales conocidas
 */
export const SOCIAL_MEDIA_DOMAINS = [
  'twitter.com',
  'x.com',
  'facebook.com',
  'fb.com',
  'instagram.com',
  'tiktok.com',
  'linkedin.com',
  'threads.net',
  'snapchat.com',
  'pinterest.com',
  'reddit.com',
  'tumblr.com',
  'whatsapp.com',
  'telegram.org',
  't.me',
  'discord.com',
  'discord.gg',
  'twitch.tv',
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'dailymotion.com'
] as const

export type SocialMediaDomain = typeof SOCIAL_MEDIA_DOMAINS[number]

/**
 * Función para detectar si una URL es de una red social
 */
export function isSocialMediaUrl(url: string): boolean {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '')
    return SOCIAL_MEDIA_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain))
  } catch {
    return false
  }
}
