import { useCallback, useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { MegaphoneSimple } from '@phosphor-icons/react'
import { IslandNav, type TabId } from './components/IslandNav'
import { AutopilotTab } from './components/AutopilotTab'
import { CreatePostDialog } from './components/CreatePostDialog'
import { PlannerTab } from './components/PlannerTab'
import { PostEditorSheet } from './components/PostEditorSheet'
import { ProfileTab } from './components/ProfileTab'
import { SettingsTab } from './components/SettingsTab'
import {
  AppSkeleton,
  EmptyState,
  ErrorBanner,
  MeshBackground,
} from './components/primitives'
import {
  api,
  channelName,
  hasTelegramAuth,
  humanError,
  type Autopilot,
  type CalendarWeek,
  type Channel,
  type Me,
  type Settings,
} from './lib/api'

export default function App() {
  const [tab, setTab] = useState<TabId>('planner')
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
  const [editDraftId, setEditDraftId] = useState<number | null>(null)
  const [createDay, setCreateDay] = useState<string | undefined>()
  const [showCreate, setShowCreate] = useState(false)
  const [draftsVersion, setDraftsVersion] = useState(0)

  const loadChannelData = useCallback(async (monday?: string) => {
    const [w, st, ap, bill] = await Promise.all([
      api.getCalendarWeek(monday),
      api.getSettings(),
      api.getAutopilot(),
      api.getBilling().catch(() => null),
    ])
    setWeek(w)
    setWeekMonday(w.monday)
    setSettings(st)
    setAutopilot(ap)
    if (bill) setBilling(bill)
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
      setError(humanError(e))
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
      setError(humanError(e))
    }
  }

  const noChannel = !active

  return (
    <div className="relative flex min-h-[100dvh] flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <MeshBackground />

      <header className="mx-4 mt-3 flex items-start justify-between gap-3 rounded-2xl bg-[color-mix(in_srgb,var(--glass-bg-elevated)_88%,transparent)] px-4 py-3 ring-1 ring-[var(--glass-border)] backdrop-blur-xl">
        <div>
          <h1 className="m-0 text-lg font-semibold tracking-tight">Content Planner</h1>
          <p className="m-0 mt-0.5 text-xs text-[var(--glass-hint)]">
            {active ? channelName(active) : 'Канал не выбран'}
          </p>
        </div>
        {active && (
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
              active.is_bot_connected
                ? 'text-[var(--glass-success)] bg-[color-mix(in_srgb,var(--glass-success)_12%,transparent)]'
                : 'text-[var(--glass-danger)] bg-[color-mix(in_srgb,var(--glass-danger)_12%,transparent)]'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                active.is_bot_connected ? 'bg-[var(--glass-success)] animate-pulse' : 'bg-[var(--glass-danger)]'
              }`}
            />
            {active.is_bot_connected ? 'онлайн' : 'офлайн'}
          </span>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        {error && <ErrorBanner message={error} onRetry={refresh} />}
        {loading && <AppSkeleton />}

        {!loading && noChannel && (
          <EmptyState
            icon={MegaphoneSimple}
            title="Подключите канал"
            description="В чате с ботом нажмите «Подключить канал» и перешлите пост."
          />
        )}

        {!loading && !noChannel && tab === 'planner' && (
          <PlannerTab
            week={week}
            onWeekChange={changeWeek}
            onOpenDraft={(id) => setEditDraftId(id)}
            onCreatePost={(day) => {
              setCreateDay(day)
              setShowCreate(true)
            }}
            refreshKey={draftsVersion}
          />
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

      <IslandNav active={tab} onChange={setTab} />

      {showCreate && (
        <CreatePostDialog
          defaultDay={createDay}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false)
            setEditDraftId(id)
          }}
        />
      )}

      {editDraftId !== null && (
        <PostEditorSheet
          draftId={editDraftId}
          defaultDay={createDay}
          onClose={() => setEditDraftId(null)}
          onSaved={() => {
            loadChannelData(weekMonday)
            setDraftsVersion((v) => v + 1)
          }}
        />
      )}
    </div>
  )
}
