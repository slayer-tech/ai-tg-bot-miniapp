import WebApp from '@twa-dev/sdk'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export function hasTelegramAuth(): boolean {
  return Boolean(WebApp.initData)
}

function authHeader(): string | null {
  const initData = WebApp.initData
  if (!initData) return null
  return `tma ${initData}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = authHeader()
  if (!auth) {
    throw new Error('Откройте приложение через бота в Telegram')
  }
  if (!API_URL) {
    throw new Error('VITE_API_URL не задан при сборке')
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const j = await res.json()
      msg = j.detail || j.message || msg
    } catch {
      msg = (await res.text()) || msg
    }
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
  return res.json() as Promise<T>
}

export type Me = {
  id: number
  username: string | null
  text_credits: number
  image_credits: number
  active_channel_id: number | null
}

export type Channel = {
  id: number
  title: string | null
  username: string | null
  is_bot_connected: boolean
  is_owner: boolean
}

export type Settings = {
  footer: string | null
  watermark_text: string | null
  has_watermark_logo: boolean
  schedule_jitter_enabled: boolean
  slots: string[]
  competitors_count: number
  description: string | null
}

export type Autopilot = {
  enabled: boolean
  paused: boolean
  posts_per_day: number
  weekday_mask: number
  publish_times: string[]
  generation_days: number
  queue_stats: Record<string, number>
}

export type DraftPreview = {
  id: number
  status: string
  text: string
  scheduled_at: string | null
}

export type CalendarWeek = {
  monday: string
  day_counts: Record<string, { scheduled?: number; published?: number } | number>
  drafts_by_day: Record<string, DraftPreview[]>
}

export const api = {
  getMe: () => request<Me>('/api/me'),
  getChannels: () => request<Channel[]>('/api/channels'),
  getActiveChannel: () =>
    request<{ channel: Channel | null }>('/api/channels/active'),
  switchChannel: (id: number) =>
    request<{ ok: boolean }>(`/api/channels/active/${id}`, { method: 'POST' }),
  getSettings: () => request<Settings>('/api/settings'),
  patchFooter: (footer_html: string) =>
    request('/api/settings/footer', {
      method: 'PATCH',
      body: JSON.stringify({ footer_html }),
    }),
  patchDescription: (description: string) =>
    request('/api/settings/description', {
      method: 'PATCH',
      body: JSON.stringify({ description }),
    }),
  patchSlots: (times: string[]) =>
    request<{ ok: boolean; slots: string[] }>('/api/settings/slots', {
      method: 'PATCH',
      body: JSON.stringify({ times }),
    }),
  patchJitter: (enabled: boolean) =>
    request('/api/settings/jitter', {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    }),
  getCompetitors: () =>
    request<{ usernames: string[] }>('/api/settings/competitors'),
  addCompetitor: (username: string) =>
    request('/api/settings/competitors', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),
  removeCompetitor: (username: string) =>
    request(`/api/settings/competitors/${encodeURIComponent(username)}`, {
      method: 'DELETE',
    }),
  getCalendarWeek: (monday?: string) =>
    request<CalendarWeek>(
      `/api/calendar/week${monday ? `?monday=${monday}` : ''}`,
    ),
  getAutopilot: () => request<Autopilot>('/api/autopilot'),
  patchAutopilot: (data: { posts_per_day?: number; generation_days?: number }) =>
    request('/api/autopilot', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  pauseAutopilot: () => request('/api/autopilot/pause', { method: 'POST' }),
  resumeAutopilot: () => request('/api/autopilot/resume', { method: 'POST' }),
  getBilling: () =>
    request<{ text_credits: number; image_credits: number; unlimited: boolean }>(
      '/api/billing',
    ),
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

export function channelName(c: Channel) {
  return c.title || (c.username ? `@${c.username}` : `#${c.id}`)
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function formatWeekRange(mondayIso: string): string {
  const mon = new Date(mondayIso + 'T12:00:00')
  const sun = new Date(mon)
  sun.setDate(sun.getDate() + 6)
  const fmt = (x: Date) =>
    x.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  return `${fmt(mon)} – ${fmt(sun)}`
}

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    scheduled: 'Запланирован',
    published: 'Опубликован',
    draft: 'Черновик',
    failed: 'Ошибка',
    pending: 'В очереди',
    ready: 'Готов',
    generating: 'Генерация',
  }
  return map[s] || s
}

export function statusClass(s: string): string {
  if (s === 'published') return 'badge ok'
  if (s === 'scheduled' || s === 'ready') return 'badge warn'
  if (s === 'failed') return 'badge err'
  return 'badge'
}
