/** Проверка URL inline-кнопки (синхронно с бэкендом). */
const TME_HOSTS = new Set(['t.me', 'telegram.me'])
const TG_USERNAME = /^[a-zA-Z0-9_]{3,32}$/
const ASCII_DOMAIN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i
const INVALID_URL = 'Неверная ссылка. Пример: https://t.me/channel или example.com'

function isValidTgUsername(name: string): boolean {
  return Boolean(name && TG_USERNAME.test(name))
}

function isPlausibleButtonHost(host: string): boolean {
  const h = host.toLowerCase().split(':')[0]
  if (!h || h.includes(' ') || !/^[\x00-\x7F]+$/.test(h)) return false
  if (h.includes('xn--')) return false
  if (TME_HOSTS.has(h)) return true
  return ASCII_DOMAIN.test(h)
}

export function validateInlineButtonUrl(raw: string): string | null {
  const url = raw.trim()
  if (!url) return null

  if (url.startsWith('@')) {
    const handle = url.slice(1).split('/')[0]
    return isValidTgUsername(handle) ? null : 'Неверный @channel — только латиница, цифры и _'
  }

  let normalized = url
  const lower = normalized.toLowerCase()
  if (lower.startsWith('t.me/') || lower.startsWith('telegram.me/')) {
    normalized = `https://${normalized}`
  }

  if (!/^https?:\/\//i.test(normalized)) {
    if (/\s/.test(normalized) || !normalized.includes('.')) {
      return INVALID_URL
    }
    normalized = `https://${normalized}`
  }

  if (!/^[\x00-\x7F]+$/.test(normalized)) {
    return 'Ссылка только латиницей — без кириллицы в адресе'
  }

  try {
    const parsed = new URL(normalized)
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
      return INVALID_URL
    }
    const host = parsed.hostname.toLowerCase()
    if (!isPlausibleButtonHost(host)) {
      return INVALID_URL
    }
    if (TME_HOSTS.has(host)) {
      const path = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/')[0]
      if (!isValidTgUsername(path)) {
        return 'Укажите канал: t.me/username или @channel'
      }
    }
  } catch {
    return INVALID_URL
  }

  return null
}

export const MAX_DRAFT_PHOTOS_GALLERY = 10
export const MAX_DRAFT_PHOTOS_WITH_TEXT = 1
/** @deprecated use MAX_DRAFT_PHOTOS_GALLERY */
export const MAX_DRAFT_PHOTOS = MAX_DRAFT_PHOTOS_GALLERY

export function maxPhotosForDraft(hasText: boolean): number {
  return hasText ? MAX_DRAFT_PHOTOS_WITH_TEXT : MAX_DRAFT_PHOTOS_GALLERY
}
