import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, RocketLaunch } from '@phosphor-icons/react'
import { api, type Autopilot } from '../lib/api'
import { GlassButton, GlassCard } from './primitives'

const QUEUE_LABELS: Record<string, string> = {
  pending: 'Ожидание',
  generating: 'Генерация',
  ready: 'Готовы',
  published: 'Опублик.',
  failed: 'Ошибки',
}

const GEN_DAY_OPTIONS = [1, 2, 3, 5, 7, 10, 14] as const
const POSTS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

function HorizonPicker({
  days,
  postsPerDay,
  onChange,
}: {
  days: number
  postsPerDay: number
  onChange: (d: number) => void
}) {
  const slots = 14
  const filled = Math.min(days, slots)
  const totalPosts = days * postsPerDay

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl bg-[color-mix(in_srgb,var(--glass-text)_4%,transparent)] ring-1 ring-[var(--glass-border)] px-3 pt-4 pb-3">
        <div className="flex items-end justify-between gap-0.5 h-16 mb-2">
          {Array.from({ length: slots }, (_, i) => {
            const active = i < filled
            const isToday = i === 0
            const height = 28 + (i % 3) * 8 + (active ? 12 : 0)
            return (
              <motion.button
                key={i}
                type="button"
                aria-label={`День ${i + 1}`}
                onClick={() => onChange(Math.min(i + 1, 14))}
                className="relative flex-1 min-w-0 flex flex-col items-center justify-end gap-1 group"
                whileTap={{ scale: 0.92 }}
              >
                <motion.div
                  className="w-full max-w-[18px] rounded-t-md origin-bottom"
                  animate={{
                    height,
                    background: active
                      ? 'linear-gradient(180deg, color-mix(in srgb, var(--glass-accent) 85%, white) 0%, var(--glass-accent) 100%)'
                      : 'color-mix(in srgb, var(--glass-text) 8%, transparent)',
                    boxShadow: active
                      ? '0 0 12px color-mix(in srgb, var(--glass-accent) 45%, transparent)'
                      : 'none',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
                {isToday && (
                  <span className="text-[9px] font-medium uppercase tracking-wide text-[var(--glass-accent)]">
                    сегодня
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        <motion.div
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--glass-accent)] to-transparent"
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />

        <div className="flex items-center justify-between text-[11px] text-[var(--glass-hint)]">
          <span>Горизонт очереди</span>
          <motion.span
            key={`${days}-${postsPerDay}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-[var(--glass-text)]"
          >
            ~{totalPosts} пост{totalPosts % 10 === 1 && totalPosts !== 11 ? '' : totalPosts % 10 >= 2 && totalPosts % 10 <= 4 && (totalPosts < 10 || totalPosts > 20) ? 'а' : 'ов'}
          </motion.span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {GEN_DAY_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
              days === n
                ? 'bg-[var(--glass-accent)] text-[#041510] shadow-[0_4px_14px_-4px_rgba(16,185,129,0.55)]'
                : 'bg-[color-mix(in_srgb,var(--glass-text)_6%,transparent)] text-[var(--glass-hint)] ring-1 ring-[var(--glass-border)]'
            }`}
          >
            {n} дн.
          </button>
        ))}
      </div>
    </div>
  )
}

function PostsPerDayPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {POSTS_OPTIONS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-8 min-w-[2rem] rounded-lg px-2 text-xs font-mono font-semibold transition-all active:scale-95 ${
            value === n
              ? 'bg-[var(--glass-accent)] text-[#041510]'
              : 'bg-[color-mix(in_srgb,var(--glass-text)_5%,transparent)] text-[var(--glass-hint)] ring-1 ring-[var(--glass-border)]'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
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
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    if (autopilot) {
      setPostsPerDay(autopilot.posts_per_day)
      setGenDays(autopilot.generation_days)
    }
  }, [autopilot])

  if (!autopilot) return null

  const running = autopilot.enabled && !autopilot.paused
  const stats = Object.entries(autopilot.queue_stats).filter(([, v]) => v > 0)
  const dirty =
    postsPerDay !== autopilot.posts_per_day || genDays !== autopilot.generation_days

  const saveConfig = async () => {
    setBusy(true)
    try {
      await api.patchAutopilot({ posts_per_day: postsPerDay, generation_days: genDays })
      await onUpdate()
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1600)
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
        <div className="flex items-center gap-3 mb-3">
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
                <span className="font-mono text-lg font-semibold">{v}</span>
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
          trailing={running ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
        >
          {running ? 'Поставить на паузу' : 'Запустить'}
        </GlassButton>
      </GlassCard>

      <GlassCard
        title="Параметры"
        action={
          dirty && (
            <span className="text-[10px] uppercase tracking-wider text-[var(--glass-warning)]">
              не сохранено
            </span>
          )
        }
      >
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--glass-hint)] m-0 mb-2">
              Постов в день
            </p>
            <PostsPerDayPicker value={postsPerDay} onChange={setPostsPerDay} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--glass-hint)] m-0 mb-1">
              Глубина генерации
            </p>
            <p className="text-[11px] text-[var(--glass-hint)] m-0 mb-3">
              Сколько дней вперёд наполнять очередь
            </p>
            <HorizonPicker days={genDays} postsPerDay={postsPerDay} onChange={setGenDays} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--glass-border)]">
            <AnimatePresence mode="wait">
              {savedFlash && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-[var(--glass-success)]"
                >
                  Сохранено
                </motion.span>
              )}
            </AnimatePresence>
            <GlassButton
              size="sm"
              variant={dirty ? 'primary' : 'secondary'}
              onClick={saveConfig}
              disabled={busy || !dirty}
              trailing={<RocketLaunch size={13} weight="light" />}
            >
              Сохранить
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
