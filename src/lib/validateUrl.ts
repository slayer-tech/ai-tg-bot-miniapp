/** Проверка URL inline-кнопки (как на бэкенде). */
export function validateInlineButtonUrl(raw: string): string | null {
  const url = raw.trim()
  if (!url) return null

  let normalized = url
  if (normalized.startsWith('@')) {
    const handle = normalized.slice(1).split('/')[0]
    return handle ? null : 'Укажите @channel или https://…'
  }

  const lower = normalized.toLowerCase()
  if (lower.startsWith('t.me/') || lower.startsWith('telegram.me/')) {
    normalized = `https://${normalized}`
  }

  if (!/^https?:\/\//i.test(normalized)) {
    if (/\s/.test(normalized) || !normalized.includes('.')) {
      return 'Неверная ссылка. Пример: https://t.me/channel или example.com'
    }
    normalized = `https://${normalized}`
  }

  try {
    const parsed = new URL(normalized)
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
      return 'Неверная ссылка. Нужен https://…'
    }
  } catch {
    return 'Неверная ссылка. Проверьте формат URL'
  }

  return null
}

export const MAX_DRAFT_PHOTOS = 10
