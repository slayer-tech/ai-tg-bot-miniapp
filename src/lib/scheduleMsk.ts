/** Русские сообщения об ошибках (API + сеть + браузер). */

function mskParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return {
    day: get('day'),
    month: get('month'),
    year: get('year'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

export function formatScheduleMsk(date = new Date()): string {
  const p = mskParts(date)
  return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}`
}

export function defaultScheduleMsk(dayIso?: string): string {
  if (dayIso) {
    const [y, m, d] = dayIso.split('-')
    const noon = `${d}.${m}.${y} 12:00`
    const now = mskParts()
    const todayIso = `${now.year}-${now.month}-${now.day}`
    if (dayIso === todayIso) {
      return formatScheduleMsk(new Date(Date.now() + 2 * 3600000))
    }
    return noon
  }
  const tomorrow = new Date(Date.now() + 24 * 3600000)
  const p = mskParts(tomorrow)
  return `${p.day}.${p.month}.${p.year} 12:00`
}

export function scheduleFromIso(iso: string): string {
  return formatScheduleMsk(new Date(iso))
}

const NETWORK_RU: Record<string, string> = {
  'load failed':
    'Не удалось связаться с сервером. Перезапустите бота (./scripts/start_dev.sh) и откройте приложение заново',
  'failed to fetch':
    'Нет связи с сервером. Проверьте интернет и что бот запущен',
  'networkerror when attempting to fetch resource.':
    'Сеть недоступна — проверьте интернет',
  'network request failed': 'Ошибка сети — попробуйте позже',
  'auth required': 'Откройте приложение через бота в Telegram',
  'media load failed': 'Не удалось загрузить картинку',
  'the internet connection appears to be offline.': 'Нет интернета',
}

const ERROR_RU: Record<string, string> = {
  past: 'Это время уже прошло по Москве — укажите дату и время в будущем',
  empty: 'Укажите дату и время',
  'bad format': 'Неверный формат. Нужно: ДД.ММ.ГГГГ ЧЧ:ММ (по Москве)',
  'wrong separator': 'Используйте точки в дате: 28.06.2026 15:30',
}

const HTTP_RU: Record<number, string> = {
  401: 'Сессия истекла — закройте и откройте приложение через бота',
  403: 'Доступ запрещён',
  404: 'Не найдено',
  402: 'Недостаточно кредитов',
  500: 'Ошибка на сервере — попробуйте позже',
  502: 'Сервер недоступен — перезапустите бота и tunnel',
  503: 'Сервер временно недоступен',
  504: 'Таймаут сервера',
}

const API_RU: Record<string, string> = {
  'channel disconnected': 'Канал отключён — переподключите в боте',
  'already published': 'Пост уже опубликован',
  'invalid button url': 'Некорректная ссылка для кнопки',
  'invalid button': 'Некорректная кнопка — проверьте URL и текст',
  'time must be in the future (msk)': 'Время должно быть в будущем по Москве',
  'draft not found': 'Черновик не найден',
  'no active channel. connect one in the bot chat.': 'Канал не выбран — подключите в боте',
  'authorization: tma <initdata> required': 'Откройте приложение через бота',
  'cannot change media on published post': 'Нельзя менять картинку у опубликованного поста',
  'published post cannot be edited': 'Опубликованный пост нельзя редактировать',
  'add text or image before publish': 'Добавьте текст или картинку перед публикацией',
}

export function humanApiError(raw: string): string {
  const trimmed = raw.trim()
  const key = trimmed.toLowerCase()

  if (ERROR_RU[key]) return ERROR_RU[key]
  if (NETWORK_RU[key]) return NETWORK_RU[key]
  if (API_RU[key]) return API_RU[key]

  const httpMatch = key.match(/^http\s*(\d{3})$/)
  if (httpMatch) {
    const code = Number(httpMatch[1])
    return HTTP_RU[code] || `Ошибка сервера (${code})`
  }

  const plain = trimmed.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  const plainKey = plain.toLowerCase()
  if (ERROR_RU[plainKey]) return ERROR_RU[plainKey]
  if (NETWORK_RU[plainKey]) return NETWORK_RU[plainKey]
  if (API_RU[plainKey]) return API_RU[plainKey]

  if (/[а-яА-ЯёЁ]/.test(plain)) return plain

  for (const [en, ru] of Object.entries({ ...NETWORK_RU, ...API_RU })) {
    if (key.includes(en)) return ru
  }

  return plain || 'Что-то пошло не так — попробуйте ещё раз'
}

export function humanError(err: unknown): string {
  if (err instanceof Error) return humanApiError(err.message)
  return humanApiError(String(err))
}
