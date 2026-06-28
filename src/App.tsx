import { useCallback, useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import './App.css'
import { AutopilotTab } from './components/AutopilotTab'
import { PlannerTab } from './components/PlannerTab'
import { ProfileTab } from './components/ProfileTab'
import { SettingsTab } from './components/SettingsTab'
import {
  api,
  channelName,
  hasTelegramAuth,
  type Autopilot,
  type CalendarWeek,
  type Channel,
  type Me,
  type Settings,
} from './lib/api'

type Tab = 'planner' | 'autopilot' | 'settings' | 'account'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'planner', label: 'План', icon: '📅' },
  { id: 'autopilot', label: 'Auto', icon: '🚀' },
  { id: 'settings', label: 'Настройки', icon: '⚙️' },
  { id: 'account', label: 'Профиль', icon: '👤' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('planner')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [billing, setBilling] = useState<{
    text_credits: number
    image_credits: number
    unlimited: boolean
  } | null>(null)
  const [active, setActive] = useState<Channel | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [week, setWeek] = useState<CalendarWeek | null>(null)
  const [weekMonday, setWeekMonday] = useState<string | undefined>()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [autopilot, setAutopilot] = useState<Autopilot | null>(null)

  const loadChannelData = useCallback(async (monday?: string) => {
    const [w, st, ap, bill] = await Promise.all([
      api.getCalendarWeek(monday),
      api.getSettings(),
      api.getAutopilot(),
      api.getBilling(),
    ])
    setWeek(w)
    setWeekMonday(w.monday)
    setSettings(st)
    setAutopilot(ap)
    setBilling(bill)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (!hasTelegramAuth()) {
        setError('Откройте через кнопку «Открыть приложение» в боте')
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
        await loadChannelData(weekMonday)
      } else {
        setWeek(null)
        setSettings(null)
        setAutopilot(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [loadChannelData, weekMonday])

  useEffect(() => {
    try {
      WebApp.ready()
      WebApp.expand()
      WebApp.setHeaderColor('secondary_bg_color')
      WebApp.setBackgroundColor('bg_color')
    } catch {
      /* ok */
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => load()

  const switchChannel = async (id: number) => {
    await api.switchChannel(id)
    WebApp.HapticFeedback?.impactOccurred('light')
    setWeekMonday(undefined)
    await load()
  }

  const changeWeek = async (monday: string) => {
    setWeekMonday(monday)
    try {
      const w = await api.getCalendarWeek(monday)
      setWeek(w)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const noChannel = !active

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Content Planner</h1>
          <p className="header-sub">
            {active ? channelName(active) : 'Канал не выбран'}
          </p>
        </div>
        {active && (
          <span className={`conn ${active.is_bot_connected ? 'ok' : 'bad'}`}>
            {active.is_bot_connected ? '● online' : '● offline'}
          </span>
        )}
      </header>

      <main className="content">
        {error && (
          <div className="error">
            {error}
            <button type="button" className="error-retry" onClick={refresh}>
              Повторить
            </button>
          </div>
        )}
        {loading && <div className="loader">Загрузка…</div>}

        {!loading && noChannel && (
          <section className="card empty-state">
            <span className="empty-icon">📢</span>
            <h2>Подключите канал</h2>
            <p>В чате с ботом нажмите «Подключить канал» и перешлите пост.</p>
          </section>
        )}

        {!loading && !noChannel && tab === 'planner' && (
          <PlannerTab week={week} onWeekChange={changeWeek} />
        )}
        {!loading && !noChannel && tab === 'autopilot' && (
          <AutopilotTab autopilot={autopilot} onUpdate={loadChannelData} />
        )}
        {!loading && tab === 'settings' && (
          <SettingsTab
            settings={settings}
            channels={channels}
            activeId={active?.id ?? null}
            onRefresh={loadChannelData}
            onSwitchChannel={switchChannel}
          />
        )}
        {!loading && tab === 'account' && me && (
          <ProfileTab me={me} billing={billing} onRefresh={refresh} />
        )}
      </main>

      <nav className="tabs">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            className={`tab ${tab === id ? 'active' : ''}`}
            onClick={() => {
              setTab(id)
              WebApp.HapticFeedback?.selectionChanged()
            }}
          >
            <span className="tab-icon">{icon}</span>
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
