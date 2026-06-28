/** Московское время для поля расписания (ДД.ММ.ГГГГ ЧЧ:ММ). */

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
      const in2h = formatScheduleMsk(new Date(Date.now() + 2 * 3600000))
      return in2h
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

const ERROR_RU: Record<string, string> = {
  past: 'Это время уже прошло по Москве — укажите дату и время в будущем',
  empty: 'Укажите дату и время',
  'bad format': 'Неверный формат. Нужно: ДД.ММ.ГГГГ ЧЧ:ММ (по Москве)',
  'wrong separator': 'Используйте точки в дате: 28.06.2026 15:30',
}

export function humanApiError(raw: string): string {
  const key = raw.trim().toLowerCase()
  if (ERROR_RU[key]) return ERROR_RU[key]
  const plain = raw.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  if (ERROR_RU[plain.toLowerCase()]) return ERROR_RU[plain.toLowerCase()]
  const ruMarkers = /[а-яА-ЯёЁ]/
  if (ruMarkers.test(plain)) return plain
  const map: Record<string, string> = {
    'channel disconnected': 'Канал отключён — переподключите в боте',
    'already published': 'Пост уже опубликован',
    'invalid button url': 'Некорректная ссылка для кнопки',
    'invalid button': 'Некорректная кнопка — проверьте URL и текст',
    'time must be in the future (msk)': 'Время должно быть в будущем по Москве',
    'draft not found': 'Черновик не найден',
    'no active channel. connect one in the bot chat.': 'Канал не выбран — подключите в боте',
  }
  return map[key] || map[plain.toLowerCase()] || plain || raw
}
