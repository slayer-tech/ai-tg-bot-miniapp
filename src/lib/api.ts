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
    throw new Error('Откройте приложение через бота в Telegram (нужен initData)')
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
    const body = await res.text()
    throw new Error(body || `HTTP ${res.status}`)
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

export const api = {
  getMe: () => request<Me>('/api/me'),
  getChannels: () => request<Channel[]>('/api/channels'),
  getActiveChannel: () =>
    request<{ channel: Channel | null }>('/api/channels/active'),
  switchChannel: (id: number) =>
    request<{ ok: boolean }>(`/api/channels/active/${id}`, { method: 'POST' }),
  getSettings: () => request<Settings>('/api/settings'),
  getCalendarWeek: (monday?: string) =>
    request<{
      monday: string
      text: string
      day_counts: Record<string, number>
    }>(`/api/calendar/week${monday ? `?monday=${monday}` : ''}`),
  getAutopilot: () => request<Autopilot>('/api/autopilot'),
  pauseAutopilot: () => request('/api/autopilot/pause', { method: 'POST' }),
  resumeAutopilot: () => request('/api/autopilot/resume', { method: 'POST' }),
  getBilling: () =>
    request<{ text_credits: number; image_credits: number; unlimited: boolean }>(
      '/api/billing',
    ),
}
