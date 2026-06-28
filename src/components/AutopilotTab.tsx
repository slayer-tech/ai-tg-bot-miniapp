import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Pause, Play, RocketLaunch } from '@phosphor-icons/react'
import { api, type Autopilot } from '../lib/api'
import { GlassButton, GlassCard, GlassField } from './primitives'

const QUEUE_LABELS: Record<string, string> = {
  pending: 'Ожидание',
  generating: 'Генерация',
  ready: 'Готовы',
  published: 'Опублик.',
  failed: 'Ошибки',
}

export function AutopilotTab({
  autopilot,
  onUpdate,
}: {
  autopilot: Autopilot | null
  onUpdate: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [postsPerDay, setPostsPerDay] = useState(autopilot?.posts_per_day ?? 1)
  const [genDays, setGenDays] = useState(autopilot?.generation_days ?? 7)

  useEffect(() => {
    if (autopilot) {
      setPostsPerDay(autopilot.posts_per_day)
      setGenDays(autopilot.generation_days)
    }
  }, [autopilot])

  if (!autopilot) return null

  const running = autopilot.enabled && !autopilot.paused
  const stats = Object.entries(autopilot.queue_stats).filter(([, v]) => v > 0)

  const saveConfig = async () => {
    setBusy(true)
    try {
      await api.patchAutopilot({ posts_per_day: postsPerDay, generation_days: genDays })
      await onUpdate()
    } finally {
      setBusy(false)
    }
  }

  const toggleRun = async () => {
    setBusy(true)
    try {
      if (running) await api.pauseAutopilot()
      else await api.resumeAutopilot()
      await onUpdate()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <GlassCard title="Autopilot">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`flex h-2.5 w-2.5 rounded-full ${running ? 'bg-[var(--glass-success)]' : 'bg-[var(--glass-hint)]'}`}
          >
            {running && (
              <motion.span
                className="block h-full w-full rounded-full bg-[var(--glass-success)]"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </span>
          <span className="text-sm font-medium">{running ? 'Работает' : 'На паузе'}</span>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 pb-4 border-b border-[var(--glass-border)]">
          {stats.length ? (
            stats.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <span className="font-mono text-xl font-semibold">{v}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--glass-hint)]">
                  {QUEUE_LABELS[k] || k}
                </span>
              </div>
            ))
          ) : (
            <span className="text-sm text-[var(--glass-hint)]">Очередь пуста</span>
          )}
        </div>

        <GlassButton
          onClick={toggleRun}
          disabled={busy}
          full
          trailing={running ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
        >
          {running ? 'Поставить на паузу' : 'Запустить'}
        </GlassButton>
      </GlassCard>

      <GlassCard title="Параметры">
        <GlassField label="Постов в день" hint="1–10">
          <input
            type="range"
            min={1}
            max={10}
            value={postsPerDay}
            onChange={(e) => setPostsPerDay(Number(e.target.value))}
            className="w-full accent-[var(--glass-accent)]"
          />
          <div className="font-mono text-2xl font-semibold mt-1">{postsPerDay}</div>
        </GlassField>

        <GlassField label="Глубина генерации (дней)" hint="Сколько дней вперёд наполнять очередь">
          <select
            className="w-full rounded-xl bg-[color-mix(in_srgb,var(--glass-text)_5%,transparent)] px-4 py-3 text-sm text-[var(--glass-text)] ring-1 ring-[var(--glass-border)]"
            value={genDays}
            onChange={(e) => setGenDays(Number(e.target.value))}
          >
            {[1, 2, 3, 5, 7, 10, 14].map((n) => (
              <option key={n} value={n}>
                {n} дн.
              </option>
            ))}
          </select>
        </GlassField>

        <GlassButton onClick={saveConfig} disabled={busy} full trailing={<RocketLaunch size={16} weight="light" />}>
          Сохранить параметры
        </GlassButton>
      </GlassCard>
    </div>
  )
}
