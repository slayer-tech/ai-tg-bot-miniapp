import { useCallback, useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import './App.css'
import {
  api,
  hasTelegramAuth,
  type Autopilot,
  type Channel,
  type Me,
  type Settings,
} from './lib/api'

type Tab = 'planner' | 'autopilot' | 'settings' | 'account'

function channelName(c: Channel) {
  return c.title || (c.username ? `@${c.username}` : `#${c.id}`)
}

export default function App() {
  const [tab, setTab] = useState<Tab>('planner')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [active, setActive] = useState<Channel | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [calendarText, setCalendarText] = useState('')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [autopilot, setAutopilot] = useState<Autopilot | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (!hasTelegramAuth()) {
        setError(
          'Откройте через кнопку «Открыть приложение» в боте Telegram. В обычном браузере API недоступен.',
        )
        return
      }
      const [meData, chList, activeData] = await Promise.all([
        api.getMe(),
        api.getChannels(),
        api.getActiveChannel(),
      ])
      setMe(meData)
      setChannels(chList)
      setActive(activeData.channel)

      if (activeData.channel) {
        const [week, st, ap] = await Promise.all([
          api.getCalendarWeek(),
          api.getSettings(),
          api.getAutopilot(),
        ])
        setCalendarText(week.text)
        setSettings(st)
        setAutopilot(ap)
      } else {
        setCalendarText('')
        setSettings(null)
        setAutopilot(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    try {
      WebApp.ready()
      WebApp.expand()
    } catch {
      /* вне Telegram — ok */
    }
    load()
  }, [load])

  const switchChannel = async (id: number) => {
    try {
      await api.switchChannel(id)
      WebApp.HapticFeedback?.impactOccurred('light')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const toggleAutopilot = async () => {
    if (!autopilot) return
    try {
      if (autopilot.paused || !autopilot.enabled) {
        await api.resumeAutopilot()
      } else {
        await api.pauseAutopilot()
      }
      const ap = await api.getAutopilot()
      setAutopilot(ap)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const noChannel = !active

  return (
    <div className="app">
      <header className="header">
        <h1>AI Content Planner</h1>
        <p>
          {active
            ? channelName(active)
            : 'Подключите канал в чате с ботом'}
        </p>
      </header>

      <main className="content">
        {error && <div className="error">{error}</div>}
        {loading && <p className="muted">Загрузка…</p>}

        {!loading && tab === 'planner' && (
          <>
            {noChannel ? (
              <div className="card">
                <h2>Нет активного канала</h2>
                <p className="muted">
                  В чате с ботом нажмите «Подключить канал», затем вернитесь
                  сюда.
                </p>
              </div>
            ) : (
              <div className="card">
                <h2>Календарь</h2>
                <pre className="pre">{calendarText || 'Пусто'}</pre>
              </div>
            )}
          </>
        )}

        {!loading && tab === 'autopilot' && (
          <div className="card">
            <h2>Autopilot</h2>
            {noChannel ? (
              <p className="muted">Сначала подключите канал.</p>
            ) : autopilot ? (
              <>
                <p className="muted">
                  {autopilot.enabled && !autopilot.paused
                    ? '✅ Работает'
                    : '⏸ На паузе'}
                  {' · '}
                  {autopilot.posts_per_day} пост/день · очередь:{' '}
                  {JSON.stringify(autopilot.queue_stats)}
                </p>
                <button type="button" className="btn" onClick={toggleAutopilot}>
                  {autopilot.paused || !autopilot.enabled
                    ? 'Запустить'
                    : 'Пауза'}
                </button>
              </>
            ) : null}
          </div>
        )}

        {!loading && tab === 'settings' && (
          <>
            {settings ? (
              <div className="card">
                <h2>Настройки канала</h2>
                <p className="muted">
                  Конкуренты: {settings.competitors_count}
                  <br />
                  Слоты: {settings.slots.join(', ') || '—'}
                  <br />
                  Джиттер: {settings.schedule_jitter_enabled ? 'вкл' : 'выкл'}
                </p>
              </div>
            ) : (
              <div className="card">
                <p className="muted">Нет активного канала.</p>
              </div>
            )}
            <div className="card">
              <h2>Каналы</h2>
              <ul className="channel-list">
                {channels.map((c) => (
                  <li key={c.id}>
                    <span>{channelName(c)}</span>
                    {c.id === active?.id ? (
                      <span className="muted">активный</span>
                    ) : (
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => switchChannel(c.id)}
                      >
                        Выбрать
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {!loading && tab === 'account' && me && (
          <div className="card">
            <h2>Аккаунт</h2>
            <p className="muted">
              ID: {me.id}
              {me.username ? ` · @${me.username}` : ''}
              <br />
              Текст: {me.text_credits} · Картинки: {me.image_credits}
            </p>
            <button type="button" className="btn secondary" onClick={load}>
              Обновить
            </button>
          </div>
        )}
      </main>

      <nav className="tabs">
        {(
          [
            ['planner', 'План'],
            ['autopilot', 'Auto'],
            ['settings', 'Настр.'],
            ['account', 'Профиль'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
